import { use, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import FormInput from 'components/ui/Input';
import { useAoserProfile } from 'hooks/useFreelancerKYC';
import { useMyProfile } from 'hooks/useFreelancer';
import { FileWithType } from 'types';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { useTranslation } from 'react-i18next';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;
type Props = {
    userId: string;
    setUserId: (userId: string) => void;
    firstName: string;
    lastName: string;
    profileImg: FileWithType | null;
    setFirstName: (firstName: string) => void;
    setLastName: (lastName: string) => void;
    setProfileImg: (profileImg: FileWithType | null) => void;
    errors: {
        firstName?: boolean;
        lastName?: boolean;
        profileImg?: boolean;
    };
};

const AoserProfileSetting = ({
    userId,
    setUserId,
    firstName,
    lastName,
    setFirstName,
    setLastName,
    profileImg,
    setProfileImg,
    errors,
}: Props) => {
    const { data: profile, isLoading: isProfileLoading } = useAoserProfile();
    const { data: myProfile, isLoading: isMyProfileLoading, isError, error } = useMyProfile();
    const [isImageLoading, setIsImageLoading] = useState(false);

    const {t} = useTranslation();

    useEffect(() => {
        if (profile) {
            


            setUserId(profile._id);
            setFirstName(profile.firstName || '');
            setLastName(profile.lastName || '');

            if (profile.profileImg) {
                setProfileImg({
                    uri: profile.profileImg.uri,
                    name: "profile_existing.jpg",
                    type: "image/jpeg",
                });
            } else {
                setProfileImg(null);
            }

        } else if (myProfile) {
            setUserId(myProfile._id);
            setFirstName(myProfile.firstName || '');
            setLastName(myProfile.lastName || '');

            if (myProfile.userProfileImage) {
                setProfileImg({
                    uri: `${IMAGES_BASE_URL}${myProfile.userProfileImage}`,
                    name: "profile_existing.jpg",
                    type: "image/jpeg",
                });
            } else {
                setProfileImg(null);
            }
        }
    }, [myProfile, profile]);


    const handleImageChange = (file?: FileWithType) => {
        if (file) {
            console.log("file: ", file);

            setProfileImg(file ? file : null);
        } else {

            setProfileImg(null);
        }
    };
    const pickImage = async () => {
        setIsImageLoading(true);
        try {
            // Request permissions
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
           
                Toast.show({
                    type: ALERT_TYPE.DANGER,
                    title: `${t('editProfile.permission_required')}`,
                    textBody: t('editProfile.permission_message'),
                });
                setIsImageLoading(false);
                return;
            }

            // Launch image picker with updated API
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], // ✅ Array format - compatible with all versions
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];

                // ✅ No need to check file existence with the new API
                // The URI returned from ImagePicker is always valid

                // Extract file extension from URI
                const uriParts = asset.uri.split('.');
                const fileExtension = uriParts[uriParts.length - 1].toLowerCase();

                // Create a file name
                const fileName = `profile_${Date.now()}.${fileExtension}`;

                // Determine MIME type based on file extension
                let mimeType = 'image/jpeg';
                if (fileExtension === 'png') {
                    mimeType = 'image/png';
                } else if (fileExtension === 'gif') {
                    mimeType = 'image/gif';
                } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
                    mimeType = 'image/jpeg';
                } else if (fileExtension === 'webp') {
                    mimeType = 'image/webp';
                }

                const fileWithType: FileWithType = {
                    uri: asset.uri,
                    name: fileName,
                    type: mimeType,
                };

                
                handleImageChange(fileWithType);
            }
            setIsImageLoading(false);
        } catch (error) {
            setIsImageLoading(false);

            console.log('Image picker error:', error);
            // Alert.alert(
            //     t('editProfile.error'),
            //     t('editProfile.pick_image_error')
            // );
        }
    };



    if (isProfileLoading || isMyProfileLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (isError) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-red-500">{t('kyc.aoser_profile.some_wrong')}</Text>
            </View>
        );
    }
    return (
        <View className="flex-1 bg-white px-5 pt-6">
            {/* Profile Image Section */}
            <View className="items-center mt-4">
                <View className="relative ">
                    {profileImg?.uri ? (
                        <Image
                            source={{ uri: profileImg?.uri }}
                            className={`w-28 h-28 rounded-full ${errors.profileImg ? "border-error" : "border-border"
                                }`}
                        />
                    ) : (
                        <View className={`w-28 h-28 rounded-full bg-gray-200 justify-center items-center border ${errors.profileImg ? 'border-error' : 'border-border'}`}>
                            <Ionicons name="person" size={40} color="gray" />
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={pickImage}
                        disabled={isImageLoading}
                        className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full border-2 border-white"
                    >
                        {isImageLoading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Ionicons name="camera" size={16} color="white" />
                        )}
                    </TouchableOpacity>
                </View>
                <Text className="text-center text-textSecondary text-caption mt-2">
                    {t('kyc.aoser_profile.describe_profile')}
                </Text>
            </View>

            {/* First Name Input */}
            <View className="mt-8">
                <FormInput
                    label={t('kyc.aoser_profile.first_name')}
                    placeholder="e.g. John"
                    value={firstName}
                    onChangeText={setFirstName}
                    inputClassName={errors.firstName ? 'border-error' : 'border-border'}
                    required
                    isValidate={errors.firstName ? `${t('kyc.aoser_profile.enter_first_name')}` : ""}
                />
            </View>

            {/* Last Name Input */}
            <View className="mt-4">
                <FormInput
                    label={t('kyc.aoser_profile.last_name')}
                    placeholder="e.g. Doe"
                    value={lastName}
                    onChangeText={setLastName}
                    inputClassName={errors.lastName ? 'border-error' : 'border-border'}
                    required
                    isValidate={errors.lastName ? `${t('kyc.aoser_profile.enter_last_name')}` : ''}
                />
            </View>
        </View>
    );
};

export default AoserProfileSetting;