import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { selfie_with_card_png } from 'assets';
import { useTranslation } from 'react-i18next';

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
  onChange
}) => {


  const {t} = useTranslation();

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [16, 9],
      quality: 1,
      allowsMultipleSelection: false,
    });


    if (!result.canceled && result.assets?.length) {
      const asset = result.assets[0];

      try {
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        if (!fileInfo.exists) {
          throw new Error('File does not exist');
        }

        // Extract file extension
        const uriParts = asset.uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1].toLowerCase();

        // Create a file name
        const fileName = `image_${Date.now()}.${fileExtension}`;

        // Determine MIME type
        let mimeType = 'image/jpeg'; // default
        if (fileExtension === 'png') mimeType = 'image/png';
        else if (fileExtension === 'gif') mimeType = 'image/gif';
        else if (fileExtension === 'webp') mimeType = 'image/webp';

        const fileWithType: FileWithType = {
          uri: asset.uri,
          name: fileName,
          type: mimeType,
        };
        // console.log("fileWithType: ",fileWithType);

        onChange(fileWithType);
      } catch (error) {
        console.log('Error processing image:', error);
        onChange(undefined);
      }
    }
  };

  const handleRemoveImage = () => {
    onChange(undefined);
  };


  return (
    <>
      {label && (
        <Text className="text-body font-bold text-text mb-2">
          {label} {required && <Text className="text-error">*</Text>}
        </Text>
      )}

      <View className="relative mb-4">
        {image ? (
          <>
            <Image
              source={{ uri: image }}
              className="w-full h-64 rounded-md"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={handleRemoveImage}
              className="absolute top-2 right-2 bg-primary p-1.5 rounded-full"
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </>
        ) : defaultimg ? (
          <View>
            <TouchableOpacity
              onPress={handlePickImage}
              className={`border h-64 w-full border-dashed bg-blue-50 rounded-xl overflow-hidden ${inputClassName}`}
            >
              <Image
                source={defaultimg}
                className="w-full h-full"
                resizeMode="cover"
              />
            </TouchableOpacity>
            {isValidate && (
              <Text className="text-caption text-error mt-1">
                {isValidate}
              </Text>
            )}
          </View>
        ) : (
          <View>
            <TouchableOpacity
              onPress={handlePickImage}
              className={`border h-40 border-dashed bg-blue-50 rounded-xl p-4 flex-col justify-center items-center ${inputClassName}`}
            >
              <Ionicons name="image-outline" size={24} color="#9CA3AF" />
              {/* <Text className="text-caption text-textSecondary mt-2">
                Upload Banner Image (16:9)
              </Text> */}

              <View className='flex-row gap-2'>
              
                            <Ionicons name='cloud-upload-outline' size={32} color="#9CA3AF"/>
                            <Text className="text-caption text-textSecondary mt-2">
                              {t('selectVideo.upload_banner_Prompt')}
                            </Text>
                          </View>
            </TouchableOpacity>
            {isValidate && (
              <Text className="text-caption text-error mt-1">
                {isValidate}
              </Text>
            )}
          </View>
        )}
      </View>
    </>
  );
};

export default SelectImage;