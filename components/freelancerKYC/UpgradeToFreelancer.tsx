import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TouchableWithoutFeedback, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import StepProgressFreelancerBar from 'components/ui/StepProgressFreelancerBar';
import UpgradeToFreelancerStep1 from './UpgradeToFreelancerStep1';
import UpgradeToFreelancerStep2 from './UpgradeToFreelancerStep2';
import UpgradeToFreelancerStep3 from './UpgradeToFreelancerStep3';
import UpgradeToFreelancerStep4 from './UpgradeTofreelancerStep4';
import UpgradeToFreelancerStep5 from './UpgradeToFreelancerStep5';
import UpgradeToFreelancerReview from './UpgradeToFreelancerReview';
import UpgradeToFreelancerStep6 from './UpgradeToFreelancerStep6';
import UpgradeToFreelancerStep7 from './UpgradeToFreelancerStep7';
import AoserProfileSetting from 'screens/profile/AoserProfileSetting';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useCreateFreelancer, useMyProfile, useUpdateFreelancerProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { FileWithType } from 'types';

import {
    saveFileToTemp,
    saveStepData,
    getAllStepData,
    cleanup,
    uploadFileInstant,
    uploadFilesInstant,
    AoserProfileData,
    Step1Data,
    Step2Data,
    Step4Data,
    Step5Data,
    Step6Data,
    Step7Data
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

interface Step5DataExtended extends Step5Data {
    existingSelfieWithCard?: string;
    existingCardImage?: string;
}
// ─────────────────────────────────────────────────────────────────────────────

// ⚠️ Replace this with your actual CDN base URL
const CDN_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL; // e.g. 'https://cdn.example.com/uploads/'

interface ErrorState {
    [key: string]: boolean;
}

/** Build a remote FileWithType from a stored filename string */
const remoteFile = (filename: string | undefined, type: 'image' | 'video' = 'image'): FileWithType | null => {
    if (!filename) return null;
    const mimeType = type === 'video'
        ? 'video/mp4'
        : filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return {
        uri: `${CDN_BASE_URL}${filename}`,
        name: filename,
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
    const isRejectedRegistration =profileData?.businessType === 'FREELANCER'&& profileData?.registrationStatus === 'REJECTED';
        
    const canStartRegistration =
        profileData?.businessType === 'CUSTOMER' &&
        profileData?.registrationStatus === '';
    // ──────────────────────────────────────────────────────────────────────────

    // console.log("User profile:: ", JSON.stringify(profileData, null, 2))
    // Aoser profile (Step 0)
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileImg, setProfileImg] = useState<FileWithType | null>(null);
    const [userId, setUserId] = useState('');
    const [gender, setGender] = useState('');
    const [phone, setPhone] = useState('');

    const { mutate: updateProfile } = useUpdateMyProfile();

    const [aoserProfile, setAoserProfile] = useState<ErrorState>({
        firstName: false, lastName: false, profileImg: false,
        gender: false, phone: false, province: false, district: false, village: false,
    });

    // Step 1
    const [jobTitle, setJobTitle] = useState('');
    const [bannerImageFile, setBannerImageFile] = useState<FileWithType | null>(null);
    const [promoVideoFile, setPromoVideoFile] = useState<FileWithType | null>(null);
    const [promoVideoTouched, setPromoVideoTouched] = useState(false);
    const [freelancerType, setFreelancerType] = useState('FULLTIME');
    const [category, setCategory] = useState('');
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [errorsStep1, setErrorsStep1] = useState<ErrorState>({ jobTitle: false, category: false, bannerImageFile: false, freelancerType: false });

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
    const [cardID, setCardID] = useState('');
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [cardType, setCardType] = useState<'ID_CARD' | 'PASSPORT' | 'VISA'>('ID_CARD');
    const [addressProvince, setAddressProvince] = useState('');
    const [addressDistrict, setAddressDistrict] = useState('');
    const [addressVillage, setAddressVillage] = useState('');
    const [errorsStep4, setErrorsStep4] = useState<ErrorState>({ cardID: false, cardType: false, fromDate: false });

    // Step 5
    const [selfieWithCard, setSelfieWithCard] = useState<FileWithType | null>(null);
    const [cardImage, setCardImage] = useState<FileWithType | null>(null);
    const [errorsStep5, setErrorsStep5] = useState<ErrorState>({ selfieWithCard: false, cardImage: false });

    // Step 6
    const [paymentMethod, setPaymentMethod] = useState<'LAOS_BANK' | 'PAYPAL'>('LAOS_BANK');
    const [bankName, setBankName] = useState('');
    const [accountName, setAccountName] = useState('');
    const [bankNumber, setBankNumber] = useState('');
    const [paypalInfo, setPaypalInfo] = useState('');
    const [errorsStep6, setErrorsStep6] = useState<ErrorState>({});

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
            const hasStep4 = !!scopedDraft?.['@freelancer_step4'];
            const hasStep5 = !!scopedDraft?.['@freelancer_step5'];
            const hasStep6 = !!scopedDraft?.['@freelancer_step6'];

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
                setGender(profileData.gender || '');
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

            // Step 4 — KYC ID
            if (!hasStep4) {
                setCardType((profileData.personalCardType as 'ID_CARD' | 'PASSPORT' | 'VISA') || 'ID_CARD');
                setCardID(profileData.personalCardID || '');
                if (profileData.personalCardExpireDate) {
                    setFromDate(new Date(profileData.personalCardExpireDate));
                }
            }

            // Step 5 — KYC Images
            if (!hasStep5) {
                if (profileData.userWithCardImage) {
                    setSelfieWithCard(remoteFile(profileData.userWithCardImage));
                }
                if (profileData.personalCardImage) {
                    setCardImage(remoteFile(profileData.personalCardImage));
                }
            }

            // Step 6 — Bank Info
            if (!hasStep6) {
                setPaymentMethod((profileData.bankAccountType as 'LAOS_BANK' | 'PAYPAL') || 'LAOS_BANK');
                setBankName((profileData as any).bankName || profileData.bankAccountName || '');
                setAccountName(profileData.bankAccountName || '');
                setBankNumber(profileData.bankAccountNumber || '');
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
        t('kyc.steps.category'),
        t('kyc.steps.availability'),
        t('kyc.steps.portfolio'),
        t('kyc.steps.bankInfo'),
        t('kyc.steps.confirmation'),
        t('kyc.steps.review'),
    ];

    const renderStep = () => {
        switch (step) {
            case 0:
                return <AoserProfileSetting
                    userId={userId} setUserId={setUserId}
                    firstName={firstName} setFirstName={setFirstName}
                    lastName={lastName} setLastName={setLastName}
                    profileImg={profileImg} setProfileImg={setProfileImg}
                    gender={gender} setGender={setGender}
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
                    errors={errorsStep2}
                />;
            case 3:
                return <UpgradeToFreelancerStep3
                    serviceDesc={serviceDesc} setServiceDesc={setServiceDesc}
                    hourlyRate={hourlyRate} setHourlyRate={setHourlyRate}
                    budgetCurrency={budgetCurrency} setBudgetCurrency={setBudgetCurrency}
                    rateType={rateType} setRateType={setRateType}
                    errors={errorsStep3}
                />;
            case 4:
                return <UpgradeToFreelancerStep4
                    cardType={cardType} setCardType={setCardType}
                    cardID={cardID} setCardID={setCardID}
                    fromDate={fromDate} setFromDate={setFromDate}
                    errors={errorsStep4}
                />;
            case 5:
                return <UpgradeToFreelancerStep5
                    selfieWithCard={selfieWithCard} setSelfieWithCard={setSelfieWithCard}
                    cardImage={cardImage} setCardImage={setCardImage}
                    errors={errorsStep5}
                />;
            case 6:
                return <UpgradeToFreelancerStep6
                    paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                    bankName={bankName} setBankName={setBankName}
                    accountName={accountName} setAccountName={setAccountName}
                    bankNumber={bankNumber} setBankNumber={setBankNumber}
                    paypalInfo={paypalInfo} setPaypalInfo={setPaypalInfo}
                    errors={errorsStep6}
                />;
            case 7:
                return <UpgradeToFreelancerStep7 agreed={agreed} setAgreed={setAgreed} errors={errorsStep7} />;
            case 8:
                return <UpgradeToFreelancerReview />;
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

        // ── Step 0: Profile ──────────────────────────────────────────────────
        if (step === 0) {
            const newErrors: ErrorState = {
                firstName: firstName.trim() === '',
                lastName: lastName.trim() === '',
                profileImg: !profileImg?.uri,
                gender: !gender.trim(),
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
                    gender,
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

        // ── Step 2: Skills & Experience ──────────────────────────────────────
        if (step === 2) {
            const cleanedSkills = skills.filter(s => s.trim() !== '');
            const cleanedExperiences = experiences.filter(e => e.trim() !== '');
            const newErrors: ErrorState = {
                aboutMe: aboutMe.trim() === '',
                skills: cleanedSkills.length === 0,
                experiences: cleanedExperiences.length === 0,
            };
            setErrorsStep2(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

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
            } catch (error) {
                console.log('❌ Step 2 upload/save failed:', error);
                Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                return;
            } finally {
                setIsSubmitting(false);
            }
        }

        // ── Step 3: Service Description ──────────────────────────────────────
        if (step === 3) {
            const newErrors = { serviceDesc: serviceDesc.trim() === '', hourlyRate: hourlyRate === 0 };
            setErrorsStep3(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            // await saveStepData('@freelancer_step3', { serviceDesc, hourlyRate, budgetCurrency, rateType });
            await saveScopedStep(currentUserId, '@freelancer_step3', { serviceDesc, hourlyRate, budgetCurrency, rateType });
        }

        // ── Step 4: ID Card Info ─────────────────────────────────────────────
        if (step === 4) {
            const newErrors = { cardType: cardType === null, cardID: cardID.trim() === '', fromDate: fromDate === null || fromDate < new Date() };
            setErrorsStep4(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            // await saveStepData('@freelancer_step4', { cardType, cardID, fromDate: fromDate as Date });

            await saveScopedStep(currentUserId, '@freelancer_step4', { cardType, cardID, fromDate });

        }

        // ── Step 5: KYC Images ───────────────────────────────────────────────
        if (step === 5) {
            const newErrors: ErrorState = { selfieWithCard: selfieWithCard === null, cardImage: cardImage === null };
            setErrorsStep5(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            setIsSubmitting(true);
            try {
                const dataToSave: Step5DataExtended = {};

                if (selfieWithCard) {
                    if (!isRemoteFile(selfieWithCard)) {
                        const ext = selfieWithCard.type?.split('/')[1] || 'jpg';
                        const fileName = selfieWithCard.name || `selfie_${Date.now()}.${ext}`;
                        const prepared = await prepareLocalFileForUpload(selfieWithCard, fileName);
                        const uploadedKey = await uploadFileInstant(prepared);
                        dataToSave.existingSelfieWithCard = uploadedKey;
                        setSelfieWithCard(remoteFile(uploadedKey, 'image'));
                    } else {
                        dataToSave.existingSelfieWithCard = selfieWithCard.name;
                    }
                }

                if (cardImage) {
                    if (!isRemoteFile(cardImage)) {
                        const ext = cardImage.type?.split('/')[1] || 'jpg';
                        const fileName = cardImage.name || `card_${Date.now()}.${ext}`;
                        const prepared = await prepareLocalFileForUpload(cardImage, fileName);
                        const uploadedKey = await uploadFileInstant(prepared);
                        dataToSave.existingCardImage = uploadedKey;
                        setCardImage(remoteFile(uploadedKey, 'image'));
                    } else {
                        dataToSave.existingCardImage = cardImage.name;
                    }
                }

                // await saveStepData('@freelancer_step5', dataToSave);
                await saveScopedStep(currentUserId, '@freelancer_step5', dataToSave);


            } catch (error) {
                console.log('❌ Step 5 upload/save failed:', error);
                Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                return;
            } finally {
                setIsSubmitting(false);
            }
        }

        // ── Step 6: Bank Info ────────────────────────────────────────────────
        if (step === 6) {
            const newErrors: ErrorState = {
                accountName: accountName.trim() === '',
                bankName: bankName.trim() === '',
                ...(paymentMethod === 'PAYPAL' ? { paypalInfo: paypalInfo.trim() === '' } : { bankNumber: bankNumber.trim() === '' }),
            };
            setErrorsStep6(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            const dataToSave: Step6Data = {
                paymentMethod, bankName, accountName,
                ...(paymentMethod === 'PAYPAL' ? { paypalInfo } : { bankNumber }),
            };
            // await saveStepData('@freelancer_step6', dataToSave);
            await saveScopedStep(currentUserId, '@freelancer_step6', dataToSave);

        }

        // ── Step 7: Agreement ────────────────────────────────────────────────
        if (step === 7) {
            const newErrors: ErrorState = { agreed: agreed === false };
            setErrorsStep7(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;
            // await saveStepData('@freelancer_step7', { agreed });
            await saveScopedStep(currentUserId, '@freelancer_step7', { agreed });

        }

        // ── Step 8: Submit ───────────────────────────────────────────────────
        if (step === 8) {
            setIsSubmitting(true);
            try {
                // const allStepData = await getAllStepData();
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
                    !!reconstructedData['@freelancer_step2']?.certificatePaths ||
                    !!reconstructedData['@freelancer_step5']?.selfieWithCardPath ||
                    !!reconstructedData['@freelancer_step5']?.cardImagePath;

                if (hasPendingUploads) {
                    Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                    setIsSubmitting(false);
                    return;
                }

                // ── Build final payload ──────────────────────────────────────
                const savedFirstName = reconstructedData['@aoser_profile']?.firstName || '';
                const savedLastName = reconstructedData['@aoser_profile']?.lastName || '';
                const savedGender = reconstructedData['@aoser_profile']?.gender || '';
                const savedPhone = reconstructedData['@aoser_profile']?.phone || '';
                const uploadedUserProfileImage = reconstructedData['@aoser_profile']?.existingProfileImg as string | undefined;

                const step3Draft = reconstructedData['@freelancer_step3'] || {};
                const hourlyRateValue = Number(step3Draft?.hourlyRate ?? 0);
                const hourlyRateCurrencyValue = (step3Draft?.budgetCurrency as 'LAK' | 'USD') || 'LAK';
                const rateTypeValue = (step3Draft?.rateType as 'PER_HOUR' | 'PER_DAY' | 'PER_JOB') || 'PER_HOUR';

                const step6Draft = reconstructedData['@freelancer_step6'] || {};
                const bankAccountNumberValue =
                    step6Draft?.paymentMethod === 'PAYPAL'
                        ? (step6Draft?.paypalInfo || '')
                        : (step6Draft?.bankNumber || '');

                // We use Partial<Freelancer> & Record<string, any> so optional fields like
                // certificates, videoPromote, jobs can be added dynamically without TS complaining
                const finalData: Partial<UserProfile> & Record<string, any> = {
                    businessType: 'FREELANCER',
                    jobTitle: reconstructedData['@freelancer_step1']?.jobTitle || '',
                    freelancerType: reconstructedData['@freelancer_step1']?.freelancerType || 'FULLTIME',

                    // Use newly uploaded URL, or keep existing filename
                    bannerImage: reconstructedData['@freelancer_step1']?.existingBannerImage || '',

                    serviceType: reconstructedData['@freelancer_step1']?.category || '',
                    about: reconstructedData['@freelancer_step2']?.aboutMe || '',
                    skills: reconstructedData['@freelancer_step2']?.skills || [],
                    workExperience: reconstructedData['@freelancer_step2']?.experience || [],
                    customerExpect: reconstructedData['@freelancer_step3']?.serviceDesc || '',
                    hourlyRate: hourlyRateValue,
                    hourlyRateCurrency: hourlyRateCurrencyValue,
                    rateType: rateTypeValue,



                    personalCardType: reconstructedData['@freelancer_step4']?.cardType,
                    personalCardID: reconstructedData['@freelancer_step4']?.cardID || '',
                    personalCardExpireDate: reconstructedData['@freelancer_step4']?.fromDate || '',

                    personalCardImage: reconstructedData['@freelancer_step5']?.existingCardImage || '',

                    userWithCardImage: reconstructedData['@freelancer_step5']?.existingSelfieWithCard || '',

                    address: {
                        country: reconstructedData['@aoser_profile']?.address?.country || 'Laos',
                        province: reconstructedData['@aoser_profile']?.address?.province || '',
                        district: reconstructedData['@aoser_profile']?.address?.district || '',
                        village: reconstructedData['@aoser_profile']?.address?.village || '',
                        latitude: 0,
                        longitude: 0,
                    },

                    bankAccountType: step6Draft?.paymentMethod,
                    bankName: step6Draft?.bankName || '',
                    bankAccountName: step6Draft?.accountName || '',
                    bankAccountNumber: bankAccountNumberValue,
                };


                // Optional fields

                const optionalPromoVideo = reconstructedData['@freelancer_step1']?.existingPromoVideo;
                if (optionalPromoVideo) finalData.videoPromote = optionalPromoVideo;

                const optionalSubcategories = reconstructedData['@freelancer_step1']?.subcategories;
                if (Array.isArray(optionalSubcategories) && optionalSubcategories.length > 0) {
                    finalData.jobs = optionalSubcategories;
                }

                // Merge new + existing certificates
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

                // Don't send nullish optional fields (backend can reject explicit `null`/empty string).
                if (finalData.videoPromote == null || finalData.videoPromote === '') delete finalData.videoPromote;
                if (finalData.jobs == null) delete finalData.jobs;
                if (finalData.certificates == null) delete finalData.certificates;
                // if(isRejectedRegistration) {
                //     finalData.registrationStatus = 'PENDING'
                // }
                // ── Choose create vs update based on registration status ─────
                const onSuccess = async (response: any) => {
                    const profilePayload: Record<string, string> = {
                        firstName: savedFirstName.trim(),
                        lastName: savedLastName.trim(),
                        gender: savedGender.trim(),
                        phone: savedPhone.trim(),
                    };
                    if (uploadedUserProfileImage) {
                        profilePayload.userProfileImage = uploadedUserProfileImage;
                    } else if (reconstructedData['@aoser_profile']?.existingProfileImg) {
                        profilePayload.userProfileImage = reconstructedData['@aoser_profile'].existingProfileImg;
                    }

                    updateProfile(profilePayload, {
                        onSuccess: () => Toast.show({ type: ALERT_TYPE.SUCCESS, title: t('editProfile.success'), textBody: t('editProfile.profile_updated') }),
                        onError: () => Toast.show({ type: ALERT_TYPE.DANGER, title: t('editProfile.oops'), textBody: t('editProfile.update_failed') }),
                    });

                    Toast.show({ type: ALERT_TYPE.SUCCESS, title: t('kyc.toast.success.title'), textBody: t('kyc.toast.success.body') });

                    // await cleanup();
                    await clearScopedKycData(currentUserId);
                    queryClient.removeQueries({ queryKey: ['aoserProfile'] });
                    queryClient.removeQueries({ queryKey: ['freelancerStep1'] });
                    queryClient.removeQueries({ queryKey: ['freelancerStep2'] });
                    queryClient.removeQueries({ queryKey: ['freelancerStep3'] });
                    queryClient.removeQueries({ queryKey: ['freelancerStep4'] });
                    queryClient.removeQueries({ queryKey: ['freelancerStep5'] });
                    queryClient.removeQueries({ queryKey: ['freelancerStep6'] });
                    queryClient.removeQueries({ queryKey: ['freelancerStep7'] });
                    queryClient.removeQueries({ queryKey: ['freelancerReview'] });
                    await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
                    await queryClient.refetchQueries({ queryKey: ['myProfile'] });
                    navigation.popTo('FreelancerRoleGate');
                    setIsSubmitting(false);
                };

                const onError = (error: any) => {
                    console.log('❌ Submission failed:', error);
                    Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                    setIsSubmitting(false);
                };

               

                if (isRejectedRegistration) {
                    // ✅ Re-submission: UPDATE existing profile PENDING
                    updateFreelancerProfile(finalData as UserProfile, { onSuccess, onError });
                } else {
                    // ✅ First time: CREATE new freelancer profile
                    createFreelancer(finalData as UserProfile, { onSuccess, onError });
                }

                setIsSubmitting(false);
            } catch (error) {
                console.log('❌ Error in submission process:', error);
                Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.oops.title'), textBody: t('kyc.toast.oops.body') });
                setIsSubmitting(false);
            }
        }

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
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 110}
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

                    <View className='px-4 mb-6 flex-row gap-4'>
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
                                    {step === 8 ? t('kyc.buttons.go_live') : t('kyc.buttons.next')}
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
