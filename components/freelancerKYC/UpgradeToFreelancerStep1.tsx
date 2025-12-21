import { useEffect } from 'react';
import {

    View,


} from 'react-native';

import FormInput from 'components/ui/Input';

import SelectInput from 'components/ui/SelectInput';
import SelectImage from 'components/ui/SelectImage';
import SelectVideo from 'components/ui/SelectVideo';

import SelectFreelancerType from 'components/ui/SelectfreelancerType';


import { useUpgradeToFreelancerStep1 } from 'hooks/useFreelancerKYC';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { FileWithType } from 'types';
import { useTranslation } from 'react-i18next';
// import { ServiceTypeList } from 'components/ui/Testicon';


type Props = {
    jobTitle: string;
    bannerImageFile: FileWithType | null;
    promoVideoFile: FileWithType | null;
    freelancerType: string;
    category: string;
    subcategories: string[];
    setJobTitle: (jobTitle: string) => void;
    setBannerImageFile: (bannerImageFile: FileWithType | null) => void;
    setPromoVideoFile: (promoVideoFile: FileWithType | null) => void;
    setFreelancerType: (freelancerType: string) => void;
    setCategory: (category: string) => void;
    setSubcategories: (subcategories: string[]) => void;
    errors: any;
}

const UpgradeToFreelancerStep1 = (
    {
        jobTitle,
        bannerImageFile,
        promoVideoFile,
        freelancerType,
        category,
        subcategories,
        setJobTitle,
        setBannerImageFile,
        setPromoVideoFile,
        setFreelancerType,
        setCategory,
        setSubcategories
        , errors
    }: Props
) => {

    const { data: dataStep1, isLoading } = useUpgradeToFreelancerStep1();
    // console.log("   dataStep1", dataStep1);
    useEffect(() => {
        if (dataStep1) {
            setJobTitle(dataStep1.jobTitle);

            setPromoVideoFile(dataStep1.promoVideoFile);
            setFreelancerType(dataStep1.freelancerType);
            setCategory(dataStep1.category);
            setSubcategories(dataStep1.subcategories);
            setBannerImageFile(dataStep1.bannerImageFile);
        }
    }, [dataStep1]);

    const { t } = useTranslation();
    // uplad banner image


    const freelancerTypes = [
        { value: 'FULLTIME', display: t('kyc.step1.freelancerType.fulltime') },
        { value: 'PART_TIME', display: t('kyc.step1.freelancerType.parttime') },
    ];


    // Image picker
    const handleImageChange = (file?: FileWithType) => {
        setBannerImageFile(file || null);
    };
    const handleVideoChange = (file?: FileWithType) => {

        setPromoVideoFile(file || null);
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (

        <View
            className="flex-1 px-5 pt-6"

        >
            {/* Job Title Input */}
            <FormInput
                label={t('kyc.step1.jobTitle.label')}
                placeholder={t('kyc.step1.jobTitle.placeholder')}
                value={jobTitle}
                onChangeText={setJobTitle}
                inputClassName={errors.jobTitle ? 'border-error' : 'border-border'}
                required
                isValidate={`${errors.jobTitle ? t('kyc.step1.jobTitle.required') : ''}`}
            />


            <SelectImage
                image={bannerImageFile?.uri || null}
                label={t('kyc.step1.bannerImage.label')}
                onChange={handleImageChange}
                required
                inputClassName={errors.bannerImageFile ? 'border-error' : 'border-border'}
                isValidate={`${errors.bannerImageFile ? t('kyc.step1.bannerImage.required') : ''}`}
            />

            <SelectVideo
                video={promoVideoFile?.uri || null}
                label={t('kyc.step1.promoVideo.label')}
                // required
                onChange={handleVideoChange}
            />
            {/* Freelancer Type */}


            <SelectFreelancerType
                label={t('kyc.step1.freelancerType.label')}
                value={freelancerType}
                onSelect={setFreelancerType}
                options={freelancerTypes}
                inputClassName={errors.freelancerType ? 'border-error' : 'border-border'}
                required
            // ref={categoryRef}
            />




            {/* Select service type and job category */}
            <View className='mt-2'>
                <SelectInput
                    label={t('kyc.step1.serviceType.label')}
                    value={category}
                    initialSubcategories={subcategories}
                    onSelect={(serviceTypeId, jobIds) => {
                        setCategory(serviceTypeId);
                        setSubcategories(jobIds);
                    }}
                    required
                    isValidate={errors.category ? t('kyc.step1.serviceType.required') : ''}
                />
            </View>


            {/* <ServiceTypeList /> */}

        </View>


    );
};

export default UpgradeToFreelancerStep1;
