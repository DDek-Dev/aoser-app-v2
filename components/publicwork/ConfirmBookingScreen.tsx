import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { FreelancerStackParamList, TabParamList } from 'types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useCreatePublicWork } from 'hooks/usePublicWork';
import { useState } from 'react';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import Header_back from 'components/ui/Header_back';
import { useTranslation } from 'react-i18next';


type ConfirmBookingRouteProp = RouteProp<FreelancerStackParamList, 'ConfirmBookingScreen'>;

const ConfirmBookingScreen = () => {

    const createPublicWorkMutation = useCreatePublicWork();
    const [isLoading, setIsLoading] = useState(false);

    const navigation = useNavigation<NativeStackNavigationProp<TabParamList>>();


    const route = useRoute<ConfirmBookingRouteProp>();
    const { params } = route;
    const [localFormData, setLocalFormData] = useState(params?.formData || {});
    const { t } = useTranslation();

    console.log('localFormData', localFormData);



  
    const handleConfirm = async () => {
        try {
            setIsLoading(true);

            const result = await createPublicWorkMutation.mutateAsync(localFormData);

            if (result?.error) {
                Toast.show({
                    type: ALERT_TYPE.DANGER,
                    title: `${t('postWork.confirm.error')}`,
                    textBody: result.error,
                });
                setIsLoading(false);
                return;
            }

            setIsLoading(false);

            // Navigate on success
            setLocalFormData({
                workTitle: '',
                description: '',
                budget: null,
                category: '',
                kindOfWork: 'ONLINE',
                deadLine: null,
                startDate: null,
                subWorkDetails: [],
                currency: 'LAK',
                budgetType: 'FIXED_PRICE',
                serviceType: '',
                jobs: [],
                address: {
                    country: "Laos",
                    province: '',
                    district: '',
                    village: '',
                }
            });


            Toast.show({
                type: ALERT_TYPE.SUCCESS,
                title: `${t('postWork.confirm.success')}`,
                textBody: `${t('postWork.confirm.work_created_successfully')}`,
            });

            navigation.reset({
                index: 0,
                routes: [{
                    name: 'MainTabs' as keyof TabParamList,
                    state: {
                        routes: [{ name: 'Works' }]
                    }
                }],
            });
        } catch (error) {
            console.log('Error:', error);
            // Handle error (show toast, etc.)
        }
    };

      ;
    return (
        <ScreenWrapper safeEdges={['bottom', 'top']} >

            <Header_back text={t('postWork.confirm.confirm')} iconColor='#3B82F6' onPress={() => navigation.goBack()} />
            <ScrollView
                contentContainerStyle={{ padding: 20, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >

        
                <Text className="text-body text-text font-semibold mb-4">
                    {t('postWork.confirm.confirm_message')}
                </Text>

                <View className="bg-blue-50 border border-border p-4 rounded-xl mb-4">
                    <View className="flex-row items-start">
                        <Ionicons name="information-circle" size={20} color="#2563EB" className="mt-1" />
                        <View className="ml-2 flex-1">
                            <Text className="text-primary font-semibold mb-1">{t('postWork.confirm.complete_job_details')}</Text>
                            <Text className="text-body text-text">
                            {t('postWork.confirm.system_review_description')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                    <View className="flex-row items-start">
                        <MaterialIcons name="error-outline" size={20} color="#DC2626" className="mt-1" />
                        <View className="ml-2 flex-1">
                            <Text className="text-red-600 font-semibold mb-1">{t('postWork.confirm.important_notice')}</Text>
                            <Text className="text-body text-error">
                               {t('postWork.confirm.important_notice_description')}
                            </Text>
                            <Text className="text-body text-red-500 font-semibold mt-1">
                                {t('postWork.confirm.ensure_clear_post')}                            </Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleConfirm}
                    className="bg-primary mt-auto py-4 rounded-xl "
                >
                    {isLoading ? <Text className="text-white font-semibold text-base text-center">{t('postWork.confirm.confirming')}</Text> :
                        <Text className="text-white font-semibold text-base text-center">{t('postWork.confirm.confirm_submit')}</Text>}
                </TouchableOpacity>
            </ScrollView>

        </ScreenWrapper>
    );
};

export default ConfirmBookingScreen;
