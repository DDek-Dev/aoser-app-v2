import { useEffect } from 'react';
import {
    View,
    Text,
    Pressable,

} from 'react-native';
import TextArea from 'components/ui/TextArea';
import BudgetInput from 'components/ui/BudgetInput';
import { useUpgradeToFreelancerStep3 } from 'hooks/useFreelancerKYC';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BudgetInputKYC from 'components/ui/BudgetIputKYC';

type Props = {
    serviceDesc: string;
    hourlyRate: number;
    budgetCurrency: 'USD' | 'LAK';
    rateType: 'PER_HOUR' | 'PER_JOB' | 'PER_DAY';
    setRateType: (rateType: 'PER_HOUR' | 'PER_JOB' | 'PER_DAY') => void;
    setServiceDesc: (serviceDesc: string) => void;
    setHourlyRate: (hourlyRate: number) => void;
    setBudgetCurrency: (budgetCurrency: 'USD' | 'LAK') => void;
    errors: {
        serviceDesc: boolean;
        hourlyRate: boolean;
    };
}

const UpgradeToFreelancerStep3 = (
    {
        serviceDesc,
        hourlyRate,
        budgetCurrency,
        rateType,
        setRateType,
        setServiceDesc,
        setHourlyRate,
        setBudgetCurrency,
        errors,
    }: Props
) => {

    const { t } = useTranslation();
    const { data: dataStep3, isLoading } = useUpgradeToFreelancerStep3();

    useEffect(() => {
        if (dataStep3) {
            setServiceDesc(dataStep3.serviceDesc);
            setHourlyRate(dataStep3.hourlyRate);
            setBudgetCurrency(dataStep3.budgetCurrency);
            if (dataStep3.rateType) {
                setRateType(dataStep3.rateType);
            }
        }
    }, [dataStep3]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>

            <View
                className="flex-1 px-5 pt-6"

            >
                <Text className="text-subheading  text-text mb-2">{t('kyc.step3.title')}</Text>
                <Text className="text-caption text-textSecondary mb-4">
                    {t('kyc.step3.subtitle')}
                </Text>

                <View className='bg-blue-50 rounded-xl p-4'>


                    <TextArea
                        label={t('kyc.step3.serviceDescription.label')}
                        placeholder={t('kyc.step3.serviceDescription.placeholder')}
                        // placeholder={'...'}
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
                        isValidate={`${errors.serviceDesc ? t('kyc.step3.hourlyRate.error') : ''}`}
                        isRateTypeShow={true}
                    />

                    <View className="bg-blue-50 border border-primary rounded-xl px-4 py-2 items-center mt-4">
                        <Text className="text-caption text-primary my-2">
                            💡  {t('kyc.step3.tip')}
                        </Text>
                    </View>
                </View>


            </View>
        </>

    );
};

export default UpgradeToFreelancerStep3;
