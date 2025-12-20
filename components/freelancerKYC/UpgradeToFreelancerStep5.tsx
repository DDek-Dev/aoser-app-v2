import React, { useEffect } from 'react';
import { View, Text } from 'react-native';

import SelectImage from 'components/ui/SelectImage';
import { useUpgradeToFreelancerStep5 } from 'hooks/useFreelancerKYC';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { FileWithType } from 'types';
import { personal_card_png, selfie_with_card_png } from 'assets';
import { useTranslation } from 'react-i18next';

type Props = {
  selfieWithCard: FileWithType | null;
  setSelfieWithCard:React.Dispatch<React.SetStateAction<FileWithType | null>>;
  cardImage: FileWithType | null;
  setCardImage: React.Dispatch<React.SetStateAction<FileWithType | null>>;
   errors?: Record<string, boolean>;
}

const UpgradeToFreelancerStep5 = (
  { selfieWithCard, setSelfieWithCard, cardImage, setCardImage, errors }: Props) => {

const { t } = useTranslation();

  const { data: dataStep5, isLoading } = useUpgradeToFreelancerStep5();
  useEffect(() => {
    if (dataStep5) { 
      setSelfieWithCard(dataStep5.selfieWithCard || null); 
      setCardImage(dataStep5.cardImage || null); 
    }
  }, [dataStep5]);

  const handleImageSelfieWithChange = (file?: FileWithType) => {
    setSelfieWithCard(file || null);
  }
  const handleImageCardChange = (file?: FileWithType) => {
    setCardImage(file || null);
  }
  if (isLoading) { return <LoadingScreen />; }
  return (


    <View
      className="flex-1 px-5 pt-6"

    >

      {/* Title */}
      <Text className="text-subheading text-text mb-1">{t('kyc.step5.title')}</Text>
      <Text className="text-body text-textSecondary mb-6">
        {t('kyc.step5.subtitle')}
      </Text>

      {/* Selfie with Card */}
      <View className="border border-border rounded-xl p-4 mb-6 bg-surface">

        {/* Sample image */}
        <View className="rounded-xl overflow-hidden mb-3">
          <SelectImage
            defaultimg={selfie_with_card_png}
            image={selfieWithCard?.uri || null}
           label={t('kyc.step5.selfieWithCard.label')}
            onChange={handleImageSelfieWithChange}
            required
            inputClassName={errors?.selfieWithCard ? 'border-error' : 'border-border'}
            isValidate={`${errors?.selfieWithCard ? t('kyc.step5.selfieWithCard.error'): ''}`}
          />
        </View>
        <Text className="text-body text-textSecondary mb-4">
          {t('kyc.step5.selfieWithCard.description')}
        </Text>
      </View>

      {/* Card Image */}
      <View className="border border-border rounded-xl p-4 mb-8 bg-surface">


        {/* Sample image */}
        <View className="rounded-xl overflow-hidden mb-3">
          <SelectImage
            image={cardImage?.uri || null}
            defaultimg={personal_card_png}
             label={t('kyc.step5.cardImage.label')}
            onChange={handleImageCardChange}
            required
            inputClassName={errors?.cardImage ? 'border-error' : 'border-border'}
            isValidate={`${errors?.cardImage ? t('kyc.step5.cardImage.error') : ''}`}
          />
        </View>

        <Text className="text-body text-textSecondary mb-4">
           {t('kyc.step5.cardImage.description')}

        </Text>
      </View>



    </View>

  );
};

export default UpgradeToFreelancerStep5;
