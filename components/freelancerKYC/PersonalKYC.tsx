import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TouchableWithoutFeedback, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import StepProgressFreelancerBar from 'components/ui/StepProgressFreelancerBar';
import UpgradeToFreelancerStep4 from './UpgradeTofreelancerStep4';
import UpgradeToFreelancerStep5 from './UpgradeToFreelancerStep5';
import UpgradeToFreelancerStep6 from './UpgradeToFreelancerStep6';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useCreateFreelancer, useCreateKycInfo, useMyProfile, useUpdateFreelancerProfile } from 'hooks/useFreelancer';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { FileWithType } from 'types';
import {
    saveFileToTemp,
    uploadFileInstant,
    Step5Data,
    Step6Data
} from 'utils/fileStorage';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { UserProfile } from 'types/profile';
import { clearScopedKycData, getAllScopedStepData, saveScopedStep } from 'utils/kycStorage';

// ─── Extended interfaces to support keeping existing remote files ─────────────
interface Step5DataExtended extends Step5Data {
    existingSelfieWithCard?: string;
    existingCardImage?: string;
}
// ─────────────────────────────────────────────────────────────────────────────

const CDN_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

interface ErrorState {
    [key: string]: boolean;
}

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
        uri = `${CDN_BASE_URL}${filename}`;
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

