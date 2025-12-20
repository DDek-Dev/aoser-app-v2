import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
} from 'react-native';
import TextArea from 'components/ui/TextArea';
import BudgetInput from 'components/ui/BudgetInput';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { ScrollView } from 'react-native-gesture-handler';
import { useMyProfile, useUpdateMyProfile } from 'hooks/useFreelancer';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';

const EditFreelancerOffer = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [serviceDesc, setServiceDesc] = useState('');
    const [hourlyRate, setHourlyRate] = useState<number | null>(null); // Allow null
    const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
    const [errors, setErrors] = useState({ 
        serviceDesc: false, 
        hourlyRate: false 
    });

    const { data, isLoading } = useMyProfile();
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateMyProfile();

    useEffect(() => {
        if (data) {
            setServiceDesc(data.customerExpect || '');
            setHourlyRate(data.hourlyRate || null);
            setBudgetCurrency(data.hourlyRateCurrency || 'LAK');
        }


    }, [data]);
    console.log("data show ing --- ", data?.hourlyRateCurrency , data?.hourlyRate, data?.customerExpect);

    const validateForm = () => {
        const newErrors = {
            serviceDesc: !serviceDesc.trim(),
            hourlyRate: hourlyRate === null || hourlyRate === 0 || hourlyRate === undefined
        };
        
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error);
    };

    const handleBack = () => {
        navigation.goBack();
    };

    const handleUpdate = async () => {
        if (!validateForm()) {
            Toast.show({
                type: ALERT_TYPE.DANGER,
                title: 'Validation Error',
                textBody: 'Please fill all required fields correctly.',
            });
            return;
        }

        const formData = {
            customerExpect: serviceDesc.trim(),
            hourlyRate: hourlyRate || 0, // Ensure it's a number
            hourlyRateCurrency: budgetCurrency
        };

        console.log("formData", formData);

        try {
            updateProfile(formData, {
                onSuccess: () => {
                    Toast.show({
                        type: ALERT_TYPE.SUCCESS,
                        title: 'Success!',
                        textBody: 'Profile updated successfully.',
                    });
                    navigation.goBack();
                },
                onError: (error) => {
                    Toast.show({
                        type: ALERT_TYPE.DANGER,
                        title: 'Error!',
                        textBody: error.message || 'Failed to update profile. Please try again.',
                    });

                    console.log('Error updating profile:', error);
                }   
            });
        } catch (error) {
            Toast.show({
                type: ALERT_TYPE.DANGER,
                title: 'Error!',
                textBody: 'An unexpected error occurred.',
            });
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <ScreenWrapper safeEdges={['top']}>
            <ScrollView className="flex-1 px-5 pt-6">
                <View className="flex-row items-center bg-primary p-4 rounded-2xl mb-6">
                    <View>
                        <Text className="font-semibold text-white text-heading">What Do You Offer?</Text>
                        <Text className="text-white text-body">Write what customer can expect on you and make explain clearly in the tag.</Text>
                    </View>
                </View>

                <View className='bg-blue-50 rounded-xl p-4'>
                    <TextArea
                        label="What customers can expect from you?"
                        placeholder="Describe your service, your process, and what makes you unique. Be clear and concise..."
                        value={serviceDesc}
                        onChangeText={(text) => {
                            setServiceDesc(text);
                            if (errors.serviceDesc && text.trim()) {
                                setErrors(prev => ({ ...prev, serviceDesc: false }));
                            }
                        }}
                        inputClassName={errors.serviceDesc ? 'border-error' : 'border-border'}
                        required
                        isValidate={errors.serviceDesc ? 'Service Description is required' : ''}
                    />

                    <BudgetInput
                        label="Hourly Rate"
                        value={hourlyRate}
                        onChange={(value) => {
                            setHourlyRate(value);
                            if (errors.hourlyRate && value > 0) {
                                setErrors(prev => ({ ...prev, hourlyRate: false }));
                            }
                        }}
                        currency={budgetCurrency}
                        onCurrencyChange={setBudgetCurrency}
                        error={errors.hourlyRate}
                        required
                        isValidate={errors.hourlyRate ? 'Hourly Rate is required' : ''}
                    />

                    <View className="bg-blue-50 border border-primary rounded-xl px-4 py-2 items-center mt-4">
                        <Text className="text-caption text-primary my-2">
                            💡 This will help customers understand your value.
                        </Text>
                    </View>
                </View>
            </ScrollView>

            <View className='px-4 mb-6 flex-row gap-4 '>
                <TouchableOpacity
                    onPress={handleBack}
                    className="bg-textSecondary mt-6 py-4 rounded-full items-center w-1/3"
                    disabled={isUpdating}
                >
                    <Text className="text-white text-base font-semibold">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleUpdate}
                    className={`bg-primary mt-6 py-4 rounded-full items-center w-64 ${isUpdating ? 'opacity-50' : ''}`}
                    disabled={isUpdating}
                >
                    <Text className="text-white text-base font-semibold">
                        {isUpdating ? 'Updating...' : 'Update'}
                    </Text>
                </TouchableOpacity>
            </View>
            
            <View style={{ height: insets.bottom }} />
        </ScreenWrapper>
    );
};

export default EditFreelancerOffer;