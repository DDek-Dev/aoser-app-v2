// import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
// import { FreelancerStackParamList, TabParamList } from 'types/navigation';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import ScreenWrapper from 'components/ui/ScreenWrapper';
// import { useCreatePublicWork } from 'hooks/usePublicWork';
// import { useState } from 'react';
// import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
// import Header_back from 'components/ui/Header_back';
// import { useTranslation } from 'react-i18next';


// type ConfirmBookingRouteProp = RouteProp<FreelancerStackParamList, 'ConfirmPostjob'>;

// const ConfirmPostjob = () => {

//     const createPublicWorkMutation = useCreatePublicWork();
//     const [isLoading, setIsLoading] = useState(false);

//     const navigation = useNavigation<NativeStackNavigationProp<TabParamList>>();
//     const navigation2 = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();


//     const route = useRoute<ConfirmBookingRouteProp>();
//     const { params } = route;
//     const [localFormData, setLocalFormData] = useState(params?.formData || {});
//     const { t } = useTranslation();

//     const handleConfirm = async () => {
//         try {
//             setIsLoading(true);

//             const result = await createPublicWorkMutation.mutateAsync(localFormData);

//             if (result?.error) {
//                 Toast.show({
//                     type: ALERT_TYPE.DANGER,
//                     title: `${t('postWork.confirm.error')}`,
//                     textBody: result.error,
//                 });
//                 setIsLoading(false);
//                 return;
//             }

//             setIsLoading(false);

//             // Navigate on success
//             setLocalFormData({
//                 workTitle: '',
//                 description: '',
//                 budget: null,
//                 category: '',
//                 kindOfWork: 'ONLINE',
//                 deadLine: null,
//                 startDate: null,
//                 subWorkDetails: [],
//                 currency: 'LAK',
//                 budgetType: 'FIXED_PRICE',
//                 serviceType: '',
//                 jobs: [],
//                 address: {
//                     country: "Laos",
//                     province: '',
//                     district: '',
//                     village: '',
//                 }
//             });


//             Toast.show({
//                 type: ALERT_TYPE.SUCCESS,
//                 title: `${t('postWork.confirm.success')}`,
//                 textBody: `${t('postWork.confirm.work_created_successfully')}`,
//             });



//                 navigation.reset({
//                     index: 0,
//                     routes: [{
//                         name: 'MainTabs' as keyof TabParamList,
//                         state: {
//                             routes: [{ name: 'Works' }]
//                         }
//                     }],
//                 });

//         } catch (error) {
//             console.log('Error:', error);
//             // Handle error (show toast, etc.)
//         }
//     };


//     return (
//         <ScreenWrapper safeEdges={['bottom', 'top']} >

//             <Header_back text={t('postWork.public_confirm.confirm')} iconColor='#3B82F6' onPress={() => navigation.goBack()} />
//             <ScrollView
//                 contentContainerStyle={{ padding: 20, flexGrow: 1 }}
//                 showsVerticalScrollIndicator={false}
//             >
//                 <Text className="text-body text-text font-semibold mb-4">
//                     {t('postWork.public_confirm.confirm_message')}
//                 </Text>

//                 <View className="bg-blue-50 border border-border p-4 rounded-xl mb-4">
//                     <View className="flex-row items-start">
//                         <Ionicons name="information-circle" size={20} color="#2563EB" className="mt-1" />
//                         <View className="ml-2 flex-1">
//                             <Text className="text-primary font-semibold mb-1">{t('postWork.public_confirm.complete_job_details')}</Text>
//                             <Text className="text-body text-text">
//                                 {t('postWork.public_confirm.system_review_description')}
//                             </Text>
//                         </View>
//                     </View>
//                 </View>

//                 <View className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
//                     <View className="flex-row items-start">
//                         <MaterialIcons name="error-outline" size={20} color="#DC2626" className="mt-1" />
//                         <View className="ml-2 flex-1">
//                             <Text className="text-red-600 font-semibold mb-1">{t('postWork.public_confirm.important_notice')}</Text>
//                             <Text className="text-body text-error">
//                                 {t('postWork.public_confirm.important_notice_description1')}
//                             </Text>
//                             <Text className="text-body text-error">
//                                 {t('postWork.public_confirm.important_notice_description2')}
//                             </Text>
//                             <Text className="text-body text-red-500 font-semibold mt-1">
//                                 {t('postWork.public_confirm.ensure_clear_post')}                            </Text>
//                         </View>
//                     </View>
//                 </View>

//                 <TouchableOpacity
//                     onPress={handleConfirm}
//                     className="bg-primary mt-auto py-4 rounded-xl "
//                 >
//                     {isLoading ? <Text className="text-white font-semibold text-base text-center">{t('postWork.public_confirm.confirming')}</Text> :
//                         <Text className="text-white font-semibold text-base text-center">{t('postWork.public_confirm.confirm_submit')}</Text>}
//                 </TouchableOpacity>
//             </ScrollView>

