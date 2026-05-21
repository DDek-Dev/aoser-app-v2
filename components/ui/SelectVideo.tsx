import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getInfoAsync } from 'expo-file-system/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import type { FileWithType } from 'types';
import * as FileSystem from 'expo-file-system/legacy';
interface Props {
  video: string | null;
  label: string;
  required?: boolean;
  onChange: (file?: FileWithType) => void;
}

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
}

const CONSTRAINTS = {
  MAX_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  MAX_DURATION_MS: 60000, // 60 seconds
  ALLOWED_FORMATS: ['mp4', 'mov', 'avi', 'm4v'] as const,
  VIDEO_QUALITY: 0.7,
} as const;

const MIME_TYPE_MAP: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/mp4',   // ← treat .mov as mp4 since iOS transcodes it
  m4v: 'video/mp4',
  avi: 'video/avi',
  webm: 'video/webm',
};
const PREVIEW_DURATION_MS = 5000;
const loadedVideoUriCache = new Set<string>();

const SelectVideo: React.FC<Props> = ({
  video,
  label,
  required = false,
  onChange
}) => {
  const { t } = useTranslation();
  const playerRef = useRef<any>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // const [isVideoLoading, setIsVideoLoading] = useState(() => !!video && !loadedVideoUriCache.has(video));
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    title: '',
    message: '',
  });
  const [isPlayerReady, setIsPlayerReady] = useState(false);


  console.log('video', video)


  const player = useVideoPlayer(null, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.muted = false;
    playerInstance.showNowPlayingNotification = false;
    playerInstance.staysActiveInBackground = false;
  });

  useEffect(() => {

    // setIsVideoLoading(!!video && !loadedVideoUriCache.has(video));
    setIsPlayerReady(false);
    setIsVideoLoading(
      !!video &&
      video.startsWith('http') &&  // ← only for remote URLs
      !loadedVideoUriCache.has(video)
    );
  }, [video]);

  const markVideoLoaded = () => {
    if (video) loadedVideoUriCache.add(video);
    setIsVideoLoading(false);
  };

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
      playerRef.current = null;
    };
  }, []);


  // 2. ใช้ useEffect จัดการการเปลี่ยน Video ด้วย replaceAsync
  useEffect(() => {
    // ตรวจสอบว่า player ยังมีตัวตนอยู่จริงและไม่ถูก release
    if (!player) return;


    const subscription = player.addListener('statusChange', ({ status }) => {
      console.log('📡 status changed:', status);
      if (status === 'readyToPlay') {
        setIsPlayerReady(true);
        player.currentTime = 0;
        player.play();
        console.log('▶️ play called on readyToPlay');


        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = setTimeout(() => {
          try { player.pause(); } catch (e) { }
        }, PREVIEW_DURATION_MS);
      }


    });



    const loadVideo = async () => {
      console.log('🎬 loadVideo called, video:', video);
      try {
        // if (video) {
        //   // ก่อนจะ replace ให้เช็คว่า player ยังใช้งานได้
        //   // การครอบด้วย try-catch ตรงนี้จะดัก Error "already released" ได้
        //   await player.replaceAsync({ uri: video, useCaching: true });
        //   console.log('✅ replaceAsync done');
        //   setIsPlayerReady(true);
        //   player.currentTime = 0;
        //   player.play();
        //   console.log('▶️ play called');

        //   if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        //   previewTimeoutRef.current = setTimeout(() => {
        //     try { player.pause(); } catch (e) { }
        //   }, PREVIEW_DURATION_MS);
        // } else {
        //   player.pause();
        // }

        if (video) {
          // ❌ useCaching can cause issues with local file:// URIs
          // await player.replaceAsync({ uri: video, useCaching: true });

          // ✅ no caching for local files
          const source = video.startsWith('http')
            ? { uri: video, useCaching: true }   // cache remote only
            : { uri: video };                     // local = no cache

          await player.replaceAsync(source);
          console.log('✅ replaceAsync done, status:', player.status);
          player.currentTime = 0;
          player.play();
          console.log('▶️ play called, playing:', player.playing);
        } else {
          player.pause();
        }
      } catch (e) {
        console.warn("Player was released before it could be updated", e);
        console.warn('Player error:', e);
        // ← add this to debug
        console.log('video uri was:', video);
        console.log('player status:', player?.status);
      }
    };

    loadVideo();

    return () => {
      subscription.remove();
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, [video, player]);


  const showModal = (title: string, message: string) => {
    setModalState({ visible: true, title, message });
  };

  const hideModal = () => {
    setModalState({ visible: false, title: '', message: '' });
  };

  const getFileExtension = (uri: string): string => {
    const parts = uri.split('.');
    return parts[parts.length - 1].toLowerCase();
  };

  const getMimeType = (extension: string): string => {
    return MIME_TYPE_MAP[extension] || 'video/mp4';
  };

  const validateFileSize = async (uri: string): Promise<boolean> => {
    try {
      const fileInfo = await getInfoAsync(uri);

      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      if (fileInfo.size && fileInfo.size > CONSTRAINTS.MAX_SIZE_BYTES) {
        showModal(
          t('selectVideo.fileTooLarge'),
          t('selectVideo.fileTooLargeMessage')
        );
        return false;
      }

      return true;
    } catch (error) {
      console.log('Error validating file size:', error);
      return false;
    }
  };

  const validateDuration = (duration?: number): boolean => {
    if (duration && duration > CONSTRAINTS.MAX_DURATION_MS) {
      showModal(
        t('selectVideo.videoTooLong'),
        t('selectVideo.videoTooLongMessage')
      );
      return false;
    }
    return true;
  };

  const validateFormat = (extension: string): boolean => {
    if (!CONSTRAINTS.ALLOWED_FORMATS.includes(extension as any)) {
      showModal(
        t('selectVideo.invalidFormat'),
        t('selectVideo.invalidFormatMessage')
      );
      return false;
    }
    return true;
  };

  const handlePickVideo = async () => {
    try {




      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showModal(
          t('selectVideo.permissionRequired'),
          t('selectVideo.permissionMessage')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        mediaTypes: ['videos'],
        allowsEditing: false,
        //quality: CONSTRAINTS.VIDEO_QUALITY,
        //videoMaxDuration: CONSTRAINTS.MAX_DURATION_MS / 1000,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const fileExtension = getFileExtension(asset.uri);

      // Validate format
      if (!validateFormat(fileExtension)) {
        return;
      }

      // Validate duration
      // if (!validateDuration(asset.duration)) {
      //   return;
      // }

      // Validate file size
      if (!(await validateFileSize(asset.uri))) {
        return;
      }

      const fileName = `video_${Date.now()}.${fileExtension}`;
      const mimeType = getMimeType(fileExtension);

      // const fileWithType: FileWithType = {
      //   uri: asset.uri,
      //   name: fileName,
      //   type: mimeType,
      // };

      const normalizeVideoUri = async (uri: string): Promise<string> => {
        const ext = uri.split('.').pop()?.toLowerCase();
        if (ext === 'mov') {
          // Copy to a .mp4 path — iOS will handle the container
          const newUri = `${FileSystem.cacheDirectory}video_${Date.now()}.mp4`;
          await FileSystem.copyAsync({ from: uri, to: newUri });
          console.log('🔄 Converted MOV to:', newUri);
          return newUri;
        }
        return uri;
      };

      const normalizedUri = await normalizeVideoUri(asset.uri);

      const fileWithType: FileWithType = {
        uri: normalizedUri,   // ← use normalized uri
        name: `video_${Date.now()}.mp4`,  // ← always .mp4
        type: 'video/mp4',
      };

      console.log('Selected video file:', {
        name: fileWithType.name,
        type: fileWithType.type,
        duration: asset.duration
          ? `${(asset.duration / 1000).toFixed(1)}s`
          : 'Unknown',
      });

      onChange(fileWithType);
    } catch (error) {
      console.log('Error processing video:', error);
      showModal(
        t('selectVideo.error'),
        t('selectVideo.errorMessage')
      );
      onChange(undefined);
    }
  };

  const handleRemoveVideo = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    try { playerRef.current?.pause?.(); } catch (error) { }
    playerRef.current = null;
    onChange(undefined);
  };

  return (
    <>
      <Text className="text-body font-bold text-text mb-2 mt-8">
        {label} {required && <Text className="text-error">*</Text>}
      </Text>

      <View className="relative">
        {video ? (
          <>
            {/* {player && (
              <VideoView
                player={player}
                style={styles.videoView}
                onFirstFrameRender={markVideoLoaded}
              />
            )} */}

            {video && player && isPlayerReady ? (
              <VideoView
                key={`video-player-${video}`}
                player={player}
                style={styles.videoView}
                nativeControls={true}
                allowsFullscreen={true}
                contentFit="cover"    // ← ADD THIS
                onFirstFrameRender={() => {
                  if (video) loadedVideoUriCache.add(video);
                  setIsVideoLoading(false);
                }}
              />
            ) : (
              <View style={styles.videoView} className="bg-gray-200 justify-center items-center">
                <ActivityIndicator />
              </View>
            )}
            {isVideoLoading && (
              <View style={styles.videoLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
            <TouchableOpacity
              onPress={handleRemoveVideo}
              className="absolute top-2 right-2 bg-primary p-1.5 rounded-full"
              accessibilityLabel={t('selectVideo.removeVideo')}
              accessibilityRole="button"
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={handlePickVideo}
            className="border border-dashed flex-col justify-center bg-blue-50 border-border rounded-xl p-4 items-center"
            style={styles.uploadButton}
            accessibilityLabel={t('selectVideo.uploadPrompt')}
            accessibilityRole="button"
          >
            <Ionicons name="videocam-outline" size={24} color="#9CA3AF" />
            <View className="flex-row gap-2 items-center mt-2">
              <Ionicons name="cloud-upload-outline" size={32} color="#9CA3AF" />
              <Text className="text-caption text-textSecondary">
                {t('selectVideo.uploadPrompt')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Custom Modal */}
      <Modal
        visible={modalState.visible}
        transparent
        animationType="fade"
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalState.title}</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{modalState.message}</Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={hideModal}
                style={styles.modalButton}
                accessibilityLabel={t('selectVideo.ok')}
                accessibilityRole="button"
              >
                <Text style={styles.modalButtonText}>
                  {t('selectVideo.ok')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  videoView: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  uploadButton: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SelectVideo;
