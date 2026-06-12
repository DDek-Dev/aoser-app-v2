import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    TextInput,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMyProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { District, FileWithType, Province, SelectedAddress } from 'types';
import { getPresignedUrls, uploadFileToUrl } from 'api/uploadUtils';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { profileImage } from 'assets';
import { useTranslation } from 'react-i18next';
import PhoneInput from 'components/ui/PhoneInput';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import Header_back from 'components/ui/Header_back';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

const ProfileSetup = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

    // Form state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [profileImg, setProfileImg] = useState<string>(''); // used ONLY for display
    const [originalProfileImage, setOriginalProfileImage] = useState<string>(''); // bare filename from DB, used for save
    const [profileImageFile, setProfileImageFile] = useState<FileWithType | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [imageActionModalVisible, setImageActionModalVisible] = useState(false);
    const [deleteConfirmationModalVisible, setDeleteConfirmationModalVisible] = useState(false);

    // Validation errors
    const [errors, setErrors] = useState({
        firstName: false,
        lastName: false,
        phone: false,
        profileImage: false,
    });

    // API hooks
    const { data, isLoading } = useMyProfile();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateMyProfile();

    // Load existing profile data
    useEffect(() => {
        if (data) {
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setEmail(data.user.email || '');
            setPhone(data.phone || '');

            // Keep the bare filename (what the API expects) separate from the display URL
            setOriginalProfileImage(data.userProfileImage || '');
            setProfileImg(data.userProfileImage ? `${IMAGES_BASE_URL}${data.userProfileImage}` : '');
        }
    }, [data]);

    const validateForm = () => {
        const newErrors = {
            firstName: !firstName.trim(),
            lastName: !lastName.trim(),
            phone: !phone.trim(),
            profileImage: !profileImg,
        };

        setErrors(newErrors);
        return !newErrors.firstName && !newErrors.lastName && !newErrors.phone && !newErrors.profileImage
    };

    if (isLoading) {
        return (
            <LoadingScreen />
        );
    }

    const uploadProfileImage = async (): Promise<string> => {
        // No new image picked -> just return whatever filename we already have
        // (could be the original filename, or '' if the user deleted the image)
        if (!profileImageFile) {
            return originalProfileImage;
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
            // Always go through uploadProfileImage:
            // - if a new file was picked, it uploads and returns the new filename
            // - if not, it returns the original filename (or '' if deleted) unchanged
            const finalProfileImage = await uploadProfileImage();

            const profileData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
                userProfileImage: finalProfileImage,
                privacyException: true,
                privacyVersion: Constants.expoConfig?.version
            };

            updateProfile(profileData, {
                onSuccess: async () => {
              
                    Toast.show({
                        type: ALERT_TYPE.SUCCESS,
                        title: t('editProfile.success'),
                        textBody: t('editProfile.profile_updated'),
                    });

                    navigation.popToTop();
                },
                onError: (error) => {
                    Toast.show({
                        type: ALERT_TYPE.DANGER,
                        title: t('editProfile.oops'),
                        textBody: t('editProfile.update_failed'),
                    });
                },
            });

        } catch (error) {
            console.log('Update error:', error);
            Toast.show({
                type: ALERT_TYPE.DANGER,
                title: t('editProfile.oops'),
                textBody: t('editProfile.update_failed'),
            });
        }
    };

    const handleImageChange = (file?: FileWithType) => {
        if (file) {
            setProfileImageFile(file);
            setProfileImg(file.uri);
        } else {
            // Image removed/deleted - clear everything, including the
            // remembered original filename so it doesn't get re-sent on save
            setProfileImageFile(null);
            setProfileImg('');
            setOriginalProfileImage('');
        }
    };

    // Function to delete current image
    const handleDeleteImage = () => {
        setDeleteConfirmationModalVisible(true);
    };

    const confirmDeleteImage = () => {
        handleImageChange(); // This will clear the image
        setDeleteConfirmationModalVisible(false);
        setImageActionModalVisible(false);
    };

    // Function to pick image from gallery
    const pickFromGallery = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                return;
            }

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
                setImageActionModalVisible(false);
            }
        } catch (error) {
            console.log('Image picker error:', error);
        }
    };

    // Function to take photo with camera
    const takePhoto = async () => {
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const uriParts = asset.uri.split('.');
                const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
                const fileName = `profile_camera_${Date.now()}.${fileExtension}`;

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
                setImageActionModalVisible(false);
            }
        } catch (error) {
            console.log('Camera error:', error);
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    const isProcessing = isUpdating || isUploading;
    const hasImage = !!profileImg; // Check if image exists

    return (
        <ScreenWrapper safeEdges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <Header_back text={t('protectedRoute.back')} onPress={() => navigation.replace('MainTabs')}
                    iconColor='#3B82F6' />
                {/* Scrollable Content */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingBottom: Platform.OS === 'ios' ? 0 : 20
                    }}
                >
                    <View className="px-6 py-6">
                        {/* Profile Image Section */}
                        <View className="items-center mb-6">
                            <View className="relative">

                                {/* Camera/Edit Icon */}
                                <TouchableOpacity
                                    onPress={() => setImageActionModalVisible(true)}
                                    disabled={isProcessing}
                                >
                                    <Image
                                        source={
                                            profileImg
                                                ? { uri: profileImg }
                                                : profileImage
                                        }
                                        className={`w-64 h-64 rounded-full ${errors.profileImage ? 'border border-error' : 'border border-border'}`}
                                        defaultSource={profileImage}
                                    />
                                    {!hasImage && (
                                        <Ionicons name={"camera"} size={24} color="#3B82F6" className='absolute bottom-0 right-0 ' />
                                    )}
                                </TouchableOpacity>

                                {/* Delete Icon (only shown when image exists) */}
                                {hasImage && (
                                    <TouchableOpacity
                                        onPress={handleDeleteImage}
                                        className="absolute bottom-0 right-0 bg-error p-1.5 rounded-full border-2 border-white"
                                        disabled={isProcessing}
                                    >
                                        <Ionicons name="trash-outline" size={14} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {errors.profileImage ? (
                                <Text className="text-error text-caption mt-1">{t('editProfile.profile_image_required')}</Text>
                            ) : (
                                <Text className="text-center text-textSecondary text-caption mt-2">
                                    {profileImageFile && t('editProfile.profile_photo_help')
                                    }
                                </Text>
                            )}
                        </View>

                        <Modal
                            visible={deleteConfirmationModalVisible}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setDeleteConfirmationModalVisible(false)}
                        >
                            <TouchableOpacity
                                className="flex-1 justify-center items-center bg-black/50 px-6"
                                activeOpacity={1}
                                onPressOut={() => setDeleteConfirmationModalVisible(false)}
                            >
                                <TouchableWithoutFeedback>
                                    <View className="bg-white w-full rounded-2xl p-6">
                                        {/* Warning Icon */}
                                        <View className="items-center mb-4">
                                            <View className="bg-red-100 p-4 rounded-full">
                                                <Ionicons name="warning-outline" size={40} color="#EF4444" />
                                            </View>
                                        </View>

                                        {/* Title */}
                                        <Text className="text-center text-xl font-bold mb-2 text-text">
                                            {t('editProfile.delete_image_title')}
                                        </Text>

                                        {/* Message */}
                                        <Text className="text-center text-gray-600 mb-6 text-body">
                                            {t('editProfile.delete_image_message')}
                                        </Text>

                                        {/* Buttons Container */}
                                        <View className="flex-row gap-3">
                                            {/* Cancel Button */}
                                            <TouchableOpacity
                                                onPress={() => setDeleteConfirmationModalVisible(false)}
                                                className="flex-1 py-3 rounded-xl border border-gray-300 items-center"
                                            >
                                                <Text className="text-body font-medium text-gray-700">
                                                    {t('common.cancel')}
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Delete Button */}
                                            <TouchableOpacity
                                                onPress={confirmDeleteImage}
                                                className="flex-1 py-3 rounded-xl bg-error items-center"
                                            >
                                                <Text className="text-body font-medium text-white">
                                                    {t('editProfile.delete_image')}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableWithoutFeedback>
                            </TouchableOpacity>
                        </Modal>

                        {/* Image Action Modal */}
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

                                        {/* Take Photo Option */}
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

                                        {/* Choose from Gallery */}
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

                                        {/* Delete Option (only if image exists) */}
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

                                        {/* Cancel Button */}
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

                        {/* First Name & Last Name Section */}
                        <View className='flex-row'>
                            <Text className="text-text mb-2 font-bold text-body">
                                {t('signUpScreen.fullname')}
                            </Text>
                            <Text className="text-error"> *</Text>
                        </View>

                        {/* First Name Input */}
                        <View className="mb-2">
                            <View
                                className={`flex-row items-center px-4 py-2 rounded-2xl ${errors.firstName ? 'border border-error' : 'border border-border'
                                    }`}
                                style={{ height: 52, minHeight: 52 }}
                            >
                                <TextInput
                                    placeholder={t('signUpScreen.firstName')}
                                    className="flex-1 text-text"
                                    value={firstName}
                                    onChangeText={(text) => {
                                        setFirstName(text);
                                        if (errors.firstName && text.trim()) {
                                            setErrors(prev => ({ ...prev, firstName: false }));
                                        }
                                    }}
                                    placeholderTextColor="#999"
                                    editable={!isProcessing}
                                />
                            </View>
                            {errors.firstName && (
                                <Text className="text-error text-caption mt-1">
                                    {t('signUpScreen.firstName_required')}
                                </Text>
                            )}
                        </View>

                        {/* Last Name Input */}
                        <View className="mb-4">
                            <View
                                className={`flex-row items-center px-4 py-2 rounded-2xl ${errors.lastName ? 'border border-error' : 'border border-border'
                                    }`}
                                style={{ height: 52, minHeight: 52 }}
                            >
                                <TextInput
                                    placeholder={t('signUpScreen.lastName')}
                                    className="flex-1 text-text"
                                    value={lastName}
                                    onChangeText={(text) => {
                                        setLastName(text);
                                        if (errors.lastName && text.trim()) {
                                            setErrors(prev => ({ ...prev, lastName: false }));
                                        }
                                    }}
                                    placeholderTextColor="#999"
                                    editable={!isProcessing}
                                />
                            </View>
                            {errors.lastName && (
                                <Text className="text-error text-caption mt-1">
                                    {t('signUpScreen.lastName_required')}
                                </Text>
                            )}
                        </View>

                        {/* Email Section (Read-only) */}
                        <Text className="text-text mb-2 font-bold text-body">
                            {t('signUpScreen.email')}
                        </Text>
                        <View className="mb-4">
                            <View style={{ height: 52, minHeight: 52 }} className="flex-row items-center px-4 py-2 rounded-2xl border border-border bg-gray-100">
                                <TextInput
                                    placeholder="aoser@example.com"
                                    className="flex-1 text-gray-500"
                                    value={email}
                                    placeholderTextColor="#999"
                                    editable={false}
                                />
                                <Ionicons name="lock-closed" size={16} color="#999" />
                            </View>
                        </View>

                        {/* Phone Number Section */}
                        <View className="mb-4" style={{ height: 52, minHeight: 52 }}>
                            <PhoneInput
                                label={t('kyc.step4.phoneNumber.label')}
                                value={phone}
                                onChangeText={setPhone}
                                required
                                inputClassName={errors?.phone ? 'border-error' : 'border-border'}
                                isValidate={errors?.phone ? t('kyc.step4.phoneNumber.error') : ''}
                            />
                        </View>

                    </View>
                </ScrollView>

                {/* Fixed Save Button - Outside ScrollView */}
                <View className='px-6 pb-6'>
                    <Pressable
                        onPress={handleUpdate}
                        className={`${isProcessing ? 'bg-gray-400' : 'bg-primary'} py-4 rounded-2xl items-center justify-center`}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <View className="flex-row items-center">
                                <ActivityIndicator color="white" size="small" />
                                <Text className="text-white font-semibold ml-2">
                                    {t('editProfile.saving')}
                                </Text>
                            </View>
                        ) : (
                            <Text className="text-white font-semibold">
                                {t('editProfile.save')}
                            </Text>
                        )}
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
};

export default ProfileSetup;