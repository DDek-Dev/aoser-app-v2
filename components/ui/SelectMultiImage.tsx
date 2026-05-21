import React, { use, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export interface FileWithType {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

type Props = {
  label: string;
  images: FileWithType[]; // Changed from string[] to FileWithType[]
  onChange: (files: FileWithType[]) => void;
  inputClassName?: string;
  maxImages?: number;
};

const SelectMultiImage: React.FC<Props> = ({
  label,
  images,
  onChange,
  inputClassName,
  maxImages = 10 // Default maximum images
}) => {


  const [disabled, setDisabled] = React.useState(false);

  const { t } = useTranslation();
  useEffect(() => {
    if (images.length >= maxImages) {
      setDisabled(true);
    }
  }, [images]);
  const handlePickImage = async () => {
    try {
      // Check if we've reached max images
      if (images.length >= maxImages) {
        Alert.alert(`Maximum ${maxImages} images allowed`);
        return;
      }

      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: maxImages - images.length, // Limit based on remaining slots
        quality: 1,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.length) return;

      // Process selected images to get FileWithType objects
      const newFiles = await Promise.all(
        result.assets.map(async (asset) => {
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          if (!fileInfo.exists) {
            throw new Error(`File not found: ${asset.uri}`);
          }

          // Get file extension
          const uriParts = asset.uri.split('.');
          const fileExtension = uriParts[uriParts.length - 1].toLowerCase();

          // Generate unique filename
          const fileName = `image_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExtension}`;

          // Determine MIME type
          const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

          return {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
          } as FileWithType;
        })
      );

      // Combine with existing images
      onChange([...images, ...newFiles]);
    } catch (error) {
      console.log('Error selecting images:', error);
      // Alert.alert('Error', 'Failed to process images. Please try again.');
    }
  };

  const handleRemove = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    onChange(updated);
  };



  return (
    <View className="mb-4">
      <Text className="text-body font-bold text-text mb-2">
        {label} ({images.length}/{maxImages})
      </Text>

      <ScrollView horizontal={false}>
        {images.map((file, index) => (
          <View key={`${file.uri}-${index}`} className="mb-3 relative">
            <Image
              source={{ uri: file.uri }}
              className="w-full h-64 rounded-md border-primary border"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => handleRemove(index)}
              className="absolute top-2 right-2 bg-primary p-1.5 rounded-full"
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>


      {images.length < maxImages && (
        <TouchableOpacity
          disabled={disabled}
          onPress={handlePickImage}
          className={`bg-white border ${inputClassName} rounded-xl mb-4`}
        >




          {/* + {images.length > 0 ? t('kyc.step2.add_more') : (t('kyc.step2.select_image'))  ( */}


          {images.length > 0 ? (
            <Text className="text-caption text-primary font-semibold  px-4 py-4">
              + {t('kyc.step2.add_more')}
            </Text>
          ) : (
            <View className='border h-40 border-dashed border-border bg-blue-50 rounded-xl p-4 flex-col justify-center items-center'>
              <Ionicons name="cloud-upload-outline" size={32} color="#9CA3AF" />
              <Text className='text-textSecondary'>{t('kyc.step2.select_image')}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SelectMultiImage;