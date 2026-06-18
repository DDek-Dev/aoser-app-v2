import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
} from 'react-native';

import TextArea from 'components/ui/TextArea';
import MultiInputList from 'components/ui/MultiInputList';
import SelectMultiImage from 'components/ui/SelectMultiImage';
import { useUpgradeToFreelancerStep2, useUpgradeToFreelancerStep3 } from 'hooks/useFreelancerKYC';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { FileWithType } from 'types';
import { useTranslation } from 'react-i18next';
import Checkbox from 'expo-checkbox';
import { useNavigation } from '@react-navigation/native';
import BudgetInputKYC from 'components/ui/BudgetIputKYC';


type Props = {
    aboutMe: string;
    setAboutMe: (aboutMe: string) => void;
    skills: string[];
    setSkills: React.Dispatch<React.SetStateAction<string[]>>;
    experiences: string[];
    setExperiences: React.Dispatch<React.SetStateAction<string[]>>;
  
    certificateImages: FileWithType[];
    setCertificateImages: (certificateImages: FileWithType[]) => void;

    serviceDesc: string;
    setServiceDesc: (val: string) => void;
    hourlyRate: number;
    setHourlyRate: (val: number) => void;
    budgetCurrency: 'LAK' | 'USD';
    setBudgetCurrency: (val: 'LAK' | 'USD') => void;
    rateType: 'PER_HOUR' | 'PER_JOB' | 'PER_DAY';
    setRateType: (val: 'PER_HOUR' | 'PER_JOB' | 'PER_DAY') => void;
    agreed: boolean;
    setAgreed: (val: boolean) => void;
    errors: any;
}
const UpgradeToFreelancerStep2 = (
    {
        aboutMe,
        setAboutMe,
        skills,
        setSkills,
        experiences,
        setExperiences,

        certificateImages,
        setCertificateImages,

        serviceDesc,
        setServiceDesc,
        hourlyRate,
        setHourlyRate,
        budgetCurrency,
        setBudgetCurrency,
        rateType,
        setRateType,
        agreed,
        setAgreed,
        errors,
    }: Props
) => {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const { data: dataStep2, isLoading: loadingStep2 } = useUpgradeToFreelancerStep2();
    const { data: dataStep3, isLoading: loadingStep3 } = useUpgradeToFreelancerStep3();

    useEffect(() => {
        if (dataStep2) {
            setAboutMe(dataStep2.aboutMe || '');
            setSkills(dataStep2.skills?.length > 0 ? dataStep2.skills : ['']);
            setExperiences(dataStep2.experience?.length > 0 ? dataStep2.experience : ['']);
            if (dataStep2.certificateImages !== undefined) {
                setCertificateImages(dataStep2.certificateImages);
            }
        }
    }, [dataStep2]);

    useEffect(() => {
        if (dataStep3) {
            setServiceDesc(dataStep3.serviceDesc || '');
            setHourlyRate(dataStep3.hourlyRate || 0);
            setBudgetCurrency(dataStep3.budgetCurrency || 'LAK');
            setRateType(dataStep3.rateType || 'PER_HOUR');
        }
    }, [dataStep3]);

    const handleAgree = () => {
        setAgreed(!agreed);
    };

    if (loadingStep2 || loadingStep3) {
        return <LoadingScreen />
    }
    return (


        <View
            className="flex-1 px-5 pt-6"

        >
            {/* Headline */}
            <Text className="text-subheading font-bold text-text mb-2">{t('kyc.step2.headline')}</Text>
            <Text className="text-body text-textSecondary mb-4">
                {t('kyc.step2.subtitle')}
            </Text>

            {/* About Me */}
            <View className="mb-4">

                <TextArea
                    label={t('kyc.step2.about_label')}
                    placeholder={t('kyc.step2.about_placeholder')}
                    value={aboutMe}
                    onChangeText={setAboutMe}
                    inputClassName={errors.aboutMe ? 'border-error' : 'border-border'}
                    required
                    isValidate={`${errors.aboutMe ? t('kyc.step2.about_required') : ''}`}
                />
                <Text className="text-caption text-textSecondary mt-1 text-right">{aboutMe.length}/500</Text>

                <View className='bg-blue-50 border border-primary rounded-xl px-4 py-2 items-center mt-4'>


                    <Text className="text-caption text-primary my-2">
                        💡 {t('kyc.step2.about_tip')}
                    </Text>
                </View>
            </View>

            <MultiInputList
                title={t('kyc.step2.skills_title')}
                placeholder={t('kyc.step2.skills_placeholder')}
                values={skills}
                onChange={(text, index) => {
                    const updated = [...skills];
                    updated[index] = text;
                    setSkills(updated);
                }}
                onAdd={() => {
                    setSkills((prev) => [...prev, '']);
                }}
                onRemove={(index) => {
                    const updated = [...skills];
                    updated.splice(index, 1);
                    setSkills(updated);
                }}
                required
                inputClassName={errors.skills ? 'border-error' : 'border-border'}
                isValidate={errors.skills ? t('kyc.step2.skills_required') : ''}
            />

            <MultiInputList
                title={t('kyc.step2.experience_title')}
                placeholder={t('kyc.step2.experience_placeholder')}
                values={experiences}
                onChange={(text, index) => {
                    const updated = [...experiences];
                    updated[index] = text;
                    setExperiences(updated);
                }}
                onAdd={() => setExperiences((prev) => [...prev, ''])}
                onRemove={(index) => {
                    const updated = [...experiences];
                    updated.splice(index, 1);
                    setExperiences(updated);
                }}

                required
                inputClassName={errors.experiences ? 'border-error' : 'border-border'}

                isValidate={errors.experiences ? t('kyc.step2.experience_required') : ''}

            />


            {/* Service & Rate (Merged from Step 3) */}
            <View className="mb-6 mt-4">
                <Text className="text-subheading  text-text mb-2">{t('kyc.step3.title')}</Text>
                <Text className="text-caption text-textSecondary mb-4">
                    {t('kyc.step3.subtitle')}
                </Text>

                <View className='bg-blue-50 rounded-xl p-4'>
                    <TextArea
                        label={t('kyc.step3.serviceDescription.label')}
                        placeholder={t('kyc.step3.serviceDescription.placeholder')}
                        value={serviceDesc}
                        onChangeText={setServiceDesc}
                        inputClassName={errors.serviceDesc ? 'border-error' : 'border-border'}
                        required
                        isValidate={`${errors.serviceDesc ? t('kyc.step3.serviceDescription.error') : ''}`}
                    />
                    <BudgetInputKYC
                        label={t('kyc.step3.hourlyRate.label')}
                        value={hourlyRate}
                        onChange={setHourlyRate}
                        currency={budgetCurrency}
                        onCurrencyChange={setBudgetCurrency}
                        rateType={rateType}
                        setRateType={setRateType}
                        error={errors.hourlyRate}
                        required
                        isValidate={`${errors.hourlyRate ? t('kyc.step3.hourlyRate.error') : ''}`}
                        isRateTypeShow={true}
                    />

                    <View className="bg-blue-50 border border-primary rounded-xl px-4 py-2 items-center mt-4">
                        <Text className="text-caption text-primary my-2">
                            💡  {t('kyc.step3.tip')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* certificates Upload */}
            <SelectMultiImage
                label={t('kyc.step2.certificate_label')}
                images={certificateImages}
                onChange={setCertificateImages}
                inputClassName="border border-border"
            />

            {/* Agreement Checkbox */}
            <View className="px-5 pb-6 mt-4">
                <TouchableOpacity
                    onPress={handleAgree}
                    className="flex-row items-center"
                    activeOpacity={0.8}
                >
                    <Checkbox
                        value={agreed}
                        onValueChange={handleAgree}
                        color={errors.agreed === true ? '#EF4444' : '#3B82F6'}
                    />
                    <Text className="ml-2 text-body text-text flex-1">
                        {t('kyc.step7.agreement.text')}{' '}
                        <Text
                            className="text-primary underline"
                            onPress={() => navigation.navigate('PrivacyPolicyScreen')}
                        >
                            {t('kyc.step7.agreement.policy')}
                        </Text>
                    </Text>
                </TouchableOpacity>
                {errors.agreed && (
                    <Text className="text-caption text-error mt-1">
                        {t('kyc.step7.agreement.error')}
                    </Text>
                )}
            </View>



        </View>

    );
};

export default UpgradeToFreelancerStep2;
