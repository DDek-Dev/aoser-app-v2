import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    TouchableWithoutFeedback,
    Platform,
    Keyboard,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FormInput from 'components/ui/Input';
import * as ImagePicker from 'expo-image-picker';
import { useMyProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import Header_back from 'components/ui/Header_back';
import { FileWithType } from 'types';
import { getPresignedUrls, uploadFileToUrl } from 'api/uploadUtils';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { profileImage } from 'assets';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

const EditAoserProfile = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileImg, setProfileImg] = useState<string>('');
    const [profileImageFile, setProfileImageFile] = useState<FileWithType | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Validation errors
    const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
    });

    // API hooks
    const { data, isLoading } = useMyProfile();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateMyProfile();

    // Load existing profile data
    useEffect(() => {
        if (data) {
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setProfileImg(data.userProfileImage ? `${IMAGES_BASE_URL}${data.userProfileImage}` : '');
        }
    }, [data]);

    const validateForm = () => {
        const newErrors = {
            firstName: !firstName.trim(),
            lastName: !lastName.trim(),
        };

        setErrors(newErrors);
        return !newErrors.firstName && !newErrors.lastName;
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const uploadProfileImage = async (): Promise<string> => {
        if (!profileImageFile) {
            if (profileImg.startsWith('http')) {
                return profileImg.replace(IMAGES_BASE_URL || '', '');
            }
            return profileImg;
        }
        setIsUploading(true);
        try {
            // Get presigned URL
            const presignedUrls = await getPresignedUrls([{
                name: profileImageFile.name,
                type: profileImageFile.type,
            }]);

            // Upload the file
            await uploadFileToUrl(
                presignedUrls[0].url,
                profileImageFile.uri,
                presignedUrls[0].contentType
            );

            return presignedUrls[0].filename;
        } catch (error) {
            console.log('Image upload error:', error);
            throw new Error(t('editProfile.upload_error'));
        } finally {
            setIsUploading(false);
        }
    };

    const handleUpdate = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // First upload image if there's a new one
            let finalProfileImage = profileImg;
            if (profileImageFile) {
                finalProfileImage = await uploadProfileImage();
            }

            const profileData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                userProfileImage: finalProfileImage,
            };

            updateProfile(profileData, {
                onSuccess: () => {
                    Toast.show({
                        type: ALERT_TYPE.SUCCESS,
                        title: t('editProfile.success'),
                        textBody: t('editProfile.profile_updated'),
                    })
                },
                onError: (error) => {
                    Toast.show({
                        type: ALERT_TYPE.DANGER,
                        title: t('editProfile.oops'),
                        textBody: t('editProfile.update_failed'),
                    })
                },
            });

        } catch (error) {
            console.log('Update error:', error);
            Toast.show({
                type: ALERT_TYPE.DANGER,
                title: t('editProfile.oops'),
                textBody: t('editProfile.update_failed'),
            })
        }
    };

    const handleImageChange = (file?: FileWithType) => {
        if (file) {
            setProfileImageFile(file);
            setProfileImg(file.uri);
        } else {
            setProfileImageFile(null);
            setProfileImg('');
        }
    };

    const pickImage = async () => {
        try {
            // Request permissions
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    t('editProfile.permission_required'),
                    t('editProfile.permission_message')
                );
                return;
            }

            // Launch image picker with updated API
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const uriParts = asset.uri.split('.');
                const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
                const fileName = `profile_${Date.now()}.${fileExtension}`;

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
        } catch (error) {
            console.log('Image picker error:', error);
            Alert.alert(
                t('editProfile.error'),
                t('editProfile.pick_image_error')
            );
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    const isProcessing = isUpdating || isUploading;

    return (
        <ScreenWrapper safeEdges={['top', 'bottom']}>
            <Header_back
                text={t('editProfile.edit_profile')}
                onPress={handleBack}
                iconColor='#3B82F6'
                backgroundColor='bg-surface'
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={{ flex: 1 }}>
                        {/* Scrollable Content */}
                        <ScrollView
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ 
                                flexGrow: 1,
                                paddingBottom: Platform.OS === 'ios' ? 100 : 80 
                            }}
                        >
                            <View className='px-4 pb-4'>
                                {/* Profile Image Section */}
                                <View className="items-center mt-4">
                                    <View className="relative">
                                        <Image
                                            source={
                                                profileImg
                                                    ? { uri: profileImg }
                                                    : profileImage
                                            }
                                            className="w-28 h-28 rounded-full"
                                            defaultSource={profileImage}
                                        />
                                        <TouchableOpacity
                                            onPress={pickImage}
                                            className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full border-2 border-white"
                                            disabled={isProcessing}
                                        >
                                            <Ionicons name="camera" size={16} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-center text-textSecondary text-caption mt-2">
                                        {profileImageFile
                                            ? t('editProfile.new_image_selected')
                                            : t('editProfile.profile_photo_help')
                                        }
                                    </Text>
                                </View>

                                {/* First Name Input */}
                                <View className="mt-8">
                                    <FormInput
                                        label={t('editProfile.first_name')}
                                        placeholder={t('editProfile.first_name_placeholder')}
                                        value={firstName}
                                        onChangeText={(text) => {
                                            setFirstName(text);
                                            if (errors.firstName && text.trim()) {
                                                setErrors(prev => ({ ...prev, firstName: false }));
                                            }
                                        }}
                                        inputClassName={errors.firstName ? 'border-error' : 'border-border'}
                                        required
                                        isValidate={errors.firstName ? t('editProfile.first_name_required') : ''}
                                        editable={!isProcessing}
                                    />
                                </View>
                                <View className="mt-8">
                                   {/* <GenderInput
                control={control}
                error={errors.gender}
                modalVisible={genderModalVisible}
                setModalVisible={setGenderModalVisible}
                disabled={isLoading}
              /> */}
                                </View>

                                {/* Last Name Input */}
                                <View className="mt-4">
                                    <FormInput
                                        label={t('editProfile.last_name')}
                                        placeholder={t('editProfile.last_name_placeholder')}
                                        value={lastName}
                                        onChangeText={(text) => {
                                            setLastName(text);
                                            if (errors.lastName && text.trim()) {
                                                setErrors(prev => ({ ...prev, lastName: false }));
                                            }
                                        }}
                                        inputClassName={errors.lastName ? 'border-error' : 'border-border'}
                                        required
                                        isValidate={errors.lastName ? t('editProfile.last_name_required') : ''}
                                        editable={!isProcessing}
                                    />
                                </View>
                            </View>
                        </ScrollView>

                        {/* Action Buttons - Fixed at bottom */}
                        <View 
                            style={{ 
                                paddingBottom: Platform.OS === 'ios' ? insets.bottom : 20,
                                backgroundColor: 'white'
                            }}
                            className="px-4 pt-4 "
                        >
                            <View className='flex-row gap-4'>
                                <TouchableOpacity
                                    onPress={handleBack}
                                    className="bg-textSecondary py-4 rounded-full items-center flex-1"
                                    disabled={isProcessing}
                                >
                                    <Text className="text-white text-base font-semibold">
                                        {t('editProfile.cancel')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleUpdate}
                                    className={`${isProcessing ? 'bg-gray-400' : 'bg-primary'} py-4 rounded-full items-center flex-1`}
                                    disabled={isProcessing}
                                >
                                    <Text className="text-white text-base font-semibold">
                                        {isProcessing ? t('editProfile.processing') : t('editProfile.update')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

export default EditAoserProfile;