//         </ScreenWrapper>
//     );
// };

// export default ConfirmPostjob;


import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { FreelancerStackParamList, TabParamList } from 'types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useCreatePublicWork } from 'hooks/usePublicWork';
import { useEffect, useRef, useState } from 'react';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import Header_back from 'components/ui/Header_back';
import { useTranslation } from 'react-i18next';
import { BookingFormData } from 'types';

type ConfirmBookingRouteProp = RouteProp<FreelancerStackParamList, 'ConfirmPostjob'>;

const SLOW_TOAST_DELAY_MS = 8000; // แสดง toast เตือนถ้าส่งนานเกิน 8 วินาที

const ConfirmPostjob = () => {
    const createPublicWorkMutation = useCreatePublicWork();
    const [isLoading, setIsLoading] = useState(false);
    const slowToastShownRef = useRef(false);   // ป้องกันแสดงซ้ำ
    const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const navigation = useNavigation<NativeStackNavigationProp<TabParamList>>();
    const navigation2 = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const route = useRoute<ConfirmBookingRouteProp>();
    const { params } = route;
    const [localFormData, setLocalFormData] = useState(params?.formData || {});
    const { t } = useTranslation();

    // ล้าง timer เมื่อ component unmount
    useEffect(() => {
        return () => {
            if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        };
    }, []);

    console.log('localFormData', JSON.stringify(localFormData, null, 2))
    const startSlowTimer = () => {
        slowToastShownRef.current = false;
        slowTimerRef.current = setTimeout(() => {
            if (!slowToastShownRef.current) {
                slowToastShownRef.current = true;
                // Toast.show({
                //     type: ALERT_TYPE.WARNING,
                //     title: t('postWork.confirm.slow_title'),       // 'กำลังดำเนินการ...'
                //     textBody: t('postWork.confirm.slow_message'),   // 'ระบบกำลังประมวลผล กรุณารอสักครู่'
                // });
            }
        }, SLOW_TOAST_DELAY_MS);
    };

    const clearSlowTimer = () => {
        if (slowTimerRef.current) {
            clearTimeout(slowTimerRef.current);
            slowTimerRef.current = null;
        }
    };

    // const handleConfirm = async () => {
    //     try {
    //         setIsLoading(true);
    //         startSlowTimer();

    //         const result = await createPublicWorkMutation.mutateAsync(localFormData);

    //         clearSlowTimer();

    //         if (result?.error) {
    //             Toast.show({
    //                 type: ALERT_TYPE.DANGER,
    //                 title: t('postWork.confirm.error'),
    //                 textBody: result.error,
    //             });
    //             setIsLoading(false);
    //             return;
    //         }

    //         setIsLoading(false);

    //         setLocalFormData({
    //             workTitle: '',
    //             description: '',
    //             budget: null,
    //             kindOfWork: 'ONLINE',
    //             deadLine: null,
    //             startDate: null,
    //             subWorkDetails: [],
    //             currency: 'LAK',
    //             budgetType: 'FIXED_PRICE',
    //             serviceType: '',
    //             jobs: [],
    //             address: { country: 'Laos', province: '', district: '', village: '' },
    //         });

    //         Toast.show({
    //             type: ALERT_TYPE.SUCCESS,
    //             title: t('postWork.confirm.success'),
    //             textBody: t('postWork.confirm.work_created_successfully'),
    //         });

    //         navigation.reset({
    //             index: 0,
    //             routes: [{
    //                 name: 'MainTabs' as keyof TabParamList,
    //                 state: { routes: [{ name: 'Works' }] },
    //             }],
    //         });

    //     } catch (error) {
    //         clearSlowTimer();
    //         setIsLoading(false);
    //         Toast.show({
    //             type: ALERT_TYPE.DANGER,
    //             title: t('postWork.confirm.error'),
    //             textBody: t('postWork.confirm.network_error'), // 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    //         });
    //         console.log('Error:', error);
    //     }
    // };


    const handleConfirm = async () => {
        try {
            setIsLoading(true);
            startSlowTimer();

            // ─── Build clean payload — ตัดฟิลด์ที่ว่างออก ───────────────
            const raw = localFormData as any;

            const payload: BookingFormData = {
                workTitle: raw.workTitle,
                description: raw.description,
                kindOfWork: raw.kindOfWork,
                currency: raw.currency,
                budgetType: raw.budgetType,
                serviceType: raw.serviceType,
            };

            // budget — ส่งเฉพาะมีค่า (ไม่ใช่ null/0)
            if (raw.budget !== null && raw.budget !== undefined && raw.budget !== 0) {
                payload.budget = raw.budget;
            }

            // deadLine — ส่งเฉพาะมีค่า
            if (raw.deadLine) payload.deadLine = raw.deadLine;

            // startDate — ส่งเฉพาะมีค่า
            if (raw.startDate) payload.startDate = raw.startDate;

            // jobs — ส่งเฉพาะมี element
            if (Array.isArray(raw.jobs) && raw.jobs.length > 0) {
                payload.jobs = raw.jobs;
            }

            // subWorkDetails — ส่งเฉพาะมี element
            if (Array.isArray(raw.subWorkDetails) && raw.subWorkDetails.length > 0) {
                payload.subWorkDetails = raw.subWorkDetails;
            }

            // address — ส่งเฉพาะมีอย่างน้อย 1 ฟิลด์ที่ไม่ว่าง
            const addr = raw.address || {};
            const hasAddress = addr.province || addr.district || addr.village;
            if (hasAddress) {
                payload.address = {
                    country: addr.country || 'Laos',
                    province: addr.province || '',
                    district: addr.district || '',
                    village: addr.village || '',
                };
            }
            // ────────────────────────────────────────────────────────────

            const result = await createPublicWorkMutation.mutateAsync(payload);

            clearSlowTimer();

            if (result?.error) {
                Toast.show({
                    type: ALERT_TYPE.DANGER,
                    title: t('postWork.confirm.error'),
                    textBody: result.error,
                });
                setIsLoading(false);
                return;
            }

            setIsLoading(false);
            setLocalFormData({
                workTitle: '', description: '', budget: null,
                kindOfWork: 'ONLINE', deadLine: null, startDate: null,
                subWorkDetails: [], currency: 'LAK', budgetType: 'FIXED_PRICE',
                serviceType: '', jobs: [],
                address: { country: 'Laos', province: '', district: '', village: '' },
            });

            Toast.show({
                type: ALERT_TYPE.SUCCESS,
                title: t('postWork.confirm.success'),
                textBody: t('postWork.confirm.work_created_successfully'),
            });

            navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' as keyof TabParamList, state: { routes: [{ name: 'Works' }] } }],
            });

        } catch (error) {
            clearSlowTimer();
            setIsLoading(false);
            Toast.show({
                type: ALERT_TYPE.DANGER,
                title: t('postWork.confirm.error'),
                textBody: t('postWork.confirm.network_error'),
            });
            console.log('Error:', error);
        }
    };
    return (
        <ScreenWrapper safeEdges={['bottom', 'top']}>
            <Header_back
                text={t('postWork.public_confirm.confirm')}
                iconColor='#3B82F6'
                onPress={() => navigation.goBack()}
            />
            <ScrollView
                contentContainerStyle={{ padding: 20, flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-body text-text font-semibold mb-4">
                    {t('postWork.public_confirm.confirm_message')}
                </Text>

                <View className="bg-blue-50 border border-border p-4 rounded-xl mb-4">
                    <View className="flex-row items-start">
                        <Ionicons name="information-circle" size={20} color="#2563EB" className="mt-1" />
                        <View className="ml-2 flex-1">
                            <Text className="text-primary font-semibold mb-1">
                                {t('postWork.public_confirm.complete_job_details')}
                            </Text>
                            <Text className="text-body text-text">
                                {t('postWork.public_confirm.system_review_description')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="bg-red-50 border border-red-200 p-4 rounded-xl mb-4">
                    <View className="flex-row items-start">
                        <MaterialIcons name="error-outline" size={20} color="#DC2626" className="mt-1" />
                        <View className="ml-2 flex-1">
                            <Text className="text-red-600 font-semibold mb-1">
                                {t('postWork.public_confirm.important_notice')}
                            </Text>
                            <Text className="text-body text-error">
                                {t('postWork.public_confirm.important_notice_description1')}
                            </Text>
                            <Text className="text-body text-error">
                                {t('postWork.public_confirm.important_notice_description2')}
                            </Text>
                            <Text className="text-body text-red-500 font-semibold mt-1">
                                {t('postWork.public_confirm.ensure_clear_post')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ปุ่ม Confirm — disabled และแสดง spinner ระหว่าง loading */}
                <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={isLoading}                          // ← disable ปุ่มระหว่างส่ง
                    activeOpacity={isLoading ? 1 : 0.7}
                    className={`mt-auto py-4 rounded-xl flex-row items-center justify-center gap-2 ${isLoading ? 'bg-gray-400' : 'bg-primary'  // ← เปลี่ยนสีเมื่อ disabled
                        }`}
                >
                    {isLoading && (
                        <ActivityIndicator color="white" size="small" />
                    )}
                    <Text className="text-white font-semibold text-base text-center">
                        {isLoading
                            ? t('postWork.public_confirm.confirming')
                            : t('postWork.public_confirm.confirm_submit')
                        }
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </ScreenWrapper>
    );
};

export default ConfirmPostjob;