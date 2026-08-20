import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getInfoAsync } from 'expo-file-system/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import type { FileWithType } from 'types';
import * as FileSystem from 'expo-file-system/legacy';
import { requestMediaPermissionIfNeeded } from 'utils/mediaPicker';

interface Props {
  video: string | null;
  label: string;
  required?: boolean;
  onChange: (file?: FileWithType) => void;
  inputClassName?: string;
  isValidate?: string;
}

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  
}

const CONSTRAINTS = {
  MAX_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  MAX_DURATION_MS: 20000,           // 20 seconds
  ALLOWED_FORMATS: ['mp4', 'mov', 'avi', 'm4v'] as const,
  VIDEO_QUALITY: 0.7,
} as const;

const MIME_TYPE_MAP: Record<string, string> = {
  mp4: 'video/mp4',
  mov: 'video/mp4',
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
  onChange,
  inputClassName,
  isValidate
}) => {
  const { t } = useTranslation();
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasPlayedRef = useRef(false);
  const videoRef = useRef(video);

  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    title: '',
    message: '',
  });

  // Keep videoRef in sync so markVideoLoaded doesn't close over stale value
  useEffect(() => {
    videoRef.current = video;
  }, [video]);

  const player = useVideoPlayer(null, (playerInstance) => {
    playerInstance.loop = false;
    playerInstance.muted = false;
    playerInstance.showNowPlayingNotification = false;
    playerInstance.staysActiveInBackground = false;
  });

  // Reset loading/ready state when video URI changes
  useEffect(() => {
    setIsPlayerReady(false);
    setIsVideoLoading(
      !!video &&
      video.startsWith('http') &&
      !loadedVideoUriCache.has(video)
    );
  }, [video]);

  const markVideoLoaded = () => {
    if (videoRef.current) loadedVideoUriCache.add(videoRef.current);
    setIsVideoLoading(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = null;
      }
    };
  }, []);

  // Effect 1: Register statusChange listener ONCE (player only, never torn down on video change)
  useEffect(() => {
    if (!player) return;

    const subscription = player.addListener('statusChange', ({ status }) => {
      console.log('📡 status changed:', status);

      // Guard: only play once per video load cycle
      if (status === 'readyToPlay' && !hasPlayedRef.current) {
        hasPlayedRef.current = true;
        setIsPlayerReady(true);
        markVideoLoaded();
        player.currentTime = 0;
        player.play();
        console.log('▶️ play called');

        if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
        previewTimeoutRef.current = setTimeout(() => {
          try { player.pause(); } catch (e) { }
        }, PREVIEW_DURATION_MS);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player]); // ← player only — listener survives video changes

  // Effect 2: Load video source when video URI changes
  useEffect(() => {
    if (!player) return;

    // Reset the play guard for the new video
    hasPlayedRef.current = false;
    setIsPlayerReady(false);

    const loadVideo = async () => {
      console.log('🎬 loadVideo called, video:', video);
      try {
        if (video) {
          const source = video.startsWith('http')
            ? { uri: video, useCaching: true } // cache remote only
            : { uri: video };                  // local = no cache

          await player.replaceAsync(source);
          console.log('✅ replaceAsync done');
          // ✅ Do NOT call play() here — statusChange listener handles it
        } else {
          try { player.pause(); } catch (e) { }
        }
      } catch (e) {
        console.warn('Player error:', e);
        console.log('video uri was:', video);
        console.log('player status:', player?.status);
      }
    };

    loadVideo();
  }, [video, player]);

  // ─── Validation helpers ───────────────────────────────────────────────────

  const showModal = (title: string, message: string) => {
    setModalState({ visible: true, title, message });
  };

  const hideModal = () => {
    setModalState({ visible: false, title: '', message: '' });
  };

  const validateFileSize = async (uri: string): Promise<boolean> => {
    try {
      const fileInfo = await getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error('File does not exist');
      if (fileInfo.size && fileInfo.size > CONSTRAINTS.MAX_SIZE_BYTES) {
        showModal(t('selectVideo.fileTooLarge'), t('selectVideo.fileTooLargeMessage'));
        return false;
      }
      return true;
    } catch (error) {
      console.log('Error validating file size:', error);
      return false;
    }
  };

  // ✅ Reads mimeType from asset first — reliable on iOS camera recordings.
  // iOS PHPicker gives 'video/quicktime' for .MOV files from the camera,
  // so URI extension parsing alone (.MOV uppercase) is not trustworthy.
  const getExtensionFromAsset = (asset: ImagePicker.ImagePickerAsset): string => {
    if (asset.mimeType) {
      if (asset.mimeType.includes('mp4')) return 'mp4';
      if (asset.mimeType.includes('quicktime') || asset.mimeType.includes('mov')) return 'mov';
      if (asset.mimeType.includes('avi')) return 'avi';
      if (asset.mimeType.includes('m4v')) return 'm4v';
    }
    // Fallback: parse URI — always lowercase to handle iOS uppercase .MOV
    return asset.uri.split('.').pop()?.toLowerCase() || 'mp4';
  };

  // ✅ Also handles 'quicktime' which iOS mimeType sometimes returns
  const validateFormat = (extension: string): boolean => {
    const normalizedExt = extension === 'quicktime' ? 'mov' : extension;
    if (!CONSTRAINTS.ALLOWED_FORMATS.includes(normalizedExt as any)) {
      showModal(t('selectVideo.invalidFormat'), t('selectVideo.invalidFormatMessage'));
      return false;
    }
    return true;
  };

  // ✅ Copy .mov → .mp4 path so upload always sends mp4
  // const normalizeVideoUri = async (uri: string): Promise<string> => {
  //   const ext = uri.split('.').pop()?.toLowerCase();
  //   if (ext === 'mov') {
  //     const newUri = `${FileSystem.cacheDirectory}video_${Date.now()}.mp4`;
  //     await FileSystem.copyAsync({ from: uri, to: newUri });
  //     console.log('🔄 Converted MOV to:', newUri);
  //     return newUri;
  //   }
  //   return uri;
  // };

  const normalizeVideoUri = async (uri: string): Promise<string> => {
    const ext = uri.split('.').pop()?.toLowerCase();
    if (ext === 'mov') {
      const newUri = `${FileSystem.cacheDirectory}video_${Date.now()}.mp4`;
      await FileSystem.copyAsync({ from: uri, to: newUri });

      // ✅ Verify the copy succeeded (iOS temp files can disappear)
      const info = await FileSystem.getInfoAsync(newUri);
      if (!info.exists) throw new Error('Failed to copy video file');

      console.log('🔄 Converted MOV to:', newUri);
      return newUri;
    }
    return uri;
  };
  // ─── Picker ──────────────────────────────────────────────────────────────

  const handlePickVideo = async () => {
    try {
      const hasPermission = await requestMediaPermissionIfNeeded();
      if (!hasPermission) {
        showModal(t('selectVideo.permissionRequired'), t('selectVideo.permissionMessage'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        allowsMultipleSelection: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      // ✅ mimeType-aware extension detection (handles iOS .MOV / quicktime)
      const fileExtension = getExtensionFromAsset(asset);

      if (!validateFormat(fileExtension)) return;
      if (!(await validateFileSize(asset.uri))) return;

      const normalizedUri = await normalizeVideoUri(asset.uri);

      const fileWithType: FileWithType = {
        uri: normalizedUri,
        name: `video_${Date.now()}.mp4`, // always .mp4 after normalization
        type: 'video/mp4',
      };

      console.log('Selected video:', {
        originalUri: asset.uri,
        normalizedUri,
        mimeType: asset.mimeType,
        extension: fileExtension,
        duration: asset.duration ? `${(asset.duration / 1000).toFixed(1)}s` : 'Unknown',
      });

      onChange(fileWithType);
    } catch (error) {
      console.log('Error processing video:', error);
      showModal(t('selectVideo.error'), t('selectVideo.errorMessage'));
      onChange(undefined);
    }
  };

  const handleRemoveVideo = () => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }
    try { player?.pause(); } catch (e) { }
    onChange(undefined);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <Text className="text-body font-bold text-text mb-2 mt-8">
        {label} {required && <Text className="text-error">*</Text>}
      </Text>

      <View className="relative">
        {video ? (
          <>
            {isPlayerReady ? (
              <VideoView
                key={`video-player-${video}`}
                player={player}
                style={styles.videoView}
                nativeControls={true}
                allowsFullscreen={true}
                contentFit="cover"
              />
            ) : (
              <View style={styles.videoView} className="bg-gray-200 justify-center items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
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
          <View>
          <TouchableOpacity
            onPress={handlePickVideo}
            className={`border h-40 border-dashed bg-blue-50 rounded-xl p-4 flex-col justify-center items-center ${inputClassName}`}
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
          {isValidate && (
            <Text className="text-caption text-error mt-1">{isValidate}</Text>
          )}
          </View>
        )}
      </View>

      {/* Error Modal */}
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
                <Text style={styles.modalButtonText}>{t('selectVideo.ok')}</Text>
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