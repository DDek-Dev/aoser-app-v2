import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getInfoAsync } from 'expo-file-system/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTranslation } from 'react-i18next';
import type { FileWithType } from 'types';

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
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  m4v: 'video/x-m4v',
};

const SelectVideo: React.FC<Props> = ({ 
  video, 
  label, 
  required = false, 
  onChange 
}) => {
  const { t } = useTranslation();
  const playerRef = useRef<any>(null);
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    title: '',
    message: '',
  });

  const player = useVideoPlayer(
    video ? { uri: video } : null,
    (playerInstance) => {
      playerRef.current = playerInstance;
      playerInstance.loop = true;
      playerInstance.muted = true;
      playerInstance.play();
    }
  );

  useEffect(() => {
    return () => {
      playerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!player) return;

    if (video) {
      try {
        player.replace?.({ uri: video });
        player.play?.();
      } catch (error) {
        console.error('Error updating video source:', error);
      }
    } else {
      try {
        player.pause?.();
      } catch (error) {
        console.error('Error pausing player:', error);
      }
    }
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
      console.error('Error validating file size:', error);
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
        mediaTypes: ['videos'],
        allowsEditing: true,
        quality: CONSTRAINTS.VIDEO_QUALITY,
        videoMaxDuration: CONSTRAINTS.MAX_DURATION_MS / 1000,
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

      const fileWithType: FileWithType = {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
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
      console.error('Error processing video:', error);
      showModal(
        t('selectVideo.error'),
        t('selectVideo.errorMessage')
      );
      onChange(undefined);
    }
  };

  const handleRemoveVideo = () => {
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
            {player && (
              <VideoView
                player={player}
                style={styles.videoView}
              />
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