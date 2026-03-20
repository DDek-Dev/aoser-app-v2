import { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Modal,
    TextInput,
    Pressable,
    Alert,
    TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAoserProfile } from 'hooks/useFreelancerKYC';
import { useMyProfile } from 'hooks/useFreelancer';
import { FileWithType } from 'types';
import { useTranslation } from 'react-i18next';
import { profileImage } from 'assets';
import PhoneInput from 'components/ui/PhoneInput';
import Dropdown from 'components/filter/Dropdown';
import { District, Province } from 'types';
import { useSelectAddress } from 'hooks/useSelectAddress';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

type Props = {
    userId: string;
    setUserId: (userId: string) => void;
    firstName: string;
    lastName: string;
    profileImg: FileWithType | null;
    gender: string;
    phone: string;
    province: string;
    district: string;
    village: string;
    setFirstName: (firstName: string) => void;
    setLastName: (lastName: string) => void;
    setProfileImg: (profileImg: FileWithType | null) => void;
    setGender: (gender: string) => void;
    setPhone: (phone: string) => void;
    setProvince: (value: string) => void;
    setDistrict: (value: string) => void;
    setVillage: (value: string) => void;
    errors: {
        firstName?: boolean;
        lastName?: boolean;
        profileImg?: boolean;
        gender?: boolean;
        phone?: boolean;
        province?: boolean;
        district?: boolean;
        village?: boolean;
    };
    prefillFromMyProfile?: boolean;
};

