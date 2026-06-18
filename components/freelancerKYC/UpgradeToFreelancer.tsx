import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TouchableWithoutFeedback, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import StepProgressFreelancerBar from 'components/ui/StepProgressFreelancerBar';
import UpgradeToFreelancerStep1 from './UpgradeToFreelancerStep1';
import UpgradeToFreelancerStep2 from './UpgradeToFreelancerStep2';
import UpgradeToFreelancerReview from './UpgradeToFreelancerReview';
import AoserProfileSetting from 'screens/profile/AoserProfileSetting';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useCreateFreelancer, useMyProfile, useUpdateFreelancerProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { FileWithType } from 'types';

import {
    saveFileToTemp,
    uploadFileInstant,
    uploadFilesInstant,
    AoserProfileData,
    Step1Data,
    Step2Data,


} from 'utils/fileStorage';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { UserProfile } from 'types/profile';
import { clearScopedKycData, getAllScopedStepData, getScopedStep, saveScopedStep } from 'utils/kycStorage';

// ─── Extended interfaces to support keeping existing remote files ─────────────
// When a user re-submits after rejection, images are already on the CDN.
// These extend the base fileStorage types to carry the existing filename so
// we can skip re-uploading and just pass the filename string through to the API.

interface AoserProfileDataExtended extends AoserProfileData {
    existingProfileImg?: string;
}

interface Step1DataExtended extends Step1Data {
    existingBannerImage?: string;
    existingPromoVideo?: string;
}

interface Step2DataExtended extends Step2Data {
    existingCertificates?: string[];
}

// ─────────────────────────────────────────────────────────────────────────────

// ⚠️ Replace this with your actual CDN base URL
// const CDN_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL; // e.g. 'https://cdn.example.com/uploads/'

interface ErrorState {
    [key: string]: boolean;
}

const IMAGES_URL = process.env.EXPO_PUBLIC_IMAGES_URL || "";

/** Build a remote FileWithType from a stored filename string */
const remoteFile = (filename: string | undefined, type: 'image' | 'video' = 'image'): FileWithType | null => {
    if (!filename) return null;

    let name = filename;
    let uri = filename;

    // If it's a full URL, extract the filename for 'name' property
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        const parts = filename.split('/');
        name = parts[parts.length - 1];
    } else if (filename && !filename.startsWith('file://')) {
        // If it's just a filename, prepend base URL for 'uri' so it can be displayed
        uri = `${IMAGES_URL}${filename}`;
    }

    const mimeType = type === 'video'
        ? 'video/mp4'
        : name.endsWith('.png') ? 'image/png' : 'image/jpeg';

    return {
        uri: uri,
        name: name,
        type: mimeType,
    };
};

