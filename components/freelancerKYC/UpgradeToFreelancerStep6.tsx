import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput
} from 'react-native';
import FormInput from 'components/ui/Input';
import InputNumber from 'components/ui/InputNumber';
import { useUpgradeToFreelancerStep6 } from 'hooks/useFreelancerKYC';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { useTranslation } from 'react-i18next';


type Props = {
  paymentMethod: 'LAOS_BANK' | 'PAYPAL';
  accountName: string;
  bankNumber: string;
  paypalInfo: string;
  setPaymentMethod: React.Dispatch<React.SetStateAction<'LAOS_BANK' | 'PAYPAL'>>;
  setAccountName: React.Dispatch<React.SetStateAction<string>>;
  setBankNumber: React.Dispatch<React.SetStateAction<string>>;
  setPaypalInfo: React.Dispatch<React.SetStateAction<string>>;
  errors: any
};
const UpgradeToFreelancerStep6 = (
  {
    paymentMethod,
    accountName,
    bankNumber,
    paypalInfo,
    setPaymentMethod,
    setAccountName,
    setBankNumber,
    setPaypalInfo,
    errors,
  }: Props
) => {
  const { t } = useTranslation();
  const { data: dataStep6, isLoading } = useUpgradeToFreelancerStep6();
  useEffect(() => {
    if (dataStep6) {
      setPaymentMethod(dataStep6.paymentMethod);
      setAccountName(dataStep6.accountName);
      setBankNumber(dataStep6.bankNumber);
      setPaypalInfo(dataStep6.paypalInfo);
    };
  }
    , [dataStep6]);
  const inputRef = useRef<TextInput>(null);


  const handlePaymentMethodChange = (method: 'LAOS_BANK' | 'PAYPAL') => {
    setPaymentMethod(method);

    // Reset the unused input value
    if (method === 'LAOS_BANK') {
      setPaypalInfo(dataStep6?.paypalInfo || '');
      setBankNumber(bankNumber);
    } else {
      setBankNumber(dataStep6?.bankNumber || '');
      setPaypalInfo(paypalInfo);
    }
  };

  const handleBankNumberChange = (text: string) => {
    const onlyNumbers = text.replace(/[^0-9]/g, '');
    setBankNumber(onlyNumbers);
    // setPaymentInfo(onlyNumbers);
  };

  const handlePaypalChange = (text: string) => {
    setPaypalInfo(text);
    // setPaymentInfo(text);
  };


  if (isLoading) {
    return <LoadingScreen />
  }
  return (
    <View
      className="flex-1 px-5 pt-6"

    >
      <Text className="text-body text-textSecondary mb-4">
        {t('kyc.step6.subtitle')}
      </Text>

      <Text className="text-body font-bold text-text mb-2">{t('kyc.step6.title')}</Text>

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
          onPress={() => handlePaymentMethodChange('PAYPAL')}
          className={`flex-1 border rounded-xl py-3 items-center ${paymentMethod === 'PAYPAL' ? 'border-primary bg-blue-50' : 'border-border'
            }`}
        >
          <Text className={`text-body ${paymentMethod === 'PAYPAL' ? 'text-primary' : 'text-text'}`}>
            {t('kyc.step6.methods.PAYPAL')}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="bg-blue-50 px-4 pt-4 pb-6 rounded-xl">
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
    </View>


  );
};

export default UpgradeToFreelancerStep6;
