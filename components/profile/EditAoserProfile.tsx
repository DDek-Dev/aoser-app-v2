import { useEffect, useState, useCallback } from 'react';
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
    ActivityIndicator,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMyProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import Header_back from 'components/ui/Header_back';
import { District, FileWithType, Province } from 'types';
import { getPresignedUrls, uploadFileToUrl } from 'api/uploadUtils';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { profileImage } from 'assets';
import { useTranslation } from 'react-i18next';
import PhoneInput from 'components/ui/PhoneInput';
import { useSelectAddress } from 'hooks/useSelectAddress';
import Dropdown from 'components/filter/Dropdown';
import { useQueryClient } from 'node_modules/@tanstack/react-query/build/modern/QueryClientProvider';
import EditAoserProfileSkeleton from 'skeletonScreens/EditAoserProfileSkeleton';
import { requestMediaPermissionIfNeeded } from 'utils/mediaPicker';

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

type FormErrors = {
    // gender: boolean;
    firstName: boolean;
    lastName: boolean;
    phone: boolean;
    profileImage: boolean;
    province: boolean;
    district: boolean;
    village: boolean;
};

const MIME_MAP: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
};

const getMimeType = (uri: string): string => {
    const ext = uri.split('.').pop()?.toLowerCase() ?? '';
    return MIME_MAP[ext] ?? 'image/jpeg';
};

const buildFileWithType = (asset: ImagePicker.ImagePickerAsset, prefix: string): FileWithType => {
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    return {
        uri: asset.uri,
        name: `${prefix}_${Date.now()}.${ext}`,
        type: getMimeType(asset.uri),
    };
};

// ─────────────────────────────────────────────────────────────────────────────