const UpgradeToFreelancer = () => {

    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useTranslation();

    const { data: profileData, isLoading: profileLoading } = useMyProfile();
    const queryClient = useQueryClient();

    // ─── Registration mode flags ───────────────────────────────────────────────
    const isRejectedRegistration = profileData?.businessType === 'FREELANCER' && profileData?.registrationStatus === 'REJECTED';


    // ──────────────────────────────────────────────────────────────────────────

    // console.log("User profile:: ", JSON.stringify(profileData, null, 2))
    // Aoser profile (Step 0)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileImg, setProfileImg] = useState<FileWithType | null>(null);
    const [userId, setUserId] = useState('');
    // const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');

    const { mutate: updateProfile } = useUpdateMyProfile();

    const [aoserProfile, setAoserProfile] = useState<ErrorState>({
        firstName: false, lastName: false, profileImg: false,
        phone: false, province: false, district: false, village: false,
    });

    // Step 1
    const [jobTitle, setJobTitle] = useState('');
    const [bannerImageFile, setBannerImageFile] = useState<FileWithType | null>(null);
    const [promoVideoFile, setPromoVideoFile] = useState<FileWithType | null>(null);
    const [promoVideoTouched, setPromoVideoTouched] = useState(false);
    const [freelancerType, setFreelancerType] = useState('FULLTIME');
    const [category, setCategory] = useState('');
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [errorsStep1, setErrorsStep1] = useState<ErrorState>({ jobTitle: false, category: false, bannerImageFile: false, promoVideoFile:false, freelancerType: false });

    // Step 2
    const [aboutMe, setAboutMe] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [experiences, setExperiences] = useState<string[]>(['']);
    const [certificateImages, setCertificateImages] = useState<FileWithType[]>([]);
    const [errorsStep2, setErrorsStep2] = useState<ErrorState>({ aboutMe: false, skills: false, experiences: false });

    // Step 3
    const [serviceDesc, setServiceDesc] = useState('');
    const [hourlyRate, setHourlyRate] = useState(0);
    const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
    const [rateType, setRateType] = useState<'PER_HOUR' | 'PER_JOB' | 'PER_DAY'>('PER_HOUR');
    const [errorsStep3, setErrorsStep3] = useState({ serviceDesc: false, hourlyRate: false });

    // Step 4

    const [addressProvince, setAddressProvince] = useState('');
    const [addressDistrict, setAddressDistrict] = useState('');
    const [addressVillage, setAddressVillage] = useState('');

    // Step 7
    const [agreed, setAgreed] = useState(false);
    const [errorsStep7, setErrorsStep7] = useState<ErrorState>({ agreed: false });

    const currentUserId = profileData?._id || '';
    const prefillKeyRef = useRef<string>('');

    // ─── Pre-fill state from profileData when registration is rejected ────────
    useEffect(() => {
        let cancelled = false;


        if (!profileData) return;
        if (!currentUserId) return;

        const prefillKey = `${currentUserId}:${isRejectedRegistration ? 'rejected' : 'normal'}`;
        if (prefillKeyRef.current === prefillKey) return;
        prefillKeyRef.current = prefillKey;

        // Keep step 0 `userId` aligned to the logged-in user so storage drafts load correctly.
        if (userId !== currentUserId) {
            setUserId(currentUserId);
        }


        (async () => {
            if (!profileData || !currentUserId) return;

            let scopedDraft: any = null;
            try {
                scopedDraft = await getAllScopedStepData(currentUserId);
            } catch {
                // If checking storage fails, fall back to server prefill (better than empty).
                scopedDraft = null;
            }

            if (cancelled) return;

            const hasStep0 = !!scopedDraft?.['@aoser_profile'];
            const hasStep1 = !!scopedDraft?.['@freelancer_step1'];
            const hasStep2 = !!scopedDraft?.['@freelancer_step2'];
            const hasStep3 = !!scopedDraft?.['@freelancer_step3'];

            const step2Draft = scopedDraft?.['@freelancer_step2'] || null;
            const step1Draft = scopedDraft?.['@freelancer_step1'] || null;

            const step1HasPromoInfo =
                step1Draft?.promoVideoTouched === true ||
                ('promoVideoPath' in (step1Draft || {})) ||
                (typeof step1Draft?.existingPromoVideo === 'string' && step1Draft.existingPromoVideo.length > 0);

            const step2HasCertificatesInfo =
                !!step2Draft?.certificatesTouched ||
                ('existingCertificates' in (step2Draft || {})) ||
                (Array.isArray(step2Draft?.certificatePaths) && step2Draft.certificatePaths.length > 0);

            // Step 0 — Profile
            if (!hasStep0) {
                setFirstName(profileData.firstName || '');
                setLastName(profileData.lastName || '');
                // setGender(profileData.gender || '');
                setPhone(profileData.phone || '');
                setUserId(profileData._id || '');
                setAddressProvince(profileData.address?.province || '');
                setAddressDistrict(profileData.address?.district || '');
                setAddressVillage(profileData.address?.village || '');
                if (profileData.userProfileImage) {
                    setProfileImg(remoteFile(profileData.userProfileImage));
                }
            }

            // Step 1 — Basic Info
            if (!hasStep1) {
                const serviceTypeId =
                    (profileData as any)?.serviceType?._id ||
                    (profileData as any)?.serviceType ||
                    '';

                setJobTitle(profileData.jobTitle || '');
                setFreelancerType(profileData.freelancerType || 'FULLTIME');
                setCategory(serviceTypeId);
                if (profileData.jobs?.length) {
                    setSubcategories(profileData.jobs.map((j: any) => j._id || j));
                }
                if (profileData.bannerImage) {
                    setBannerImageFile(remoteFile(profileData.bannerImage));
                }
                if (profileData.videoPromote) {
                    setPromoVideoFile(remoteFile(profileData.videoPromote, 'video'));
                }
            }

            // If Step 1 draft exists but doesn't have promo video info, keep showing server video.
            if (hasStep1 && !step1HasPromoInfo && profileData.videoPromote) {
                setPromoVideoFile(remoteFile(profileData.videoPromote, 'video'));
            }

            // Step 2 — Skills & Experience
            if (!hasStep2) {
                setAboutMe(profileData.about || '');
                setSkills(profileData.skills?.length ? profileData.skills : ['']);
                setExperiences(profileData.workExperience?.length ? profileData.workExperience : ['']);
            }

            if (!step2HasCertificatesInfo && profileData.certificates?.length) {
                setCertificateImages(
                    profileData.certificates.map((cert: string) => remoteFile(cert)).filter(Boolean) as FileWithType[]
                );
            }

            // Step 3 — Service & Rate
            if (!hasStep3) {
                setServiceDesc(profileData.customerExpect || '');
                setHourlyRate(profileData.hourlyRate || 0);
                setBudgetCurrency((profileData.hourlyRateCurrency as 'LAK' | 'USD') || 'LAK');
                setRateType((profileData.rateType as 'PER_HOUR' | 'PER_JOB' | 'PER_DAY') || 'PER_HOUR');
            }


        })();

        return () => {
            cancelled = true;
        };



    }, [isRejectedRegistration, profileData, currentUserId]);
    // ──────────────────────────────────────────────────────────────────────────

    const steps = [
        t('kyc.steps.profile'),
        t('kyc.steps.basicInfo'),
        t('kyc.steps.skills'),
    ];

    const renderStep = () => {
        switch (step) {
            case 0:
                return <AoserProfileSetting
                    userId={userId} setUserId={setUserId}
                    firstName={firstName} setFirstName={setFirstName}
                    lastName={lastName} setLastName={setLastName}
                    profileImg={profileImg} setProfileImg={setProfileImg}

                    phone={phone} setPhone={setPhone}
                    province={addressProvince} setProvince={setAddressProvince}
                    district={addressDistrict} setDistrict={setAddressDistrict}
                    village={addressVillage} setVillage={setAddressVillage}
                    errors={aoserProfile}
                    prefillFromMyProfile={true}
                />;
            case 1:
                return <UpgradeToFreelancerStep1
                    jobTitle={jobTitle} setJobTitle={setJobTitle}
                    bannerImageFile={bannerImageFile} setBannerImageFile={setBannerImageFile}
                    promoVideoFile={promoVideoFile} setPromoVideoFile={setPromoVideoFile}
                    setPromoVideoTouched={setPromoVideoTouched}
                    freelancerType={freelancerType} setFreelancerType={setFreelancerType}
                    category={category} setCategory={setCategory}
                    subcategories={subcategories} setSubcategories={setSubcategories}
                    errors={errorsStep1}
                />;
            case 2:
                return <UpgradeToFreelancerStep2
                    aboutMe={aboutMe} setAboutMe={setAboutMe}
                    skills={skills} setSkills={setSkills}
                    experiences={experiences} setExperiences={setExperiences}
                    certificateImages={certificateImages} setCertificateImages={setCertificateImages}
                    serviceDesc={serviceDesc} setServiceDesc={setServiceDesc}
                    hourlyRate={hourlyRate} setHourlyRate={setHourlyRate}
                    budgetCurrency={budgetCurrency} setBudgetCurrency={setBudgetCurrency}
                    rateType={rateType} setRateType={setRateType}
                    agreed={agreed} setAgreed={setAgreed}
                    errors={{ ...errorsStep2, ...errorsStep3, ...errorsStep7 }}
                />;
            // case 3:
            //     return <UpgradeToFreelancerReview />;
            default:
                return null;
        }
    };

    const { mutate: createFreelancer } = useCreateFreelancer();
    const { mutate: updateFreelancerProfile } = useUpdateFreelancerProfile();

    /** Check if a FileWithType is a remote (already-uploaded) file — skip upload for these */
    const isRemoteFile = (file: FileWithType | null): boolean => {
        if (!file?.uri) return false;
        return file.uri.startsWith('http://') || file.uri.startsWith('https://');
    };

    const prepareLocalFileForUpload = async (file: FileWithType, fallbackName: string): Promise<FileWithType> => {
        const name = file.name || fallbackName;
        try {
            const tempPath = await saveFileToTemp(file.uri, name);
            return { ...file, uri: tempPath, name };
        } catch {
            return { ...file, name };
        }
    };

    const handleNext = async () => {
        if (isSubmitting) return;

        // Guard: Ensure profile data and ID are stable before proceeding
        if (!profileData || !currentUserId) {
            console.log('⚠️ Cannot proceed: Profile data or User ID is missing');
            return;
        }

        // ── Step 0: Profile ──────────────────────────────────────────────────
        if (step === 0) {
            const newErrors: ErrorState = {
                firstName: firstName.trim() === '',
                lastName: lastName.trim() === '',
                profileImg: !profileImg?.uri,
                phone: !phone.trim(),
                province: !addressProvince.trim(),
                district: !addressDistrict.trim(),
                village: !addressVillage.trim(),
            };
            setAoserProfile(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            setIsSubmitting(true);
            try {
                const dataToSave: AoserProfileDataExtended = {
                    userId,
                    firstName,
                    lastName,
                    phone,
                    address: {
                        country: 'Laos',
                        province: addressProvince.trim(),
                        district: addressDistrict.trim(),
                        village: addressVillage.trim(),
                        latitude: 0,
                        longitude: 0,
                    },
                };

                if (profileImg?.uri) {
                    if (!isRemoteFile(profileImg)) {
                        const ext = profileImg.type?.split('/')[1] || 'jpg';
                        const fileName = profileImg.name || `profile_${Date.now()}.${ext}`;
                        const prepared = await prepareLocalFileForUpload(profileImg, fileName);
                        const uploadedKey = await uploadFileInstant(prepared);
                        dataToSave.existingProfileImg = uploadedKey;
                        setProfileImg(remoteFile(uploadedKey, 'image'));
                    } else {
                        dataToSave.existingProfileImg = profileImg.name;
                    }
                }

                // await saveStepData('@aoser_profile', dataToSave);
                await saveScopedStep(currentUserId, '@aoser_profile', dataToSave);
            } catch (error) {
                console.log('❌ Step 0 upload/save failed:', error);
                Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                return;
            } finally {
                setIsSubmitting(false);
            }
        }

        // ── Step 1: Basic Info ───────────────────────────────────────────────
        if (step === 1) {
            const newErrors: ErrorState = {
                jobTitle: jobTitle.trim() === '',
                category: category.trim() === '',
                bannerImageFile: bannerImageFile === null,
                promoVideoFile: promoVideoFile === null,
                freelancerType: freelancerType.trim() === '',
            };
            setErrorsStep1(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            setIsSubmitting(true);
            try {
                const dataToSave: Step1DataExtended = { jobTitle, category, subcategories, freelancerType };

                if (bannerImageFile) {
                    if (!isRemoteFile(bannerImageFile)) {
                        const ext = bannerImageFile.type?.split('/')[1] || 'jpg';
                        const fileName = bannerImageFile.name || `banner_${Date.now()}.${ext}`;
                        const prepared = await prepareLocalFileForUpload(bannerImageFile, fileName);
                        const uploadedKey = await uploadFileInstant(prepared);
                        dataToSave.existingBannerImage = uploadedKey;
                        setBannerImageFile(remoteFile(uploadedKey, 'image'));
                    } else {
                        dataToSave.existingBannerImage = bannerImageFile.name;
                    }
                }

                (dataToSave as any).promoVideoTouched = promoVideoTouched === true;
                if (promoVideoTouched) {
                    if (promoVideoFile) {
                        if (!isRemoteFile(promoVideoFile)) {
                            const ext = promoVideoFile.type?.split('/')[1] || 'mp4';
                            const fileName = promoVideoFile.name || `promo_${Date.now()}.${ext}`;
                            const prepared = await prepareLocalFileForUpload(promoVideoFile, fileName);
                            const uploadedKey = await uploadFileInstant(prepared);
                            dataToSave.existingPromoVideo = uploadedKey;
                            setPromoVideoFile(remoteFile(uploadedKey, 'video'));
                        } else {
                            dataToSave.existingPromoVideo = promoVideoFile.name;
                        }
                    } else {
                        // Explicitly cleared
                        (dataToSave as any).existingPromoVideo = null;
                    }
                }

                // await saveStepData('@freelancer_step1', dataToSave);
                await saveScopedStep(currentUserId, '@freelancer_step1', dataToSave);
            } catch (error) {
                console.log('❌ Step 1 upload/save failed:', error);
                Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                return;
            } finally {
                setIsSubmitting(false);
            }
        }

        // ── Step 2: Skills & Experience + Service & Rate ───────────────────
        if (step === 2) {
            const cleanedSkills = skills.filter(s => s.trim() !== '');
            const cleanedExperiences = experiences.filter(e => e.trim() !== '');

            const newErrorsStep2: ErrorState = {
                aboutMe: aboutMe.trim() === '',
                skills: cleanedSkills.length === 0,
                experiences: cleanedExperiences.length === 0,
            };

            const newErrorsStep3 = {
                serviceDesc: serviceDesc.trim() === '',
                hourlyRate: hourlyRate === 0
            };

            const newErrorsStep7 = { agreed: agreed === false };

            setErrorsStep2(newErrorsStep2);
            setErrorsStep3(newErrorsStep3);
            setErrorsStep7(newErrorsStep7);

            if (Object.values(newErrorsStep2).some(Boolean) || Object.values(newErrorsStep3).some(Boolean) || newErrorsStep7.agreed) return;

            setIsSubmitting(true);
            try {
                const existingCertificates: string[] = [];
                const localCerts: FileWithType[] = [];

                for (let i = 0; i < certificateImages.length; i++) {
                    const cert = certificateImages[i];
                    if (isRemoteFile(cert)) {
                        existingCertificates.push(cert.name);
                    } else {
                        const ext = cert.type?.split('/')[1] || 'jpg';
                        const fileName = cert.name || `cert_${i}_${Date.now()}.${ext}`;
                        const prepared = await prepareLocalFileForUpload(cert, fileName);
                        localCerts.push(prepared);
                    }
                }

                const uploadedKeys = await uploadFilesInstant(localCerts, { concurrency: 3 });
                const uploadedCertFiles = uploadedKeys.map((k) => remoteFile(k, 'image')).filter(Boolean) as FileWithType[];
                if (uploadedCertFiles.length) {
                    setCertificateImages([
                        ...certificateImages.filter(isRemoteFile),
                        ...uploadedCertFiles,
                    ]);
                }

                const dataToSave: Step2DataExtended & { certificatesTouched: true } = {
                    skills: cleanedSkills,
                    experience: cleanedExperiences,
                    aboutMe,
                    certificatesTouched: true,
                    existingCertificates: [...existingCertificates, ...uploadedKeys],
                };
                // await saveStepData('@freelancer_step2', dataToSave);
                await saveScopedStep(currentUserId, '@freelancer_step2', dataToSave);

                // Also save Step 3 data since it's now in the same UI step
                await saveScopedStep(currentUserId, '@freelancer_step3', { serviceDesc, hourlyRate, budgetCurrency, rateType });

                // Save Step 7 data (Agreement)
                await saveScopedStep(currentUserId, '@freelancer_step7', { agreed });

            } catch (error) {
                console.log('❌ Step 2 (Skills & Agreement) upload/save failed:', error);
                Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                return;
            } finally {
                setIsSubmitting(false);
            }
        }

        // ── Step 3: Submit (was 8) ───────────────────────────────────────────
        if (step === 2) {
            setIsSubmitting(true);

            try {
                const allStepData = await getAllScopedStepData(currentUserId);

                const reconstructedData: any = {};
                Object.keys(allStepData).forEach(stepKey => {
                    const stepData = allStepData[stepKey as keyof typeof allStepData];
                    if (!stepData) return;
                    reconstructedData[stepKey] = { ...stepData };
                });

                const hasPendingUploads =
                    !!reconstructedData['@aoser_profile']?.profileImgPath ||
                    !!reconstructedData['@freelancer_step1']?.bannerImagePath ||
                    !!reconstructedData['@freelancer_step1']?.promoVideoPath ||
                    !!reconstructedData['@freelancer_step2']?.certificatePaths


                if (hasPendingUploads) {
                    console.log('❌ Cannot submit: pending uploads still in progress');
                    Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                    setIsSubmitting(false);
                    return; // ✅ early return
                }

                // ── Build final payload ──────────────────────────────────────
                const savedFirstName = reconstructedData['@aoser_profile']?.firstName || '';
                const savedLastName = reconstructedData['@aoser_profile']?.lastName || '';
                const savedPhone = reconstructedData['@aoser_profile']?.phone || '';
                const uploadedUserProfileImage = reconstructedData['@aoser_profile']?.existingProfileImg as string | undefined;

                const step3Draft = reconstructedData['@freelancer_step3'] || {};
                const hourlyRateValue = Number(step3Draft?.hourlyRate ?? 0);
                const hourlyRateCurrencyValue = (step3Draft?.budgetCurrency as 'LAK' | 'USD') || 'LAK';
                const rateTypeValue = (step3Draft?.rateType as 'PER_HOUR' | 'PER_DAY' | 'PER_JOB') || 'PER_HOUR';


                const finalData: Partial<UserProfile> & Record<string, any> = {
                    businessType: 'FREELANCER',
                    jobTitle: reconstructedData['@freelancer_step1']?.jobTitle || '',
                    freelancerType: reconstructedData['@freelancer_step1']?.freelancerType || 'FULLTIME',
                    bannerImage: reconstructedData['@freelancer_step1']?.existingBannerImage || '',
                    serviceType: reconstructedData['@freelancer_step1']?.category || '',
                    about: reconstructedData['@freelancer_step2']?.aboutMe || '',
                    skills: reconstructedData['@freelancer_step2']?.skills || [],
                    workExperience: reconstructedData['@freelancer_step2']?.experience || [],
                    customerExpect: reconstructedData['@freelancer_step3']?.serviceDesc || '',
                    hourlyRate: hourlyRateValue,
                    hourlyRateCurrency: hourlyRateCurrencyValue,
                    rateType: rateTypeValue,
                    address: {
                        country: reconstructedData['@aoser_profile']?.address?.country || 'Laos',
                        province: reconstructedData['@aoser_profile']?.address?.province || '',
                        district: reconstructedData['@aoser_profile']?.address?.district || '',
                        village: reconstructedData['@aoser_profile']?.address?.village || '',
                        latitude: 0,
                        longitude: 0,
                    },

                };

                // Optional fields
                const optionalPromoVideo = reconstructedData['@freelancer_step1']?.existingPromoVideo;
                if (optionalPromoVideo) finalData.videoPromote = optionalPromoVideo;

                const optionalSubcategories = reconstructedData['@freelancer_step1']?.subcategories;
                if (Array.isArray(optionalSubcategories) && optionalSubcategories.length > 0) {
                    finalData.jobs = optionalSubcategories;
                }

                const existingCerts = reconstructedData['@freelancer_step2']?.existingCertificates || [];
                const step2Draft = reconstructedData['@freelancer_step2'];
                const certsTouched =
                    step2Draft?.certificatesTouched === true ||
                    ('existingCertificates' in (step2Draft || {})) ||
                    ('certificateFiles' in (step2Draft || {}));
                if (certsTouched) {
                    finalData.certificates = existingCerts;
                } else if (existingCerts.length > 0) {
                    finalData.certificates = existingCerts;
                }

                if (finalData.videoPromote == null || finalData.videoPromote === '') delete finalData.videoPromote;
                if (finalData.jobs == null) delete finalData.jobs;
                if (finalData.certificates == null) delete finalData.certificates;
                const profilePayload: any = {
                    firstName: savedFirstName.trim(),
                    lastName: savedLastName.trim(),
                    phone: savedPhone.trim(),
                };

               
                // ── onSuccess ────────────────────────────────────────────────
                const onSuccess = async (response: any) => {
                    try {
                        const profilePayload: any = {
                            firstName: savedFirstName.trim(),
                            lastName: savedLastName.trim(),
                            phone: savedPhone.trim(),
                        };

                        if (uploadedUserProfileImage) {
                            profilePayload.userProfileImage = uploadedUserProfileImage;
                        } else if (reconstructedData['@aoser_profile']?.existingProfileImg) {
                            profilePayload.userProfileImage = reconstructedData['@aoser_profile'].existingProfileImg;
                        }

                        // Use mutateAsync or a Promise-based approach to ensure the profile 
                        // update finishes before we clear local data and navigate away.
                        try {
                            await new Promise((resolve, reject) => {
                                updateProfile(profilePayload, {
                                    onSuccess: resolve,
                                    onError: reject
                                });
                            });
                        } catch (err) {
                            console.log('⚠️ Minor: Basic profile update failed, but KYC submitted.', err);
                        }

                        Toast.show({
                            type: ALERT_TYPE.SUCCESS,
                            title: t('kyc.toast.success.title'),
                            textBody: t('kyc.toast.success.body'),
                        });

                        await clearScopedKycData(currentUserId);
                        queryClient.removeQueries({ queryKey: ['aoserProfile'] });
                        queryClient.removeQueries({ queryKey: ['freelancerStep1'] });
                        queryClient.removeQueries({ queryKey: ['freelancerStep2'] });
                        queryClient.removeQueries({ queryKey: ['freelancerStep3'] });
                        queryClient.removeQueries({ queryKey: ['freelancerReview'] });
                        await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
                        await queryClient.refetchQueries({ queryKey: ['myProfile'] });
                        navigation.popTo('AuthFreelancerProfile', {userId: currentUserId});
                    } finally {
                        setIsSubmitting(false); // ✅ always runs even if navigation fails
                    }
                };

                // ── onError ──────────────────────────────────────────────────
                const onError = (error: any) => {
                    console.log('❌ Submission failed:', error);
                    Toast.show({
                        type: ALERT_TYPE.DANGER,
                        title: t('kyc.toast.error.title'),
                        textBody: t('kyc.toast.error.body'),
                    });
                    setIsSubmitting(false); // ✅ reset on API error
                };

                // ── Submit ───────────────────────────────────────────────────

                createFreelancer(finalData as UserProfile, { onSuccess, onError });

                setIsSubmitting(false);
            } catch (error) {
                console.log('❌ Error in submission process:', error);
                Toast.show({
                    type: ALERT_TYPE.DANGER,
                    title: t('kyc.toast.oops.title'),
                    textBody: t('kyc.toast.oops.body'),
                });
                setIsSubmitting(false); // ✅ only on unexpected catch
            }

            return; // ✅ CRITICAL: prevents setStep(step + 1) from running after step 8
        }

        // ✅ This only runs for steps 0-7
        if (step < steps.length - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step == 0) navigation.goBack();
        if (step > 0) setStep(step - 1);
    };

    if (profileLoading) {
        return <ActivityIndicator />;
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
            <StepProgressFreelancerBar currentStep={step} steps={steps} />

            <View style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 110}
                    style={{ flex: 1, backgroundColor: 'white' }}
                >
                    <ScrollView
                        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={true}
                    >
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View>{renderStep()}</View>
                        </TouchableWithoutFeedback>
                    </ScrollView>

                    <View className='px-4 mb-6 flex-row gap-4 justify-center items-center'>
                        {step >= 0 && (
                            <TouchableOpacity
                                onPress={handleBack}
                                disabled={isSubmitting}
                                className="bg-textSecondary mt-6 py-4 rounded-full items-center w-1/3"
                            >
                                <Text className="text-white text-base font-semibold">{t('kyc.buttons.back')}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={handleNext}
                            disabled={isSubmitting}
                            className={`bg-primary mt-6 py-4 rounded-full items-center justify-center ${step > 0 ? 'w-64' : 'w-64'} ${isSubmitting ? 'opacity-70' : ''}`}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text className="text-white text-base font-semibold">
                                    {step === 2 ? t('kyc.buttons.go_live') : t('kyc.buttons.next')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>

            <View style={{ height: insets.bottom, backgroundColor: 'white' }} />
        </SafeAreaView>
    );
};

export default UpgradeToFreelancer;
