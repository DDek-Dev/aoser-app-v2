import { useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useSubmitFreelancerProfile } from 'hooks/useFreelancerKYC';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useCreateFreelancer, useUpdateFreelancerProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { District, FileWithType, Province } from 'types';

import {
    saveFileToTemp,
    saveStepData,
    getAllStepData,
    uploadAllFiles,
    cleanup,
    createFileMeta,
    AoserProfileData,
    Step1Data,
    Step2Data,
    Step5Data,
    Step6Data,
    Step7Data
} from 'utils/fileStorage';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';


interface ErrorState {
    [key: string]: boolean;
}


const UpgradeToFreelancer = () => {

    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useTranslation();
    // Aoser profile setting
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileImg, setProfileImg] = useState<FileWithType | null>(null);
    const [userId, setUserId] = useState('');
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateMyProfile();

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


    const [aoserProfile, setAoserProfile] = useState<ErrorState>({

        firstName: false,
        lastName: false,
        profileImg: false,

    });


    // Step1 
    const [jobTitle, setJobTitle] = useState('');
    const [bannerImageFile, setBannerImageFile] = useState<FileWithType | null>(null);
    const [promoVideoFile, setPromoVideoFile] = useState<FileWithType | null>(null);
    const [freelancerType, setFreelancerType] = useState('FULLTIME');
    const [category, setCategory] = useState('');
    const [subcategories, setSubcategories] = useState<string[]>([]);
    const [errorsStep1, setErrorsStep1] = useState<ErrorState>({ jobTitle: false, category: false, bannerImageFile: false, freelancerType: false });

    // Step2
    const [aboutMe, setAboutMe] = useState('');
    const [skills, setSkills] = useState<string[]>([]);
    const [experiences, setExperiences] = useState<string[]>(['']);
    const [resumeImageFile, setResumeImageFile] = useState<FileWithType | null>(null);
    const [certificateImages, setCertificateImages] = useState<FileWithType[]>([]);
    const [errorsStep2, setErrorsStep2] = useState<ErrorState>({ aboutMe: false, skills: false, experiences: false });


    // step 3

    const [serviceDesc, setServiceDesc] = useState('');
    const [hourlyRate, setHourlyRate] = useState(0);
    const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
    // const [errorsStep3, setErrorsStep3] = useState<ErrorState>({ serviceDesc: false, hourlyRate: false });

    const [errorsStep3, setErrorsStep3] = useState({
        serviceDesc: false,
        hourlyRate: false
    });

    // Step 4

    const [cardID, setCardID] = useState('');
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [phone, setPhone] = useState('');
    const [cardType, setCardType] = useState<'ID_CARD' | 'PASSPORT' | 'VISA'>('ID_CARD');

    const [selectedProvince, setSelectedProvince] = useState<Province | undefined>(undefined);
    const [selectedDistrict, setSelectedDistrict] = useState<District | undefined>(undefined);
    const [village, setVillage] = useState('');
    const [errorsStep4, setErrorsStep4] = useState<ErrorState>({
        phone: false,
        cardID: false,
        cardType: false,
        fromDate: false,
        province: false,
        district: false,
        village: false,
    });




    // step 5
    const [selfieWithCard, setSelfieWithCard] = useState<FileWithType | null>(null);
    const [cardImage, setCardImage] = useState<FileWithType | null>(null);
    const [errorsStep5, setErrorsStep5] = useState<ErrorState>({
        selfieWithCard: false,
        cardImage: false,
    })

    //   Step 6

    const [paymentMethod, setPaymentMethod] = useState<'LAOS_BANK' | 'PAYPAL'>('LAOS_BANK');
    const [accountName, setAccountName] = useState('');
    const [bankNumber, setBankNumber] = useState('');
    const [paypalInfo, setPaypalInfo] = useState('');
    const [errorsStep6, setErrorsStep6] = useState<ErrorState>({

    });


    // step 7
    const [agreed, setAgreed] = useState(false);
    const [errorsStep7, setErrorsStep7] = useState<ErrorState>({

        agreed: false,
    });



    const renderStep = () => {
        switch (step) {

            case 0:
                return <AoserProfileSetting
                    userId={userId}
                    setUserId={setUserId}
                    firstName={firstName}
                    lastName={lastName}
                    profileImg={profileImg}
                    setFirstName={setFirstName}
                    setLastName={setLastName}
                    setProfileImg={setProfileImg}
                    errors={aoserProfile}
                />;
            case 1:
                return <UpgradeToFreelancerStep1

                    jobTitle={jobTitle}
                    bannerImageFile={bannerImageFile}
                    promoVideoFile={promoVideoFile}
                    freelancerType={freelancerType}
                    category={category}
                    subcategories={subcategories}
                    setJobTitle={setJobTitle}
                    setBannerImageFile={setBannerImageFile}
                    setPromoVideoFile={setPromoVideoFile}
                    setFreelancerType={setFreelancerType}
                    setCategory={setCategory}
                    setSubcategories={setSubcategories}
                    errors={errorsStep1}

                />;
            case 2:
                return <UpgradeToFreelancerStep2
                    aboutMe={aboutMe}
                    setAboutMe={setAboutMe}
                    skills={skills}
                    setSkills={setSkills}
                    experiences={experiences}
                    setExperiences={setExperiences}
                    resumeImageFile={resumeImageFile}
                    setResumeImageFile={setResumeImageFile}
                    certificateImages={certificateImages}
                    setCertificateImages={setCertificateImages}
                    errors={errorsStep2}
                />;
            case 3:
                return <UpgradeToFreelancerStep3
                    serviceDesc={serviceDesc}
                    setServiceDesc={setServiceDesc}
                    hourlyRate={hourlyRate}
                    setHourlyRate={setHourlyRate}
                    budgetCurrency={budgetCurrency}
                    setBudgetCurrency={setBudgetCurrency}
                    errors={errorsStep3}
                />;
            case 4:
                return <UpgradeToFreelancerStep4
                    cardType={cardType}
                    setCardType={setCardType}
                    cardID={cardID}
                    setCardID={setCardID}
                    fromDate={fromDate}
                    setFromDate={setFromDate}
                    phone={phone}
                    setPhone={setPhone}
                    errors={errorsStep4}

                    // address
                    province={selectedProvince}
                    setProvince={setSelectedProvince}
                    district={selectedDistrict}
                    setDistrict={setSelectedDistrict}
                    village={village}
                    setVillage={setVillage}
                />;
            case 5:
                return <UpgradeToFreelancerStep5
                    selfieWithCard={selfieWithCard}
                    setSelfieWithCard={setSelfieWithCard}
                    cardImage={cardImage}
                    setCardImage={setCardImage}
                    errors={errorsStep5}
                />;
            case 6:
                return <UpgradeToFreelancerStep6
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    accountName={accountName}
                    setAccountName={setAccountName}
                    bankNumber={bankNumber}
                    setBankNumber={setBankNumber}
                    paypalInfo={paypalInfo}
                    setPaypalInfo={setPaypalInfo}
                    errors={errorsStep6}
                />;
            case 7:
                return <UpgradeToFreelancerStep7
                    agreed={agreed}
                    setAgreed={setAgreed}
                    errors={errorsStep7}
                />;
            case 8:
                return <UpgradeToFreelancerReview />;
            default:
                return null;
        }
    };
    // const { mutateAsync: submitProfile, isPending, isSuccess, error } = useSubmitFreelancerProfile();

    const { mutate: createFreelancer } = useCreateFreelancer();

    const handleNext = async () => {
        console.log("Submitting step ", step);
        if (isSubmitting) return;
        if (step === 0) {


            const newErrors: ErrorState = {
                firstName: firstName.trim() === '',
                lastName: lastName.trim() === '',
                profileImg: !profileImg?.uri,
            };
            setAoserProfile(newErrors);

            if (Object.values(newErrors).some(Boolean)) {
                console.log("❌ Validation failed", newErrors);
                return;
            }
            // ---------------------------
            // 2. BASE DATA
            // ---------------------------
            const dataToSave: AoserProfileData = {
                userId,
                firstName,
                lastName,
            };

            // ---------------------------
            // 3. PROFILE IMAGE HANDLING
            // ---------------------------
            if (profileImg?.uri) {
                // Improved local image detection
                const isLocalImage =
                    profileImg.uri.startsWith("file://") ||
                    profileImg.uri.startsWith("content://") ||
                    profileImg.uri.startsWith("ph://") || // iOS Photos
                    profileImg.uri.startsWith("assets-library://") || // Legacy iOS
                    !profileImg.uri.startsWith("http://") && !profileImg.uri.startsWith("https://");

                console.log("📷 profileImg:", profileImg);
                console.log("📌 isLocalImage:", isLocalImage);
                console.log("📌 URI:", profileImg.uri);

                // ---------------------------
                // 3A. LOCAL IMAGE → SAVE TO TEMP
                // ---------------------------
                if (isLocalImage) {
                    try {
                        const ext = profileImg.type?.split("/")[1] || "jpg";
                        const fileName = `profile_${Date.now()}.${ext}`;
                        const tempPath = await saveFileToTemp(profileImg.uri, fileName);
                        dataToSave.profileImg = {
                            uri: tempPath,
                            name: profileImg.name || fileName,
                            type: profileImg.type || "image/jpeg",
                        };
                    } catch (error) {
                        console.log("❌ Failed to save image to temp:", error);
                        dataToSave.profileImg = {
                            uri: profileImg.uri,
                            name: profileImg.name || `profile_${Date.now()}.jpg`,
                            type: profileImg.type || "image/jpeg",
                        };
                    }
                }
                // ---------------------------
                // 3B. REMOTE IMAGE → DO NOT COPY
                // ---------------------------
                else {

                    dataToSave.profileImg = {
                        uri: profileImg.uri,
                        name: "existing_profile.jpg",
                        type: profileImg.type || "image/jpeg",
                    };
                }
            }

            // ---------------------------
            // 4. SAVE ALL DATA
            // ---------------------------
            // console.log("💾 Saving Aoser Profile Data:", dataToSave);
            await saveStepData("@aoser_profile", dataToSave);

            // console.log("✅ Step 0 saved successfully!");
        }

        // Step 1: Basic Info
        if (step === 1) {
            const newErrors: ErrorState = {
                jobTitle: jobTitle.trim() === '',
                category: category.trim() === '',
                bannerImageFile: bannerImageFile === null,
                freelancerType: freelancerType.trim() === '',
            };

            setErrorsStep1(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            const dataToSave: Step1Data = {
                jobTitle,
                category,
                subcategories,
                freelancerType,
            };

            console.log("💾 Saving Step 1 Data:", dataToSave);

            // Handle banner image
            if (bannerImageFile) {
                const tempPath = await saveFileToTemp(
                    bannerImageFile.uri,
                    `banner_${Date.now()}.${bannerImageFile.type.split('/')[1]}`
                );
                dataToSave.bannerImagePath = tempPath;
                dataToSave.bannerImageMeta = createFileMeta(bannerImageFile);
            }

            // Handle promo video
            if (promoVideoFile) {
                const tempPath = await saveFileToTemp(
                    promoVideoFile.uri,
                    `promo_${Date.now()}.${promoVideoFile.type.split('/')[1]}`
                );
                dataToSave.promoVideoPath = tempPath;
                dataToSave.promoVideoMeta = createFileMeta(promoVideoFile);
            }

            // console.log("💾 Saving Step 1 Data:", dataToSave);

            await saveStepData('@freelancer_step1', dataToSave);
        }


        // Step 2: Skills & Experience
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

            const dataToSave: Step2Data = {
                skills: cleanedSkills,
                experience: cleanedExperiences,
                aboutMe,
            };

            // Handle resume image
            if (resumeImageFile) {
                const tempPath = await saveFileToTemp(
                    resumeImageFile.uri,
                    `resume_${Date.now()}.${resumeImageFile.type.split('/')[1]}`
                );
                dataToSave.resumeImagePath = tempPath;
                dataToSave.resumeImageMeta = createFileMeta(resumeImageFile);
            }

            // Handle certificate images array
            if (certificateImages.length > 0) {
                dataToSave.certificatePaths = [];
                dataToSave.certificateMetas = [];

                for (let i = 0; i < certificateImages.length; i++) {
                    const cert = certificateImages[i];
                    const tempPath = await saveFileToTemp(
                        cert.uri,
                        `cert_${i}_${Date.now()}.${cert.type.split('/')[1]}`
                    );
                    dataToSave.certificatePaths.push(tempPath);
                    dataToSave.certificateMetas.push(createFileMeta(cert));
                }
            }



            await saveStepData('@freelancer_step2', dataToSave);
        }


        if (step == 3) {

            const newErrors = {
                serviceDesc: serviceDesc.trim() === '',
                hourlyRate: hourlyRate === 0,
            };
            setErrorsStep3(newErrors);
            const hasError = Object.values(newErrors).some(Boolean);
            if (hasError) {
                return;
            }
            const formData = {
                serviceDesc: serviceDesc,
                hourlyRate: hourlyRate,
                budgetCurrency: budgetCurrency,
            };
            try {
                await AsyncStorage.setItem('@freelancer_step3', JSON.stringify(formData));
                // console.log('✅ Step 3 data saved:', formData);
            } catch (error) {
                console.log('❌ Failed to save step 3 data:', error);
            }
        }



        if (step == 4) {
            const newErrors = {
                cardType: cardType === null,
                cardID: cardID.trim() === '',
                fromDate: fromDate === null,
                phone: phone.trim() === '',
                province: selectedProvince === undefined,
                district: selectedDistrict === undefined,
                village: village.trim() === '',

            }

            setErrorsStep4(newErrors);
            const hasError = Object.values(newErrors).some(Boolean);
            if (hasError) {
                return;
            }

            const formData = {
                cardType: cardType,
                cardID: cardID,
                fromDate: fromDate,
                phone: phone,
                // address: {
                //     province: selectedProvince,
                //     district: selectedDistrict,
                //     village: village,
                //     latitude: 0,
                //     longitude: 0,
                // },

                address: {
                    province: selectedProvince,  // ✅ String value
                    district: selectedDistrict,  // ✅ String value
                    village: village,                               // ✅ Already string
                    latitude: 0,
                    longitude: 0,
                    country: 'Laos', // Add country if needed
                },
            };

            console.log('🚀 ~ file: UpgradeToFreelancer.tsx ~ line 107 ~ handleNextPress ~ formData', formData)

            try {
                await AsyncStorage.setItem('@freelancer_step4', JSON.stringify(formData));

            } catch (error) {
                console.log('❌ Failed to save step 4 data:', error);
            }
        }

        // Step 5: KYC Images
        if (step === 5) {
            const newErrors: ErrorState = {
                selfieWithCard: selfieWithCard === null,
                cardImage: cardImage === null,
            };

            setErrorsStep5(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            const dataToSave: Step5Data = {};

            // Handle selfie with card
            if (selfieWithCard) {
                const tempPath = await saveFileToTemp(
                    selfieWithCard.uri,
                    `selfie_${Date.now()}.${selfieWithCard.type.split('/')[1]}`
                );
                dataToSave.selfieWithCardPath = tempPath;
                dataToSave.selfieWithCardMeta = createFileMeta(selfieWithCard);
            }

            // Handle card image
            if (cardImage) {
                const tempPath = await saveFileToTemp(
                    cardImage.uri,
                    `card_${Date.now()}.${cardImage.type.split('/')[1]}`
                );
                dataToSave.cardImagePath = tempPath;
                dataToSave.cardImageMeta = createFileMeta(cardImage);
            }

            await saveStepData('@freelancer_step5', dataToSave);
        }

        // Step 6: Bank Information
        if (step === 6) {
            const newErrors: ErrorState = {
                accountName: accountName.trim() === '',
                ...(paymentMethod === 'PAYPAL'
                    ? { paypalInfo: paypalInfo.trim() === '' }
                    : { bankNumber: bankNumber.trim() === '' }),
            };

            setErrorsStep6(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            const dataToSave: Step6Data = {
                paymentMethod,
                accountName,
                ...(paymentMethod === 'PAYPAL'
                    ? { paypalInfo }
                    : { bankNumber }),
            };

            await saveStepData('@freelancer_step6', dataToSave);
        }

        // Step 7: Agreement
        if (step === 7) {
            const newErrors: ErrorState = {
                agreed: agreed === false,
            };

            setErrorsStep7(newErrors);
            if (Object.values(newErrors).some(Boolean)) return;

            const dataToSave: Step7Data = {
                agreed,
            };

            await saveStepData('@freelancer_step7', dataToSave);
        }

        if (step === 8) {
            setIsSubmitting(true);
            try {


                Toast.show({
                    type: ALERT_TYPE.INFO,
                    title: t('kyc.toast.uploading.title'),
                    textBody: t('kyc.toast.uploading.body'),
                });



                // Get all saved data
                const allStepData = await getAllStepData();




                // Reconstruct file objects from paths and metadata
                const reconstructedData: any = {};

                Object.keys(allStepData).forEach(stepKey => {
                    const stepData = allStepData[stepKey as keyof typeof allStepData];
                    if (!stepData) return;

                    reconstructedData[stepKey] = { ...stepData };

                    // Reconstruct individual files
                    Object.keys(stepData).forEach(key => {
                        if (key.endsWith('Path') && stepData[key.replace('Path', 'Meta') as keyof typeof stepData]) {
                            const filePath = stepData[key as keyof typeof stepData] as string;
                            const fileMeta = stepData[key.replace('Path', 'Meta') as keyof typeof stepData];

                            reconstructedData[stepKey][key.replace('Path', 'File')] = {
                                uri: filePath,
                                name: (fileMeta as any).name,
                                type: (fileMeta as any).type
                            };

                            // Clean up the path and meta keys
                            delete reconstructedData[stepKey][key];
                            delete reconstructedData[stepKey][key.replace('Path', 'Meta')];
                        }
                    });

                    // Reconstruct certificate arrays
                    if ('certificatePaths' in stepData && 'certificateMetas' in stepData) {
                        const paths = stepData.certificatePaths as string[];
                        const metas = stepData.certificateMetas as any[];

                        reconstructedData[stepKey].certificateFiles = paths.map((path, index) => ({
                            uri: path,
                            name: metas[index].name,
                            type: metas[index].type
                        }));

                        delete reconstructedData[stepKey].certificatePaths;
                        delete reconstructedData[stepKey].certificateMetas;
                    }
                });






                // Upload all files
                const uploadResults = await uploadAllFiles(reconstructedData);
                // const uploadResults = await uploadAllFiles(reconstructedData);
                // console.log('📤 Upload results:', uploadResults);


                // console.log('✅ Files uploaded, constructing final data...');
                const firstName = reconstructedData['@aoser_profile']?.firstName || '';
                const lastName = reconstructedData['@aoser_profile']?.lastName || '';
                const userProfileImage = uploadResults['@aoser_profile']?.profileImg as string || '';

                const finalData = {

                    // Personal Info

                    // firstName: reconstructedData['@aoser_profile']?.firstName || '',
                    // lastName: reconstructedData['@aoser_profile']?.lastName || '',
                    // userProfileImage: uploadResults['@aoser_profile']?.profileImg as string || '',

                    // Business Info
                    businessType: 'FREELANCER',
                    jobTitle: reconstructedData['@freelancer_step1']?.jobTitle || '',
                    freelancerType: reconstructedData['@freelancer_step1']?.freelancerType || 'FULLTIME',

                    // Media - CORRECTED property names
                    bannerImage: uploadResults['@freelancer_step1']?.bannerImageFile as string || '',
                    videoPromote: uploadResults['@freelancer_step1']?.promoVideoFile as string || '',
                    resumeImage: uploadResults['@freelancer_step2']?.resumeImageFile as string || '',

                    // Certificates - CORRECTED step and property name
                    // certificates: uploadResults['@freelancer_step2']?.certificateFiles as string[] || [],
                    certificates: (() => {
                        const certFiles = uploadResults.certificateFiles;
                        if (!certFiles) return [];

                        // If it's already an array, return it
                        if (Array.isArray(certFiles)) return certFiles as string[];

                        // If it's an object with numeric keys, convert to array
                        return Object.values(certFiles) as string[];
                    })(),
                    // Professional Info
                    serviceType: reconstructedData['@freelancer_step1']?.category || '',
                    jobs: reconstructedData['@freelancer_step1']?.subcategories || [],
                    about: reconstructedData['@freelancer_step2']?.aboutMe || '', // Note: aboutMe not about
                    skills: reconstructedData['@freelancer_step2']?.skills || [],
                    workExperience: reconstructedData['@freelancer_step2']?.experience || [], // Note: experience not workExperience
                    customerExpect: reconstructedData['@freelancer_step3']?.serviceDesc || '',
                    hourlyRate: reconstructedData['@freelancer_step3']?.hourlyRate || '',

                    // KYC Info
                    phone: reconstructedData['@freelancer_step4']?.phone || '',
                    personalCardType: reconstructedData['@freelancer_step4']?.cardType,
                    personalCardID: reconstructedData['@freelancer_step4']?.cardID || '',
                    personalCardExpireDate: reconstructedData['@freelancer_step4']?.fromDate || '',

                    // CORRECTED property names
                    personalCardImage: uploadResults['@freelancer_step5']?.cardImageFile as string || '',
                    userWithCardImage: uploadResults['@freelancer_step5']?.selfieWithCardFile as string || '',

                    // Address
                    address: {
                        country: 'Laos',
                        province: reconstructedData['@freelancer_step4']?.address.province.province_la as string,
                        district: reconstructedData['@freelancer_step4']?.address.district.district_la as string,
                        village: reconstructedData['@freelancer_step4']?.address.village,
                        latitude: 0,
                        longitude: 0
                    },

                    // Bank Info
                    bankAccountType: reconstructedData['@freelancer_step6']?.paymentMethod,
                    bankAccountName: reconstructedData['@freelancer_step6']?.accountName || '',
                    bankAccountNumber: reconstructedData['@freelancer_step6']?.bankNumber || '',
                };



                // Submit to backend
                createFreelancer(finalData, {

                    onSuccess: async (response) => {





                        const profileData = {
                            firstName: firstName.trim(),
                            lastName: lastName.trim(),
                            userProfileImage: userProfileImage,
                        };

                        // console.log("Updating profile with data:", profileData);

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

                        Toast.show({
                            type: ALERT_TYPE.SUCCESS,
                            title: t('kyc.toast.success.title'),
                            textBody: t('kyc.toast.success.body'),
                        });

                        // Clean up temp files and storage
                        await cleanup();
                        // Navigate back
                        navigation.popTo('FreelancerRoleGate');
                        setIsSubmitting(false);
                    },
                    onError: (error) => {
                        console.log('❌ Submission failed:', error);

                        Toast.show({
                            type: ALERT_TYPE.DANGER,
                            title: t('kyc.toast.error.title'),
                            textBody: t('kyc.toast.error.body'),
                        });
                        setIsSubmitting(false);

                    }
                });




            } catch (error) {
                console.log('❌ Error in submission process:', error);
                Toast.show({
                    type: ALERT_TYPE.DANGER,
                    title: t('kyc.toast.oops.title'),
                    textBody: t('kyc.toast.oops.body'),
                });
            }
        }

        if (step < steps.length - 1) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
            {/* Step Progress Bar - Fixed at top */}
            <StepProgressFreelancerBar currentStep={step} steps={steps} />

            {/* Main Content Area */}
            <View style={{ flex: 1 }}>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 110}
                    style={{ flex: 1, backgroundColor: 'white' }}
                >

                    {/* Scrollable Content */}
                    <ScrollView

                        contentContainerStyle={{
                            //   paddingHorizontal: 16,
                            paddingTop: 16,
                            paddingBottom: 16,
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={true}
                    // scrollEventThrottle={16}
                    >

                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

                            <View>{renderStep()}</View>
                        </TouchableWithoutFeedback>
                    </ScrollView>


                    <View className='px-4 mb-6 flex-row gap-4 '>
                        {step > 0 && (

                            <TouchableOpacity
                                onPress={handleBack}
                                className="bg-textSecondary mt-6 py-4 rounded-full items-center w-1/3"
                            >
                                <Text className="text-white text-base font-semibold">{t('kyc.buttons.back')}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            onPress={handleNext}
                            disabled={isSubmitting} // Disable button when submitting
                            className={`bg-primary mt-6 py-4 rounded-full items-center justify-center ${step > 0 ? 'w-64' : 'w-full'
                                } ${isSubmitting ? 'opacity-70' : ''}`} // Reduce opacity when loading
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" size="small" /> // Show spinner when submitting
                            ) : (
                                <Text className="text-white text-base font-semibold">
                                    {step === 8 ? t('kyc.buttons.submit') : t('kyc.buttons.next')}
                                </Text>
                            )}
                        </TouchableOpacity>

                    </View>

                </KeyboardAvoidingView>


            </View>

            {/* Safe area bottom spacing */}
            <View style={{ height: insets.bottom, backgroundColor: 'white' }} />
        </SafeAreaView>
    );
};

export default UpgradeToFreelancer;
