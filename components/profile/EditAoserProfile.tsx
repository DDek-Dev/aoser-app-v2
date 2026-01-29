import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    TextInput,
    Pressable,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMyProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import Header_back from 'components/ui/Header_back';
import { District, FileWithType, Province, SelectedAddress } from 'types';
import { getPresignedUrls, uploadFileToUrl } from 'api/uploadUtils';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { profileImage } from 'assets';
import { useTranslation } from 'react-i18next';
import PhoneInput from 'components/ui/PhoneInput';
import { useSelectAddress } from 'hooks/useSelectAddress';
import Dropdown from 'components/filter/Dropdown';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

const EditAoserProfile = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

    // Form state
    const [gender, setGender] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [profileImg, setProfileImg] = useState<string>('');
    const [profileImageFile, setProfileImageFile] = useState<FileWithType | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [genderModalVisible, setGenderModalVisible] = useState(false);
    const [imageActionModalVisible, setImageActionModalVisible] = useState(false);
    const [deleteConfirmationModalVisible, setDeleteConfirmationModalVisible] = useState(false);
    const [profileImageFilename, setProfileImageFilename] = useState<string>('');


    // address

    const [selectedProvince, setSelectedProvince] = useState<Province | undefined>(undefined);
    const [selectedDistrict, setSelectedDistrict] = useState<District | undefined>(undefined);


    const [village, setVillage] = useState('');
    const { data: addressData, isLoading: add_isLoading, error } = useSelectAddress();

    if(!addressData || add_isLoading){
        return <LoadingScreen />
    }
    // Validation errors
    const [errors, setErrors] = useState({
        gender: false,
        firstName: false,
        lastName: false,
        phone: false,
        profileImage: false,
        province: false,
        district: false,
        village: false,
    });

    // API hooks
    const { data, isLoading } = useMyProfile();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateMyProfile();

    console.log("USER DATA", JSON.stringify(data, null, 2));
    const GENDER_OPTIONS = [
        { label: t('signUpScreen.male'), value: 'MALE' },
        { label: t('signUpScreen.female'), value: 'FEMALE' },
    ];

    // Load existing profile data
    useEffect(() => {
        if (data) {
            setGender(data.gender || '');
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setEmail(data.user.email || '');
            setPhone(data.phone || '');

            // Store the full URL for display
            setProfileImg(data.userProfileImage ? `${IMAGES_BASE_URL}${data.userProfileImage}` : '');

            // Store the clean filename separately for updates
            setProfileImageFilename(data.userProfileImage || '');

if (data.address && !selectedProvince) {
            const provinces = addressData[0]?.provinces || [];
            
            // Find matching province
            const matchedProvince = provinces.find(
                p => p.province_la === data.address?.province || p.province_en === data.address?.province
            );

            if (matchedProvince) {
                setSelectedProvince(matchedProvince);
                
                // Find matching district within the province
                const matchedDistrict = matchedProvince.districts.find(
                    d => d.district_la === data.address?.district || d.district_en === data.address?.district
                );
                
                if (matchedDistrict) {
                    setSelectedDistrict(matchedDistrict);
                }
            }
            
            // Set village
            setVillage(data.address?.village || '');
        }
            
                setVillage(data.address?.village || '');
            
        }
    }, [data]);
    const validateForm = () => {
        const newErrors = {
            gender: !gender.trim(),
            firstName: !firstName.trim(),
            lastName: !lastName.trim(),
            phone: !phone.trim(),
            profileImage: !profileImg,
            province: !selectedProvince,
            district: !selectedDistrict,
            village: !village
        };

        setErrors(newErrors);
        return !newErrors.gender && !newErrors.firstName && !newErrors.lastName && !newErrors.phone && !newErrors.profileImage && !newErrors.province && !newErrors.district && !newErrors.village;

    };



    //address
    const handleAddressChange = (address: SelectedAddress) => {
        setSelectedProvince(address.province);
        setSelectedDistrict(address.district);
        // setVillage(address.village);
    };


    const handleProvinceSelect = (province: Province) => {
        setSelectedProvince(province);
        setSelectedDistrict(undefined);
        setVillage('');
        handleAddressChange({
            province,
            district: undefined,
            village: '',
            longitude: 0,
            latitude: 0
        });
    };

    const handleDistrictSelect = (district: District) => {
        setSelectedDistrict(district);
        setVillage('');
        handleAddressChange({
            province: selectedProvince,
            district,
            village: '',
            longitude: 0,
            latitude: 0
        });
    };

    const handleVillageChange = (text: string) => {
        setVillage(text);
        handleAddressChange({
            province: selectedProvince,
            district: selectedDistrict,
            village: text,
            longitude: 0,
            latitude: 0
        });
    };



    if (error || !addressData || addressData.length === 0) {
        return (
            <View>
                <Text className="text-subheading text-text mb-4">{t('kyc.step4.loading.title')}</Text>
                <View className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <Text className="text-body text-red-600">
                        {t('kyc.step4.error')}
                    </Text>
                </View>
            </View>
        );
    }

    const provinces = addressData[0]?.provinces || [];
    const districts = selectedProvince?.districts || [];

    const provinceOptions = provinces.map(province => ({
        label: province.province_la,
        value: province
    }));

    const districtOptions = districts.map(district => ({
        label: district.district_la,
        value: district
    }));
    const handleBack = () => {
        navigation.goBack();
    };
    const uploadProfileImage = async (): Promise<string> => {
        // If no new image was selected, return the existing filename
        if (!profileImageFile) {
            return profileImageFilename; // Just return the clean filename
        }

        // Upload new image
        setIsUploading(true);
        try {
            const presignedUrls = await getPresignedUrls([{
                name: profileImageFile.name,
                type: profileImageFile.type,
            }]);

            await uploadFileToUrl(
                presignedUrls[0].url,
                profileImageFile.uri,
                presignedUrls[0].contentType
            );

            // Update the filename state with new image
            const newFilename = presignedUrls[0].filename;
            setProfileImageFilename(newFilename);

            return newFilename;
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
            let finalProfileImage = '';

            console.log('DEBUG: Checking image status');
            console.log('profileImageFile exists:', !!profileImageFile);
            console.log('Current profileImg:', profileImg);
            console.log('data.userProfileImage:', data?.userProfileImage);

            if (profileImageFile) {
                // Upload new image
                console.log('Uploading new image...');
                finalProfileImage = await uploadProfileImage();
            } else {
                // No new image selected - extract filename from current URL or use existing
                if (data?.userProfileImage) {
                    // Use the clean filename from server
                    finalProfileImage = data.userProfileImage;
                    console.log('Using existing filename from server:', finalProfileImage);
                } else if (profileImg) {
                    // Extract filename from full URL
                    const urlParts = profileImg.split('/');
                    finalProfileImage = urlParts[urlParts.length - 1];
                    console.log('Extracted filename from URL:', finalProfileImage);
                } else {
                    // No image at all
                    finalProfileImage = '';
                    console.log('No image found');
                }
            }

            const profileData = {
                gender: gender.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
                userProfileImage: finalProfileImage, // Should be just the filename now
                address: {
                    province: selectedProvince?.province_la,
                    district: selectedDistrict?.district_la,
                    village: village
                }
            };

            console.log('Sending to server:', profileData);

            updateProfile(profileData, {
                onSuccess: () => {
                    Toast.show({
                        type: ALERT_TYPE.SUCCESS,
                        title: t('editProfile.success'),
                        textBody: t('editProfile.profile_updated'),
                    });
                    // Auto redirect back after success
                    setTimeout(() => {
                        navigation.goBack();
                    }, 500);
                },
                onError: (error) => {
                    console.log('Update error details:', error);
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
            if (errors.profileImage) {
                setErrors(prev => ({ ...prev, profileImage: false }));
            }
        } else {
            setProfileImageFile(null);
            setProfileImg('');
        }
    };

    const handleDeleteImage = () => {
        setDeleteConfirmationModalVisible(true);
    };

    const confirmDeleteImage = () => {
        handleImageChange();
        setDeleteConfirmationModalVisible(false);
        setImageActionModalVisible(false);
    };

    const pickFromGallery = async () => {
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    t('editProfile.permission_required'),
                    t('editProfile.permission_message')
                );
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
            Alert.alert(
                t('editProfile.error'),
                t('editProfile.pick_image_error')
            );
        }
    };

    const takePhoto = async () => {
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    t('editProfile.camera_permission_required'),
                    t('editProfile.camera_permission_message')
                );
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
            Alert.alert(
                t('editProfile.error'),
                t('editProfile.camera_error')
            );
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    const isProcessing = isUpdating || isUploading;
    const displayGender = GENDER_OPTIONS.find((opt) => opt.value === gender)?.label || t('signUpScreen.selectGender');
    const hasImage = !!profileImg;

    return (
        <ScreenWrapper safeEdges={['top', 'bottom']}>
            <Header_back
                text={t('editProfile.edit_profile')}
                onPress={handleBack}
                iconColor='#3B82F6'
                backgroundColor='bg-surface'
            />

            {/* <TouchableWithoutFeedback onPress={Keyboard.dismiss}> */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
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
                                        className={`w-32 h-32 rounded-full ${errors.profileImage ? 'border-2 border-error' : 'border-2 border-border'}`}
                                        defaultSource={profileImage}
                                    />
                                    {!hasImage && (
                                        <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-white">
                                            <Ionicons name="camera" size={20} color="white" />
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* Delete Icon (only shown when image exists) */}
                                {hasImage && (
                                    <TouchableOpacity
                                        onPress={handleDeleteImage}
                                        className="absolute bottom-0 right-0 bg-error p-2 rounded-full border-2 border-white"
                                        disabled={isProcessing}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            {errors.profileImage ? (
                                <Text className="text-error text-caption mt-2">{t('editProfile.profile_image_required')}</Text>
                            ) : (
                                <Text className="text-center text-textSecondary text-caption mt-2">
                                    {profileImageFile ? t('editProfile.new_image_selected') : t('editProfile.profile_photo_help')}
                                </Text>
                            )}
                        </View>

                        {/* Delete Confirmation Modal */}
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
                                        <View className="items-center mb-4">
                                            <View className="bg-red-100 p-4 rounded-full">
                                                <Ionicons name="warning-outline" size={40} color="#EF4444" />
                                            </View>
                                        </View>

                                        <Text className="text-center text-xl font-bold mb-2 text-text">
                                            {t('editProfile.delete_image_title')}
                                        </Text>

                                        <Text className="text-center text-gray-600 mb-6 text-body">
                                            {t('editProfile.delete_image_message')}
                                        </Text>

                                        <View className="flex-row gap-3">
                                            <TouchableOpacity
                                                onPress={() => setDeleteConfirmationModalVisible(false)}
                                                className="flex-1 py-3 rounded-xl border border-gray-300 items-center"
                                            >
                                                <Text className="text-body font-medium text-gray-700">
                                                    {t('common.cancel')}
                                                </Text>
                                            </TouchableOpacity>

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

                        {/* Gender Dropdown */}
                        <View className="mb-4">
                            <Text className="text-text mb-2 font-bold text-body">{t('signUpScreen.gender')}</Text>
                            <Pressable
                                onPress={() => !isProcessing && setGenderModalVisible(true)}
                                disabled={isProcessing}
                                className={`flex-row items-center justify-between px-4 py-5 rounded-2xl ${errors.gender ? 'border border-error' : 'border border-border'}`}
                            >
                                <Text className={`text-body ${gender ? 'text-text' : 'text-gray-400'}`}>
                                    {displayGender}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#999" />
                            </Pressable>
                            {errors.gender && (
                                <Text className="text-error text-caption mt-1">{t('signUpScreen.gender_required')}</Text>
                            )}
                        </View>

                        {/* Gender Selection Modal */}
                        <Modal
                            visible={genderModalVisible}
                            transparent
                            animationType="fade"
                            onRequestClose={() => setGenderModalVisible(false)}
                        >
                            <TouchableOpacity
                                className="flex-1 justify-center items-center bg-black/40 px-8"
                                activeOpacity={1}
                                onPressOut={() => setGenderModalVisible(false)}
                            >
                                <TouchableWithoutFeedback>
                                    <View className="bg-surface w-full rounded-2xl p-4">
                                        <Text className="text-center text-body font-bold mb-4 text-text">
                                            {t('signUpScreen.selectGender')}
                                        </Text>
                                        {GENDER_OPTIONS.map((option, index) => (
                                            <TouchableOpacity
                                                key={option.value}
                                                onPress={() => {
                                                    setGender(option.value);
                                                    setGenderModalVisible(false);
                                                    if (errors.gender) {
                                                        setErrors(prev => ({ ...prev, gender: false }));
                                                    }
                                                }}
                                                className={`py-4 ${index !== GENDER_OPTIONS.length - 1 ? 'border-b border-border' : ''}`}
                                            >
                                                <View className="flex-row items-center justify-between">
                                                    <Text className="text-body text-text">{option.label}</Text>
                                                    {gender === option.value && (
                                                        <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
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
                            <View className={`flex-row items-center px-4 py-2 rounded-2xl ${errors.firstName ? 'border border-error' : 'border border-border'}`}>
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
                            <View className={`flex-row items-center px-4 py-2 rounded-2xl ${errors.lastName ? 'border border-error' : 'border border-border'}`}>
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
                            <View className="flex-row items-center px-4 py-2 rounded-2xl border border-border bg-gray-100">
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
                        <View className="mb-4">
                            <PhoneInput
                                label={t('kyc.step4.phoneNumber.label')}
                                value={phone}
                                onChangeText={(text) => {
                                    setPhone(text);
                                    if (errors.phone && text.trim()) {
                                        setErrors(prev => ({ ...prev, phone: false }));
                                    }
                                }}
                                required
                                inputClassName={errors?.phone ? 'border-error' : 'border-border'}
                                isValidate={errors?.phone ? t('kyc.step4.phoneNumber.error') : ''}
                            />




                        </View>


                        {/* Address */}



                        <Text className="text-body text-text font-bold mb-2">{t('kyc.step4.location.title')} </Text>

                        <View className='bg-blue-50 px-4 py-4 rounded-xl'>
                            <Dropdown
                                label={t('kyc.step4.location.province.label')}
                                value={selectedProvince?.province_la}
                                placeholder={t('kyc.step4.location.province.placeholder')}
                                options={provinceOptions}
                                onSelect={handleProvinceSelect}
                            // error={errors?.province}
                            // errorMessage="Province is required"
                            />

                            <Dropdown
                                label={t('kyc.step4.location.district.label')}

                                value={selectedDistrict?.district_la}
                                placeholder={t('kyc.step4.location.district.placeholder')}
                                options={districtOptions}
                                onSelect={handleDistrictSelect}
                                disabled={!selectedProvince}
                            // error={errors?.district}
                            // errorMessage="District is required"
                            />

                            <View className="mb-4">
                                <Text className="text-body font-medium text-text mb-2">{t('kyc.step4.location.village.label')}</Text>
                                <TextInput
                                    value={village}
                                    onChangeText={handleVillageChange}
                                    placeholder={t('kyc.step4.location.village.placeholder')}
                                    className={`
                                                    px-4 py-4 rounded-lg border text-body
                                                    ${selectedDistrict
                                            ? 'bg-surface border-border text-text'
                                            : 'bg-gray-100 border-gray-200 text-gray-400'
                                        }
                                            ${errors?.village ? 'border-error' : ''}
                                            `}
                                    placeholderTextColor="#9CA3AF"
                                    editable={!!selectedDistrict}
                                />
                                {errors?.village && (
                                    <Text className="text-caption text-error mt-1">  {t('kyc.step4.location.village.error')}</Text>
                                )}
                                {!selectedDistrict && (
                                    <Text className="text-caption text-textSecondary mt-1">
                                        {t('kyc.step4.location.village.hint')}
                                    </Text>
                                )}
                            </View>


                        </View>
                    </View>
                </ScrollView>

                {/* Fixed Action Buttons */}
                <View
                    style={{
                        paddingBottom: Platform.OS === 'ios' ? insets.bottom : 20,
                        backgroundColor: 'white'
                    }}
                    className='px-6 pt-4'
                >
                    <View className='flex-row gap-4'>
                        <TouchableOpacity
                            onPress={handleBack}
                            className="bg-textSecondary py-4 rounded-2xl items-center flex-1"
                            disabled={isProcessing}
                        >
                            <Text className="text-white font-semibold">
                                {t('editProfile.cancel')}
                            </Text>
                        </TouchableOpacity>

                        <Pressable
                            onPress={handleUpdate}
                            className={`${isProcessing ? 'bg-gray-400' : 'bg-primary'} py-4 rounded-2xl items-center justify-center flex-1`}
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
                </View>
            </KeyboardAvoidingView>
            {/* </TouchableWithoutFeedback> */}
        </ScreenWrapper>
    );
};

export default EditAoserProfile;