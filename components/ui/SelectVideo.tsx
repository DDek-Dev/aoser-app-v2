import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FileWithType } from 'types';
import { useTranslation } from 'react-i18next';
import { Toast } from 'react-native-alert-notification';

type Props = {
  video: string | null;
  label: string;
  required?: boolean;
  onChange: (file?: FileWithType) => void;
};

const SelectVideo: React.FC<Props> = ({ video, label, required, onChange }) => {
  const playerRef = useRef<any>(null);

  // Initialize player only when video is valid
  const player = useVideoPlayer(
    video ? { uri: video } : null, // Use null instead of 'No found'
    (player) => {
      playerRef.current = player;
      player.loop = true;
      player.play();
      player.muted = true;
    }
  );
  const { t } = useTranslation();
  // Clean up player when component unmounts or video changes
  useEffect(() => {
    return () => {
      // Avoid calling native methods on potentially released player objects during unmount.
      // Simply clear the JS reference so we don't attempt further calls.
      playerRef.current = null;
    };
  }, []);

  // Handle video source changes
  useEffect(() => {
    if (player && video) {
      try {
        if (typeof player.replace === 'function') {
          player.replace({ uri: video });
        }
        if (typeof player.play === 'function') {
          player.play();
        }
      } catch (error) {
        console.log('Error updating video source:', error);
      }
    } else if (player) {
      // Pause and clear player if no video
      try {
        if (typeof player.pause === 'function') player.pause();
      } catch (error) {
        console.log('Error pausing player:', error);
      }
    }
  }, [video, player]);

  const handlePickVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    // if (!permissionResult.granted) {
    //  Alert.alert(t('selectVideo.permissionRequired'), t('selectVideo.permissionMessage'));
    //   return;
    // }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.7,
      videoMaxDuration: 60,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];

      try {
        // Get file info to check size
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }

        // Check file size
        const maxSize = 50 * 1024 * 1024;
        if (fileInfo.size && fileInfo.size > maxSize) {
          Alert.alert(
            t('selectVideo.fileTooLarge'),
            t('selectVideo.fileTooLargeMessage'),
            [{ text: t('selectVideo.ok') }]
          );
          return;
        }

        // Check duration
        if (asset.duration && asset.duration > 60000) {
          Alert.alert(
            t('selectVideo.videoTooLong'),
            t('selectVideo.videoTooLongMessage'),
            [{ text: t('selectVideo.ok') }]
          );
          return;
        }

        // Extract file extension
        const uriParts = asset.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1].toLowerCase();

        // Validate video format
        const allowedTypes = ['mp4', 'mov', 'avi', 'm4v'];
        if (!allowedTypes.includes(fileExtension)) {
          Alert.alert(
            t('selectVideo.invalidFormat'),
            t('selectVideo.invalidFormatMessage'),
            [{ text: t('selectVideo.ok') }]
          );
          return;
        }

        // Create a file name
        const fileName = `video_${Date.now()}.${fileExtension}`;

        // Determine MIME type
        let mimeType = 'video/mp4';
        if (fileExtension === 'mov') mimeType = 'video/quicktime';
        else if (fileExtension === 'avi') mimeType = 'video/x-msvideo';
        else if (fileExtension === 'm4v') mimeType = 'video/x-m4v';

        const fileWithType: FileWithType = {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        };

        console.log("Selected video file:", {
          name: fileWithType.name,
          type: fileWithType.type,
          duration: asset.duration ? `${(asset.duration / 1000).toFixed(1)}s` : 'Unknown'
        });

        onChange(fileWithType);
      } catch (error) {
        console.log('Error processing video:', error);
        Alert.alert(t('selectVideo.error'), t('selectVideo.errorMessage'));
        onChange(undefined);
      }
    }
  };

  const handleRemoveVideo = () => {
    // Clear JS reference to player to avoid calling into released native objects
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
            {/* Only render VideoView if player is available and video is valid */}
            {player && (
              <VideoView
                player={player}
                style={{ width: '100%', height: 200, borderRadius: 12 }}
              />
            )}
            <TouchableOpacity
              onPress={handleRemoveVideo}
              className="absolute top-2 right-2 bg-primary p-1.5 rounded-full"
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            onPress={handlePickVideo}
            className="border border-dashed flex-col justify-center bg-blue-50 border-border rounded-xl p-4 items-center"
            style={{ width: '100%', height: 200, borderRadius: 12 }}
          >
            <Ionicons name="videocam-outline" size={24} color="#9CA3AF" />

            <View className='flex-row gap-2'>

              <Ionicons name='cloud-upload-outline' size={32} color="#9CA3AF" />
              <Text className="text-caption text-textSecondary mt-2">
                {t('selectVideo.uploadPrompt')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export default SelectVideo;