const AoserProfileSetting = ({
    userId,
    setUserId,
    firstName,
    lastName,
    profileImg,
    gender,
    phone,
    province,
    district,
    village,
    setFirstName,
    setLastName,
    setProfileImg,
    setGender,
    setPhone,
    setProvince,
    setDistrict,
    setVillage,
    errors,
    prefillFromMyProfile,
}: Props) => {
    const { data: profile, isLoading: isProfileLoading } = useAoserProfile(userId);

    const { t } = useTranslation();


    const [isImageLoading, setIsImageLoading] = useState(false);
    const [genderModalVisible, setGenderModalVisible] = useState(false);
    const [imageActionModalVisible, setImageActionModalVisible] = useState(false);
    const [deleteConfirmationModalVisible, setDeleteConfirmationModalVisible] = useState(false);
    const [selectedProvince, setSelectedProvince] = useState<Province | undefined>(undefined);
    const [selectedDistrict, setSelectedDistrict] = useState<District | undefined>(undefined);
    const initializedRef = useRef(false);
    const { data: addressData, isLoading: isAddressLoading, isError: isAddressError } = useSelectAddress();

    const GENDER_OPTIONS = [
        { label: t('signUpScreen.male'), value: 'MALE' },
        { label: t('signUpScreen.female'), value: 'FEMALE' },
    ];


    // Load profile data once. User edits should not be overwritten after initial hydration.
    // useEffect(() => {
    //     if (initializedRef.current) return;
    //     const myProfileAllowed = prefillFromMyProfile ? myProfile : undefined;
    //      if (!userId) return;
    //     if (!profile && !myProfileAllowed) return;

    //     const userIdValue = profile?._id || profile?.userId || myProfileAllowed?._id || '';
    //     const firstNameValue = profile?.firstName || myProfileAllowed?.firstName || '';
    //     const lastNameValue = profile?.lastName || myProfileAllowed?.lastName || '';
    //     const genderValue = profile?.gender || myProfileAllowed?.gender || '';
    //     const phoneValue = profile?.phone || myProfileAllowed?.phone || '';
    //     const provinceValue = profile?.address?.province || myProfileAllowed?.address?.province || '';
    //     const districtValue = profile?.address?.district || myProfileAllowed?.address?.district || '';
    //     const villageValue = profile?.address?.village || myProfileAllowed?.address?.village || '';

    //     setUserId(userIdValue);
    //     setFirstName(firstNameValue);
    //     setLastName(lastNameValue);
    //     setGender(genderValue);
    //     setPhone(phoneValue);
    //     setProvince(provinceValue);
    //     setDistrict(districtValue);
    //     setVillage(villageValue);

    //     if (profile?.profileImg?.uri) {
    //         setProfileImg({
    //             uri: profile.profileImg.uri,
    //             name: profile.profileImg.name || "profile_existing.jpg",
    //             type: profile.profileImg.type || "image/jpeg",
    //         });
    //     } else if (myProfileAllowed?.userProfileImage) {
    //         setProfileImg({
    //             uri: `${IMAGES_BASE_URL}${myProfileAllowed.userProfileImage}`,
    //             name: "profile_existing.jpg",
    //             type: "image/jpeg",
    //         });
    //     } else {
    //         setProfileImg(null);
    //     }

    //     initializedRef.current = true;
    // }, [myProfile, profile]);
    useEffect(() => {
        if (initializedRef.current) return;
        if (!userId) return;

        // No storage draft → parent already prefilled via props, nothing to do
        if (!profile) return;

        // Only runs when there IS a saved draft (returning to a step mid-KYC)
        // Storage draft takes priority over whatever parent set
        const userIdValue = profile._id || profile.userId || '';
        const firstNameValue = profile.firstName || '';
        const lastNameValue = profile.lastName || '';
        const genderValue = profile.gender || '';
        const phoneValue = profile.phone || '';
        const provinceValue = profile.address?.province || '';
        const districtValue = profile.address?.district || '';
        const villageValue = profile.address?.village || '';

        setUserId(userIdValue);
        setFirstName(firstNameValue);
        setLastName(lastNameValue);
        setGender(genderValue);
        setPhone(phoneValue);
        setProvince(provinceValue);
        setDistrict(districtValue);
        setVillage(villageValue);

        if (profile.profileImg?.uri) {
            setProfileImg({
                uri: profile.profileImg.uri,
                name: profile.profileImg.name || 'profile_existing.jpg',
                type: profile.profileImg.type || 'image/jpeg',
            });
        }

        initializedRef.current = true;
    }, [userId, profile]);

    useEffect(() => {
        const provinces = addressData?.[0]?.provinces || [];
        if (!provinces.length) {
            setSelectedProvince(undefined);
            setSelectedDistrict(undefined);
            return;
        }

        const matchedProvince = provinces.find((item) => item.province_la === province);

        if (!matchedProvince) {
            setSelectedProvince(undefined);
            setSelectedDistrict(undefined);
            return;
        }

        setSelectedProvince((prev) =>
            prev?.province_la === matchedProvince.province_la ? prev : matchedProvince
        );

        const matchedDistrict = matchedProvince.districts.find((item) => item.district_la === district);
        if (!matchedDistrict) {
            setSelectedDistrict(undefined);
            return;
        }

        setSelectedDistrict((prev) =>
            prev?.district_la === matchedDistrict.district_la ? prev : matchedDistrict
        );
    }, [addressData, province, district]);

    const handleProvinceSelect = (selected: Province) => {
        setSelectedProvince(selected);
        setSelectedDistrict(undefined);
        setProvince(selected.province_la);
        setDistrict('');
        setVillage('');
    };

    const handleDistrictSelect = (selected: District) => {
        setSelectedDistrict(selected);
        setDistrict(selected.district_la);
        setVillage('');
    };

    const handleImageChange = (file?: FileWithType) => {
        if (file) {
            setProfileImg(file);
        } else {
            setProfileImg(null);
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
        setIsImageLoading(true);
        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    t('editProfile.permission_required'),
                    t('editProfile.permission_message')
                );
                setIsImageLoading(false);
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
        } finally {
            setIsImageLoading(false);
        }
    };

    const takePhoto = async () => {
        setIsImageLoading(true);
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
                Alert.alert(
                    t('editProfile.camera_permission_required'),
                    t('editProfile.camera_permission_message')
                );
                setIsImageLoading(false);
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
        } finally {
            setIsImageLoading(false);
        }
    };

    if (isProfileLoading || isAddressLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (isAddressError || !addressData?.length) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Text className="text-red-500">{t('kyc.aoser_profile.some_wrong')}</Text>
            </View>
        );
    }

    const displayGender = GENDER_OPTIONS.find((opt) => opt.value === gender)?.label || t('signUpScreen.selectGender');
    const hasImage = !!profileImg?.uri;
    const provinces = addressData[0]?.provinces || [];
    const districts = selectedProvince?.districts || [];
    const provinceOptions = provinces.map((item) => ({
        label: item.province_la,
        value: item,
    }));
    const districtOptions = districts.map((item) => ({
        label: item.district_la,
        value: item,
    }));

    return (
        <View className="flex-1 bg-white px-5 pt-6">
            {/* Profile Image Section */}
            <View className="items-center mb-6">
                <View className="relative">
                    <TouchableOpacity
                        onPress={() => setImageActionModalVisible(true)}
                        disabled={isImageLoading}
                    >
                        <Image
                            source={
                                profileImg?.uri
                                    ? { uri: profileImg.uri }
                                    : profileImage
                            }
                            className={`w-32 h-32 rounded-full ${errors.profileImg ? 'border-2 border-error' : 'border-2 border-border'}`}
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
                            disabled={isImageLoading}
                        >
                            <Ionicons name="trash-outline" size={16} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                {errors.profileImg ? (
                    <Text className="text-error text-caption mt-2">{t('editProfile.profile_image_required')}</Text>
                ) : (
                    <Text className="text-center text-textSecondary text-caption mt-2">
                        {t('kyc.aoser_profile.describe_profile')}
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
                    onPress={() => setGenderModalVisible(true)}
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
                        onChangeText={setFirstName}
                        placeholderTextColor="#999"
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
                        onChangeText={setLastName}
                        placeholderTextColor="#999"
                    />
                </View>
                {errors.lastName && (
                    <Text className="text-error text-caption mt-1">
                        {t('signUpScreen.lastName_required')}
                    </Text>
                )}
            </View>

            {/* Phone Number Section */}
            <View className="mb-4">
                <PhoneInput
                    label={t('kyc.step4.phoneNumber.label')}
                    value={phone}
                    onChangeText={setPhone}
                    required
                    inputClassName={errors?.phone ? 'border-error' : 'border-border'}
                    isValidate={errors?.phone ? t('kyc.step4.phoneNumber.error') : ''}
                />
            </View>

            <View className="mb-2">
                <Dropdown
                    label={t('kyc.step4.location.province.label')}
                    value={selectedProvince?.province_la || province}
                    placeholder={t('kyc.step4.location.province.placeholder')}
                    options={provinceOptions}
                    onSelect={handleProvinceSelect}
                />
                {errors.province && (
                    <Text className="text-error text-caption mt-1">
                        {t('kyc.step4.location.province.error')}
                    </Text>
                )}
            </View>

            <View className="mb-2">
                <Dropdown
                    label={t('kyc.step4.location.district.label')}
                    value={selectedDistrict?.district_la || district}
                    placeholder={t('kyc.step4.location.district.placeholder')}
                    options={districtOptions}
                    onSelect={handleDistrictSelect}
                    disabled={!selectedProvince}
                />
                {errors.district && (
                    <Text className="text-error text-caption mt-1">
                        {t('kyc.step4.location.district.error')}
                    </Text>
                )}
            </View>

            <View className="mb-4">
                <Text className="text-body font-medium text-text mb-2">{t('kyc.step4.location.village.label')}</Text>

                <View className={`flex-row items-center px-4 py-2 rounded-2xl ${errors.village ? 'border border-error' : 'border border-border'}`}>
                    <TextInput
                        placeholder={t('kyc.step4.location.village.placeholder')}
                        className="flex-1 text-text"
                        value={village}
                        onChangeText={setVillage}
                        placeholderTextColor="#999"
                        editable={!!selectedDistrict}
                    />
                </View>
                {errors.village && (
                    <Text className="text-error text-caption mt-1">
                        {t('kyc.step4.location.village.error')}
                    </Text>
                )}
                {!selectedDistrict && (
                    <Text className="text-caption text-textSecondary mt-1">
                        {t('kyc.step4.location.village.hint')}
                    </Text>
                )}
            </View>
        </View>
    );
};

export default AoserProfileSetting;
