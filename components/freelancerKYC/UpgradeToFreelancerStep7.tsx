import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Checkbox from 'expo-checkbox';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useUpgradeToFreelancerStep7 } from 'hooks/useFreelancerKYC';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

type Props = {
  agreed: boolean;
  setAgreed: React.Dispatch<React.SetStateAction<boolean>>;
  errors: any;
};

const UpgradeToFreelancerStep7 = ({ agreed, setAgreed, errors }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>(); // ✅ Move to top, before any returns
  const { data: dataStep7, isLoading } = useUpgradeToFreelancerStep7();
  
  useEffect(() => {
    if (dataStep7?.agreed !== undefined) {
      setAgreed(dataStep7.agreed);
    }
  }, [dataStep7?.agreed]);

  const handleAgree = () => {
    setAgreed((prev) => !prev);
  };

  // ✅ Now the conditional return comes AFTER all hooks
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 px-5 pt-6">
        <Text className="text-subheading font-bold text-text mb-2">{t('kyc.step7.title')}</Text>
        <Text className="text-body text-textSecondary mb-6">
          {t('kyc.step7.subtitle')}
        </Text>

        <View className="bg-blue-50 flex-col gap-4 p-4 rounded-xl w-full mb-6">
          <View className="flex-row gap-3 items-start">
            <MaterialIcons name="support-agent" size={22} color="#2563EB" />
            <Text className="text-body text-text flex-1">
              <Text className="font-bold text-blue-800">
                {t('kyc.step7.points.review.text')}
              </Text>
            </Text>
          </View>

          <View className="flex-row gap-3 items-start">
            <Ionicons name="notifications-outline" size={22} color="#2563EB" />
            <Text className="text-body text-primary flex-1">
              {t('kyc.step7.points.notification.text')}
            </Text>
          </View>

          <View className="flex-row gap-3 items-start">
            <Ionicons name="eye-outline" size={22} color="#2563EB" />
            <Text className="text-body text-primary flex-1">
              {t('kyc.step7.points.payment.text')}
            </Text>
          </View>
        </View>
      </View>

      {/* Fixed to bottom of screen */}
      <View className="px-5 pb-6">
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
    </KeyboardAvoidingView>
  );
};

export default UpgradeToFreelancerStep7;