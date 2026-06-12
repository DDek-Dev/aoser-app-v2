import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native-gesture-handler';
import { requestMediaPermissionIfNeeded } from 'utils/mediaPicker';

type FileWithType = {
  uri: string;
  name: string;
  type: string;
};

type Props = {
  image: string | null;
  label?: string;
  defaultimg?: any;
  required?: boolean;
  inputClassName?: string;
  isValidate?: string;
  onChange: (file?: FileWithType) => void;
};

const SelectImage: React.FC<Props> = ({
  image,
  label,
  required,
  defaultimg,
  isValidate,
  inputClassName,
  onChange,
}) => {
  const { t } = useTranslation();
  const [imageActionModalVisible, setImageActionModalVisible] = useState(false);

  const hasImage = !!image;

  /* ------------------ Gallery ------------------ */
  const pickFromGallery = async () => {
    try {
    const hasPermission = await requestMediaPermissionIfNeeded();
if (!hasPermission) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';

        const fileWithType: FileWithType = {
          uri: asset.uri,
          name: `image_${Date.now()}.${ext}`,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        };

        onChange(fileWithType);
        setImageActionModalVisible(false);
      }
    } catch (e) {
      Alert.alert(t('editProfile.error'), t('editProfile.pick_image_error'));
    }
  };

  /* ------------------ Camera ------------------ */
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        const ext = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';

        const fileWithType: FileWithType = {
          uri: asset.uri,
          name: `camera_${Date.now()}.${ext}`,
          type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        };

        onChange(fileWithType);
        setImageActionModalVisible(false);
      }
    } catch (e) {
      Alert.alert(t('editProfile.error'), t('editProfile.camera_error'));
    }
  };

  const handleDeleteImage = () => {
    onChange(undefined);
    setImageActionModalVisible(false);
  };
  const handleRemove = () => {
    onChange(undefined);

  };

  return (
    <>
      {label && (
        <Text className="text-body font-bold text-text mb-2 mt-4">
          {label} {required && <Text className="text-error">*</Text>}
        </Text>
      )}

      {/* IMAGE AREA */}
      <View className="relative mb-4">
        {image ? (
          <View>


            <Pressable onPress={() => setImageActionModalVisible(true)}>
              <Image
                source={{ uri: image }}
                className="w-full h-64 rounded-md"
                resizeMode="cover"
              />
            </Pressable>
            <TouchableOpacity
              onPress={handleRemove}
              className="absolute top-2 right-2 bg-primary p-1.5 rounded-full"
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setImageActionModalVisible(true)}
            className={`border h-40 border-dashed bg-blue-50 rounded-xl p-4 flex-col justify-center items-center ${inputClassName}`}
          >
            <Ionicons name="image-outline" size={28} color="#9CA3AF" />
            <Text className="text-caption text-textSecondary mt-2">
              {t('selectVideo.upload_banner_Prompt')}
            </Text>
          </TouchableOpacity>
        )}

        {isValidate && (
          <Text className="text-caption text-error mt-1">{isValidate}</Text>
        )}
      </View>

      {/* ================= MODAL ================= */}
      <Modal
        visible={imageActionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setImageActionModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-end bg-black/50"
          activeOpacity={1}
          onPressOut={() => setImageActionModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-t-3xl p-6 pb-12">
              <Text className="text-center text-lg font-bold mb-6 text-text">
                {t('editProfile.choose_image_source')}
              </Text>

              {/* Take Photo */}
              <TouchableOpacity
                onPress={takePhoto}
                className="flex-row items-center py-4 border-b border-gray-200"
              >
                <View className="bg-blue-50 p-2 rounded-full mr-4">
                  <Ionicons name="camera" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-body font-medium text-text">
                    {t('editProfile.take_photo')}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {t('editProfile.take_photo_desc')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Gallery */}
              <TouchableOpacity
                onPress={pickFromGallery}
                className="flex-row items-center py-4 border-b border-gray-200"
              >
                <View className="bg-blue-50 p-2 rounded-full mr-4">
                  <Ionicons name="image" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-body font-medium text-text">
                    {t('editProfile.choose_from_gallery')}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {t('editProfile.choose_from_gallery_desc')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Delete */}
              {hasImage && (
                <TouchableOpacity
                  onPress={handleDeleteImage}
                  className="flex-row items-center py-4"
                >
                  <View className="bg-red-50 p-2 rounded-full mr-4">
                    <Ionicons name="trash-outline" size={24} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-body font-medium text-error">
                      {t('editProfile.delete_image')}
                    </Text>
                    <Text className="text-sm text-gray-500 mt-1">
                      {t('editProfile.delete_image_desc')}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Cancel */}
              <TouchableOpacity
                onPress={() => setImageActionModalVisible(false)}
                className="mt-6 py-3 rounded-full bg-gray-100 items-center"
              >
                <Text className="text-body font-medium text-gray-600">
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default SelectImage;