const PersonalKYC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useTranslation();

    const { data: profileData, isLoading: profileLoading } = useMyProfile();
    const queryClient = useQueryClient();

    // Step 4
    const [cardID, setCardID] = useState('');
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [errorsStep4, setErrorsStep4] = useState<ErrorState>({ cardID: false, cardType: false, fromDate: false });
    const [cardType, setCardType] = useState<'ID_CARD' | 'PASSPORT' | 'VISA'>('ID_CARD');

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

    const currentUserId = profileData?._id || '';
    const prefillKeyRef = useRef<string>('');
    const isRejectedRegistration = profileData?.businessType === 'FREELANCER' && profileData?.registrationStatus === 'REJECTED';

    useEffect(() => {
        let cancelled = false;
        if (!profileData) return;
        if (!currentUserId) return;

        const prefillKey = `${currentUserId}:${isRejectedRegistration ? 'rejected' : 'normal'}`;
        if (prefillKeyRef.current === prefillKey) return;
        prefillKeyRef.current = prefillKey;

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

            const hasStep4 = !!scopedDraft?.['@freelancer_step4'];
            const hasStep5 = !!scopedDraft?.['@freelancer_step5'];
            const hasStep6 = !!scopedDraft?.['@freelancer_step6'];

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
                setBankName(profileData.bankName || '');
                setAccountName(profileData.bankAccountName || '');
                setBankNumber(profileData.bankAccountNumber || '');
            }

        })();

        return () => {
            cancelled = true;
        };
    }, [isRejectedRegistration, profileData, currentUserId]);

    const steps = [
        t('kyc.steps.availability'),
        t('kyc.steps.portfolio'),
        t('kyc.steps.bankInfo'),
    ];

    const renderStep = () => {
        switch (step) {
            case 0:
                return <UpgradeToFreelancerStep4
                    cardType={cardType} setCardType={setCardType}
                    cardID={cardID} setCardID={setCardID}
                    fromDate={fromDate} setFromDate={setFromDate}
                    errors={errorsStep4}
                />;
            case 1:
                return <UpgradeToFreelancerStep5
                    selfieWithCard={selfieWithCard} setSelfieWithCard={setSelfieWithCard}
                    cardImage={cardImage} setCardImage={setCardImage}
                    errors={errorsStep5}
                />;
            case 2:
                return <UpgradeToFreelancerStep6
                    paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
                    bankName={bankName} setBankName={setBankName}
                    accountName={accountName} setAccountName={setAccountName}
                    bankNumber={bankNumber} setBankNumber={setBankNumber}
                    paypalInfo={paypalInfo} setPaypalInfo={setPaypalInfo}
                    errors={errorsStep6}
                />;
            default:
                return null;
        }
    };

    const { mutate: createKycInfo } = useCreateKycInfo();
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

        // ── Step 0: ID Info (was 4) ──────────────────────────────────────────
        if (step === 0) {
            const newErrors = { cardType: cardType === null, cardID: cardID.trim() === '', fromDate: fromDate === null || fromDate < new Date() };
            setErrorsStep4(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            await saveScopedStep(currentUserId, '@freelancer_step4', { cardType, cardID, fromDate });
        }

        // ── Step 1: ID Images (was 5) ────────────────────────────────────────
        if (step === 1) {
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
                console.log('❌ Step 1 (Photos) upload/save failed:', error);
                Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                return;
            } finally {
                setIsSubmitting(false);
            }
        }
        
        // ── Step 2: Bank Info (was 6) & Submit (Terminal Step) ────────────────
        if (step === 2) {
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
            await saveScopedStep(currentUserId, '@freelancer_step6', dataToSave);

            // ── Final Submission logic ────────────────────────────────────────
            setIsSubmitting(true);
            
            const isActuallyRejected = profileData?.businessType === 'FREELANCER' && profileData?.registrationStatus === 'REJECTED';

            try {
                const allStepData = await getAllScopedStepData(currentUserId);

                const reconstructedData: any = {};
                Object.keys(allStepData).forEach(stepKey => {
                    const stepData = allStepData[stepKey as keyof typeof allStepData];
                    if (!stepData) return;
                    reconstructedData[stepKey] = { ...stepData };
                });

                const hasPendingUploads =
                    !!reconstructedData['@freelancer_step5']?.selfieWithCardPath ||
                    !!reconstructedData['@freelancer_step5']?.cardImagePath;

                if (hasPendingUploads) {
                    console.log('❌ Cannot submit: pending uploads still in progress');
                    Toast.show({ type: ALERT_TYPE.DANGER, title: t('kyc.toast.error.title'), textBody: t('kyc.toast.error.body') });
                    setIsSubmitting(false);
                    return; // ✅ early return
                }

                // ── Build final payload ──────────────────────────────────────
                const step6Draft = reconstructedData['@freelancer_step6'] || {};
                const bankAccountNumberValue =
                    step6Draft?.paymentMethod === 'PAYPAL'
                        ? (step6Draft?.paypalInfo || '')
                        : (step6Draft?.bankNumber || '');

                const finalData: Partial<UserProfile> & Record<string, any> = {
                    
                    personalCardType: reconstructedData['@freelancer_step4']?.cardType,
                    personalCardID: reconstructedData['@freelancer_step4']?.cardID || '',
                    personalCardExpireDate: reconstructedData['@freelancer_step4']?.fromDate || '',
                    personalCardImage: reconstructedData['@freelancer_step5']?.existingCardImage || '',
                    userWithCardImage: reconstructedData['@freelancer_step5']?.existingSelfieWithCard || '',
                    bankAccountType: step6Draft?.paymentMethod,
                    bankName: step6Draft?.bankName || '',
                    bankAccountName: step6Draft?.accountName || '',
                    bankAccountNumber: bankAccountNumberValue,
                   
                };

                // console.log("PERsonAL KYC: ", JSON.stringify(finalData, null, 2))

                // ── onSuccess ────────────────────────────────────────────────
                const onSuccess = async (response: any) => {
                    try {
                        Toast.show({
                            type: ALERT_TYPE.SUCCESS,
                            title: t('kyc.toast.success.title'),
                            textBody: t('kyc.toast.success.body'),
                        });

                        await clearScopedKycData(currentUserId);
                        queryClient.removeQueries({ queryKey: ['freelancerStep4'] });
                        queryClient.removeQueries({ queryKey: ['freelancerStep5'] });
                        queryClient.removeQueries({ queryKey: ['freelancerStep6'] });
                        await queryClient.invalidateQueries({ queryKey: ['myProfile'] });
                        await queryClient.refetchQueries({ queryKey: ['myProfile'] });
                        navigation.popTo('FreelancerRoleGate');
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
                if (isActuallyRejected) {
                    console.log('🔄 Re-submitting rejected application...');
                    updateFreelancerProfile(finalData as UserProfile, { onSuccess, onError });
                } else {
                    console.log('🆕 Submitting new application...');
                    createKycInfo(finalData as UserProfile, { onSuccess, onError });
                }
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

        // ✅ This only runs for step 0 and 1
        if (step < 2) setStep(step + 1);
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
                                    {step === 2 ? t('kyc.buttons.save') : t('kyc.buttons.next')}
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

export default PersonalKYC;
