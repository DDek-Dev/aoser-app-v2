import React, { useEffect } from 'react';
import {
    View,
    Text,

} from 'react-native';
import SelectImage from 'components/ui/SelectImage';

import TextArea from 'components/ui/TextArea';
import MultiInputList from 'components/ui/MultiInputList';
import SelectMultiImage from 'components/ui/SelectMultiImage';
import { useUpgradeToFreelancerStep2 } from 'hooks/useFreelancerKYC';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { FileWithType } from 'types';
import { useTranslation } from 'react-i18next';


type Props = {
    aboutMe: string;
    setAboutMe: (aboutMe: string) => void;
    skills: string[];
    setSkills: React.Dispatch<React.SetStateAction<string[]>>;
    experiences: string[];
    setExperiences: React.Dispatch<React.SetStateAction<string[]>>;
  
    certificateImages: FileWithType[];
    setCertificateImages: (certificateImages: FileWithType[]) => void;
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
        errors,
    }: Props
) => {



    const { t } = useTranslation();
    const { data: dataStep2, isLoading } = useUpgradeToFreelancerStep2();

    useEffect(() => {
        if (dataStep2) {
            setAboutMe(dataStep2.aboutMe || '');
            setSkills(dataStep2.skills?.length > 0 ? dataStep2.skills : ['']);
            setExperiences(dataStep2.experience?.length > 0 ? dataStep2.experience : ['']);
            setCertificateImages(dataStep2.certificateImages || []);
        }
    }, [dataStep2]);



    if (isLoading) {
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


      
            {/* certificates Upload */}
            <SelectMultiImage
                label={t('kyc.step2.certificate_label')}
                images={certificateImages}
                onChange={setCertificateImages}
                inputClassName="border border-border"
            />



        </View>

    );
};

export default UpgradeToFreelancerStep2;
