import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import FormInput from 'components/ui/Input';
import InputNumber from 'components/ui/InputNumber';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { useTranslation } from 'react-i18next';
import { useMyProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';

const EditFreelancerBank_InfomationSection = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [paymentMethod, setPaymentMethod] = useState<'LAOS_BANK' | 'PAYPAL'>('LAOS_BANK');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankNumber, setBankNumber] = useState('');
  const [paypalInfo, setPaypalInfo] = useState('');
  const [errors, setErrors] = useState({
    bankName: false,
    accountName: false,
    bankNumber: false,
    paypalInfo: false,
  });

  const { data, isLoading } = useMyProfile();
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateMyProfile();

  console.log('data', data?.bankName);
  useEffect(() => {
    if (data) {
      setPaymentMethod((data.bankAccountType as 'LAOS_BANK' | 'PAYPAL') || 'LAOS_BANK');
      setBankName(data.bankName || '');
      setAccountName(data.bankAccountName || '');
      
      if (data.bankAccountType === 'LAOS_BANK') {
        setBankNumber(data.bankAccountNumber || '');
        setPaypalInfo('');
      } else {
        setPaypalInfo(data.bankAccountNumber || '');
        setBankNumber('');
      }
    }
  }, [data]);

  const inputRef = useRef<TextInput>(null);

  const validateForm = () => {
    const newErrors = {
      bankName: !bankName.trim(),
      accountName: !accountName.trim(),
      bankNumber: paymentMethod === 'LAOS_BANK' && (!bankNumber.trim() || bankNumber.length < 8),
      paypalInfo: paymentMethod === 'PAYPAL' && !paypalInfo.trim(),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const handleUpdate = () => {
    if (!validateForm()) return;

    const updateData = {
      bankAccountType: paymentMethod,
      bankName: bankName.trim(),
      bankAccountName: accountName.trim(),
      bankAccountNumber: paymentMethod === 'LAOS_BANK' ? bankNumber.trim() : paypalInfo.trim(),
    };

    updateProfile(updateData, {
      onSuccess: () => {
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: t('kyc.toast.success.title'),
          textBody: t('kyc.toast.success.onupdate'),
        });
        navigation.goBack();
      },
      onError: () => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: t('kyc.toast.oops.title'),
          textBody: t('kyc.toast.oops.body'),
        });
      },
    });
  };

  const handlePaymentMethodChange = (method: 'LAOS_BANK' | 'PAYPAL') => {
    setPaymentMethod(method);
  };

  const handleBankNumberChange = (text: string) => {
    const onlyNumbers = text.replace(/[^0-9]/g, '');
    setBankNumber(onlyNumbers);
  };

  const handlePaypalChange = (text: string) => {
    setPaypalInfo(text);
  };

  const handleBack = () => navigation.goBack();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenWrapper safeEdges={['top']}>
      <ScrollView className="flex-1 px-5 pt-6">
        <View className="flex-row items-center bg-primary p-4 rounded-2xl mb-6">
          <View>
            <Text className="font-semibold text-white text-heading">
              {t('kyc.step6.title')}
            </Text>
            <Text className="text-white text-body">
              {t('kyc.step6.subtitle')}
            </Text>
          </View>
        </View>

        {/* Toggle Buttons */}
        <View className="flex-row mb-6 gap-4">
          <TouchableOpacity
            onPress={() => handlePaymentMethodChange('LAOS_BANK')}
            className={`flex-1 border rounded-xl py-3 items-center ${paymentMethod === 'LAOS_BANK' ? 'border-primary bg-blue-50' : 'border-border'
              }`}
          >
            <Text className={`text-body ${paymentMethod === 'LAOS_BANK' ? 'text-primary' : 'text-text'}`}>
              {t('kyc.step6.methods.LAOS_BANK')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={true}
            onPress={() => handlePaymentMethodChange('PAYPAL')}
            className={`flex-1 border bg-gray-300 rounded-xl py-3 items-center ${paymentMethod === 'PAYPAL' ? 'border-primary bg-blue-50' : 'border-border'
              }`}
          >
            <Text className={`text-body ${paymentMethod === 'PAYPAL' ? 'text-primary' : 'text-gray-200'}`}>
              {t('kyc.step6.methods.PAYPAL')}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-blue-50 px-4 pt-4 pb-6 rounded-xl">
          {/* Bank Name */}
          <View className="mb-4">
            <FormInput
              label={t('kyc.step6.bankName.label')}
              placeholder={t('kyc.step6.bankName.placeholder')}
              value={bankName}
              onChangeText={setBankName}
              required
              inputClassName={errors.bankName ? 'border-error' : 'border-border'}
              isValidate={errors.bankName ? t('kyc.step6.bankName.error') : ''}
            />
          </View>
          {/* Account Name */}
          <View className="mb-4">
            <FormInput
              label={t('kyc.step6.accountName.label')}
              placeholder={t('kyc.step6.accountName.placeholder')}
              value={accountName}
              onChangeText={setAccountName}
              required
              inputClassName={errors.accountName ? 'border-error' : 'border-border'}
              isValidate={errors.accountName ? t('kyc.step6.accountName.error') : ''}
            />
          </View>

          {/* Lao Bank */}
          {paymentMethod === 'LAOS_BANK' && (
            <View className="mb-2">
              <InputNumber
                ref={inputRef}
                label={t('kyc.step6.bankAccount.label')}
                placeholder={t('kyc.step6.bankAccount.placeholder')}
                value={bankNumber}
                onChangeText={handleBankNumberChange}
                required
                inputClassName={errors.bankNumber ? 'border-error' : 'border-border'}
                isValidate={errors.bankNumber ? t('kyc.step6.bankAccount.error') : ''}
              />
              <Text className="text-caption text-textSecondary mt-1">
                {t('kyc.step6.bankAccount.hint')}
              </Text>
            </View>
          )}

          {/* PayPal */}
          {paymentMethod === 'PAYPAL' && (
            <View className="mb-4">
              <FormInput
                label={t('kyc.step6.paypal.label')}
                placeholder={t('kyc.step6.paypal.placeholder')}
                value={paypalInfo}
                onChangeText={handlePaypalChange}
                required
                inputClassName={errors.paypalInfo ? 'border-error' : 'border-border'}
                isValidate={errors.paypalInfo ? t('kyc.step6.paypal.error') : ''}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View className="px-4 mb-6 flex-row gap-4">
        <TouchableOpacity
          onPress={handleBack}
          className="bg-textSecondary mt-6 py-4 rounded-full items-center w-1/3"
          disabled={isUpdating}
        >
          <Text className="text-white text-base font-semibold">
            {t('kyc.buttons.back')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleUpdate}
          className={`bg-primary mt-6 py-4 rounded-full items-center w-64 ${isUpdating ? 'opacity-50' : ''}`}
          disabled={isUpdating}
        >
          <Text className="text-white text-base font-semibold">
            {isUpdating ? t('payment.saving') : t('kyc.update.update')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: insets.bottom }} />
    </ScreenWrapper>
  );
};

export default EditFreelancerBank_InfomationSection;