const EditAoserProfile = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

    // ── Form state ────────────────────────────────────────────────────────────
    // const [gender, setGender] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Profile image — display URI (local or remote full URL)
    const [profileImg, setProfileImg] = useState('');
    // New file the user just picked (null = no new selection)
    const [profileImageFile, setProfileImageFile] = useState<FileWithType | null>(null);
    // Clean server filename to reuse when no new image is selected
    const [profileImageFilename, setProfileImageFilename] = useState('');

    // ── Address state ─────────────────────────────────────────────────────────
    const [selectedProvince, setSelectedProvince] = useState<Province | undefined>(undefined);
    const [selectedDistrict, setSelectedDistrict] = useState<District | undefined>(undefined);
    const [village, setVillage] = useState('');

    // ── UI state ──────────────────────────────────────────────────────────────
    const [isUploading, setIsUploading] = useState(false);
    const [genderModalVisible, setGenderModalVisible] = useState(false);
    const [imageActionModalVisible, setImageActionModalVisible] = useState(false);
    const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);

    const [errors, setErrors] = useState<FormErrors>({
        // gender: false,
        firstName: false,
        lastName: false,
        phone: false,
        profileImage: false,
        province: false,
        district: false,
        village: false,
    });

    const queryClient = useQueryClient();
    // ── API hooks ─────────────────────────────────────────────────────────────
    const { data: addressData, isLoading: addressLoading, error: addressError } = useSelectAddress();
    const { data, isLoading: profileLoading } = useMyProfile();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateMyProfile();

    // const GENDER_OPTIONS = [
    //     { label: t('signUpScreen.male'), value: 'MALE' },
    //     { label: t('signUpScreen.female'), value: 'FEMALE' },
    // ];

    // ── Populate form from server data ────────────────────────────────────────
    // FIX: removed duplicate `setVillage` call that existed outside the address block,
    //      and added `addressData` to dependency array so address lookup is stable.
    useEffect(() => {
        if (!data || !addressData) return;

        // setGender(data.gender ?? '');
        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setEmail(data.user?.email ?? '');
        setPhone(data.phone ?? '');
        setProfileImg(data.userProfileImage ? `${IMAGES_BASE_URL}${data.userProfileImage}` : '');
        setProfileImageFilename(data.userProfileImage ?? '');

        // Only restore address if not already set (avoids overwriting user changes on re-render)
        if (data.address && !selectedProvince) {
            const provinces = addressData[0]?.provinces ?? [];

            const matchedProvince = provinces.find(
                (p) =>
                    p.province_la === data.address?.province ||
                    p.province_en === data.address?.province,
            );

            if (matchedProvince) {
                setSelectedProvince(matchedProvince);

                const matchedDistrict = matchedProvince.districts.find(
                    (d) =>
                        d.district_la === data.address?.district ||
                        d.district_en === data.address?.district,
                );

                if (matchedDistrict) setSelectedDistrict(matchedDistrict);
            }

            setVillage(data.address?.village ?? '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, addressData]);
    // NOTE: `selectedProvince` intentionally omitted — we only want to restore
    // address data once on initial load, not on every province change.

    // ── Early returns (after all hooks) ──────────────────────────────────────
    // FIX: moved early returns to AFTER all hooks to avoid Rules-of-Hooks violation.
    if (profileLoading || addressLoading || !addressData) {
    return <EditAoserProfileSkeleton />;
}

    if (addressError || addressData.length === 0) {
        return (
            <View className="flex-1 justify-center items-center p-6">
                <Text className="text-subheading text-text mb-4">{t('kyc.step4.loading.title')}</Text>
                <View className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <Text className="text-body text-red-600">{t('kyc.step4.error')}</Text>
                </View>
            </View>
        );
    }

    // ── Derived data ──────────────────────────────────────────────────────────
    const provinces = addressData[0]?.provinces ?? [];
    const districts = selectedProvince?.districts ?? [];

    const provinceOptions = provinces.map((p) => ({ label: p.province_la, value: p }));
    const districtOptions = districts.map((d) => ({ label: d.district_la, value: d }));

    // const displayGender =
    //     GENDER_OPTIONS.find((opt) => opt.value === gender)?.label ??
    //     t('signUpScreen.selectGender');

    const hasImage = !!profileImg;
    const isProcessing = isUpdating || isUploading;

    // ── Validation ────────────────────────────────────────────────────────────
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {
            // gender: !gender.trim(),
            firstName: !firstName.trim(),
            lastName: !lastName.trim(),
            phone: !phone.trim(),
            profileImage: !profileImg,
            province: !selectedProvince,
            district: !selectedDistrict,
            village: !village.trim(),
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(Boolean);
    };

    const clearError = (key: keyof FormErrors) =>
        setErrors((prev) => ({ ...prev, [key]: false }));

    // ── Address helpers ───────────────────────────────────────────────────────
    const handleProvinceSelect = (province: Province) => {
        setSelectedProvince(province);
        setSelectedDistrict(undefined);
        setVillage('');
        clearError('province');
    };

    const handleDistrictSelect = (district: District) => {
        setSelectedDistrict(district);
        setVillage('');
        clearError('district');
    };

    const handleVillageChange = (text: string) => {
        setVillage(text);
        if (text.trim()) clearError('village');
    };

    // ── Image helpers ─────────────────────────────────────────────────────────
    const applyImageFile = (file: FileWithType | null) => {
        if (file) {
            setProfileImageFile(file);
            setProfileImg(file.uri);
            clearError('profileImage');
        } else {
            setProfileImageFile(null);
            setProfileImg('');
        }
    };

    const confirmDeleteImage = () => {
        applyImageFile(null);
        setProfileImageFilename('');
        setDeleteConfirmModalVisible(false);
        setImageActionModalVisible(false);
    };

    const pickFromGallery = async () => {
       const hasPermission = await requestMediaPermissionIfNeeded();
if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.length) {
            applyImageFile(buildFileWithType(result.assets[0], 'profile'));
            setImageActionModalVisible(false);
        }
    };

    const takePhoto = async () => {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
            Alert.alert(
                t('editProfile.camera_permission_required'),
                t('editProfile.camera_permission_message'),
            );
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.length) {
            applyImageFile(buildFileWithType(result.assets[0], 'profile_camera'));
            setImageActionModalVisible(false);
        }
    };

    // ── Upload ────────────────────────────────────────────────────────────────
    const uploadProfileImage = async (): Promise<string> => {
        if (!profileImageFile) return profileImageFilename;

        setIsUploading(true);
        try {
            const presignedUrls = await getPresignedUrls([
                { name: profileImageFile.name, type: profileImageFile.type },
            ]);

            await uploadFileToUrl(
                presignedUrls[0].url,
                profileImageFile.uri,
                presignedUrls[0].contentType,
            );

            const newFilename = presignedUrls[0].filename;
            setProfileImageFilename(newFilename);
            return newFilename;
        } catch (err) {
            console.log('Image upload error:', err);
            throw new Error(t('editProfile.upload_error'));
        } finally {
            setIsUploading(false);
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleUpdate = async () => {

        console.log("iphone clieked")
        if (!validateForm()) return;

        try {
            // FIX: unified image resolution into a single clear flow
            let finalProfileImage = profileImageFilename;

            if (profileImageFile) {
                finalProfileImage = await uploadProfileImage();
            }

            const profileData = {
                // gender: gender.trim(),
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim(),
                userProfileImage: finalProfileImage,
                address: {
                    province: selectedProvince?.province_la,
                    district: selectedDistrict?.district_la,
                    village: village.trim(),
                },
            };

            updateProfile(profileData, {
                onSuccess: () => {
                    // queryClient.invalidateQueries(['ProfileScreen']);
                    Toast.show({
                        type: ALERT_TYPE.SUCCESS,
                        title: t('editProfile.success'),
                        textBody: t('editProfile.profile_updated'),
                    });
                    queryClient.invalidateQueries({ queryKey: ['ProfileScreen'] });
                    setTimeout(() => navigation.goBack(), 500);
                },
                onError: (err) => {
                    console.log('Update error:', err);
                    Toast.show({
                        type: ALERT_TYPE.DANGER,
                        title: t('editProfile.oops'),
                        textBody: t('editProfile.update_failed'),
                    });
                },
            });
        } catch (err) {
            console.log('handleUpdate error:', err);
            Toast.show({
                type: ALERT_TYPE.DANGER,
                title: t('editProfile.oops'),
                textBody: t('editProfile.update_failed'),
            });
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <ScreenWrapper safeEdges={['top', 'bottom']}>
            <Header_back
                text={t('editProfile.edit_profile')}
                onPress={() => navigation.goBack()}
                iconColor="#3B82F6"
                backgroundColor="bg-surface"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
                style={{ flex: 1 }}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 0 : 20 }}
                >
                    <View className="px-6 py-6">

                        {/* ── Profile Image ───────────────────────────────── */}
                        <View className="items-center mb-6">
                            <View className="relative">
                                <TouchableOpacity
                                    onPress={() => setImageActionModalVisible(true)}
                                    disabled={isProcessing}
                                >
                                    <Image
                                        source={profileImg ? { uri: profileImg } : profileImage}
                                        defaultSource={profileImage}
                                        className={`w-32 h-32 rounded-full border-2 ${errors.profileImage ? 'border-error' : 'border-border'
                                            }`}
                                    />
                                    {!hasImage && (
                                        <View className="absolute bottom-0 right-0 bg-primary p-2 rounded-full border-2 border-white">
                                            <Ionicons name="camera" size={20} color="white" />
                                        </View>
                                    )}
                                </TouchableOpacity>

                                {/* {hasImage && (
                                    <TouchableOpacity
                                        onPress={() => setDeleteConfirmModalVisible(true)}
                                        className="absolute bottom-0 right-0 bg-error p-2 rounded-full border-2 border-white"
                                        disabled={isProcessing}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="white" />
                                    </TouchableOpacity>
                                )} */}
                            </View>

                            {errors.profileImage ? (
                                <Text className="text-error text-caption mt-2">
                                    {t('editProfile.profile_image_required')}
                                </Text>
                            ) : (
                                <Text className="text-center text-textSecondary text-caption mt-2">
                                    {profileImageFile
                                        ? t('editProfile.new_image_selected')
                                        : t('editProfile.profile_photo_help')}
                                </Text>
                            )}
                        </View>

                        {/* ── Gender ──────────────────────────────────────── */}
                        {/* <View className="mb-4">
                            <Text className="text-text mb-2 font-bold text-body">
                                {t('signUpScreen.gender')}
                            </Text>
                            <Pressable
                                onPress={() => !isProcessing && setGenderModalVisible(true)}
                                disabled={isProcessing}
                                className={`flex-row items-center justify-between px-4 py-5 rounded-2xl border ${errors.gender ? 'border-error' : 'border-border'
                                    }`}
                            >
                                <Text className={`text-body ${gender ? 'text-text' : 'text-gray-400'}`}>
                                    {displayGender}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#999" />
                            </Pressable>
                            {errors.gender && (
                                <Text className="text-error text-caption mt-1">
                                    {t('signUpScreen.gender_required')}
                                </Text>
                            )}
                        </View> */}

                        {/* ── Full Name ────────────────────────────────────── */}
                        <View className="flex-row mb-2">
                            <Text className="text-text font-bold text-body">
                                {t('signUpScreen.fullname')}
                            </Text>
                            <Text className="text-error"> *</Text>
                        </View>

                        <View className="mb-2">
                            <View
                                className={`flex-row items-center px-4 rounded-2xl border ${errors.firstName ? 'border-error' : 'border-border'
                                    }`}
                                    style={{ minHeight: 52 }} 
                            >
                                <TextInput
                                    placeholder={t('signUpScreen.firstName')}
                                    className="flex-1 text-text"
                                    value={firstName}
                                    onChangeText={(text) => {
                                        setFirstName(text);
                                        if (text.trim()) clearError('firstName');
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

                        <View className="mb-4">
                            <View
                                className={`flex-row items-center px-4  rounded-2xl border ${errors.lastName ? 'border-error' : 'border-border'
                                    }`}
                                    style={{ minHeight: 52 }} 
                            >
                                <TextInput
                                    placeholder={t('signUpScreen.lastName')}
                                    className="flex-1 text-text"
                                    value={lastName}
                                    onChangeText={(text) => {
                                        setLastName(text);
                                        if (text.trim()) clearError('lastName');
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

                        {/* ── Email (read-only) ────────────────────────────── */}
                        <Text className="text-text mb-2 font-bold text-body">
                            {t('signUpScreen.email')}
                        </Text>
                        <View className="mb-4">
                            <View className="flex-row items-center px-4  rounded-2xl border border-border bg-gray-100"   style={{ minHeight: 52 }} >
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

                        {/* ── Phone ────────────────────────────────────────── */}
                        <View className="mb-4">
                            <PhoneInput
                                label={t('kyc.step4.phoneNumber.label')}
                                value={phone}
                                onChangeText={(text) => {
                                    setPhone(text);
                                    if (text.trim()) clearError('phone');
                                }}
                                required
                                inputClassName={errors.phone ? 'border-error' : 'border-border'}
                                isValidate={errors.phone ? t('kyc.step4.phoneNumber.error') : ''}
                            />
                        </View>

                        {data?.businessType !== "FREELANCER"  &&
                            <>

                                {/* ── Address ──────────────────────────────────────── */}
                                <Text className="text-body text-text font-bold mb-2">
                                    {t('kyc.step4.location.title')}
                                </Text>

                                <View className="bg-blue-50 px-4 py-4 rounded-xl">
                                    <Dropdown
                                        label={t('kyc.step4.location.province.label')}
                                        value={selectedProvince?.province_la}
                                        placeholder={t('kyc.step4.location.province.placeholder')}
                                        options={provinceOptions}
                                        onSelect={handleProvinceSelect}
                                    />

                                    <Dropdown
                                        label={t('kyc.step4.location.district.label')}
                                        value={selectedDistrict?.district_la}
                                        placeholder={t('kyc.step4.location.district.placeholder')}
                                        options={districtOptions}
                                        onSelect={handleDistrictSelect}
                                        disabled={!selectedProvince}
                                    />

                                    <View className="mb-4">
                                        <Text className="text-body font-medium text-text mb-2">
                                            {t('kyc.step4.location.village.label')}
                                        </Text>
                                        <TextInput
                                            value={village}
                                            onChangeText={handleVillageChange}
                                            placeholder={t('kyc.step4.location.village.placeholder')}
                                            placeholderTextColor="#9CA3AF"
                                            editable={!!selectedDistrict}
                                            className={`px-4 py-4 rounded-lg border text-body ${selectedDistrict
                                                ? 'bg-surface border-border text-text'
                                                : 'bg-gray-100 border-gray-200 text-gray-400'
                                                } ${errors.village ? 'border-error' : ''}`}
                                        />
                                        {errors.village && (
                                            <Text className="text-caption text-error mt-1">
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
                            </>

                        }
                    </View>
                </ScrollView>

                {/* ── Fixed Bottom Buttons ─────────────────────────────────── */}
                <View
                    className="px-6 pt-4 bg-white"
                    style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : 20 }}
                >
                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            disabled={isProcessing}
                            className="bg-textSecondary py-4 rounded-2xl items-center flex-1"
                        >
                            <Text className="text-white font-semibold">{t('editProfile.cancel')}</Text>
                        </TouchableOpacity>

                        <Pressable
                            onPress={handleUpdate}
                            disabled={isProcessing}
                            className={`py-4 rounded-2xl items-center justify-center flex-1 ${isProcessing ? 'bg-gray-400' : 'bg-primary'
                                }`}
                        >
                            {isProcessing ? (
                                <View className="flex-row items-center">
                                    <ActivityIndicator color="white" size="small" />
                                    <Text className="text-white font-semibold ml-2">
                                        {t('editProfile.saving')}
                                    </Text>
                                </View>
                            ) : (
                                <Text className="text-white font-semibold">{t('editProfile.save')}</Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>

            {/* ════════════════════════════════════════════════════════════════ */}
            {/* Modals — kept outside ScrollView/KeyboardAvoidingView           */}
            {/* ════════════════════════════════════════════════════════════════ */}

            {/* Gender */}
            {/* <Modal
                visible={genderModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setGenderModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 justify-center items-center bg-black/40 px-8"
                    activeOpacity={1}
                    onPress={() => setGenderModalVisible(false)}
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
                                        clearError('gender');
                                        setGenderModalVisible(false);
                                    }}
                                    className={`py-4 ${index !== GENDER_OPTIONS.length - 1 ? 'border-b border-border' : ''
                                        }`}
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
            </Modal> */}

            {/* Image Action Sheet */}
            <Modal
                visible={imageActionModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setImageActionModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 justify-end bg-black/50"
                    activeOpacity={1}
                    onPress={() => setImageActionModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View className="bg-white rounded-t-3xl p-6 pb-12">
                            <Text className="text-center text-lg font-bold mb-6 text-text">
                                {t('editProfile.choose_image_source')}
                            </Text>

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

                            {/* {hasImage && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setImageActionModalVisible(false);
                                        setDeleteConfirmModalVisible(true);
                                    }}
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
                            )} */}

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

            {/* Delete Confirmation */}
            <Modal
                visible={deleteConfirmModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDeleteConfirmModalVisible(false)}
            >
                <TouchableOpacity
                    className="flex-1 justify-center items-center bg-black/50 px-6"
                    activeOpacity={1}
                    onPress={() => setDeleteConfirmModalVisible(false)}
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
                                    onPress={() => setDeleteConfirmModalVisible(false)}
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
        </ScreenWrapper>
    );
};

export default EditAoserProfile;