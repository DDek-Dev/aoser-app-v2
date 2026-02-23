import Header_back from 'components/ui/Header_back';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect } from 'react';
import { useGetBillData } from 'hooks/usePayment'; // Adjust path
import { useTranslation } from 'react-i18next';

import { Ionicons } from '@expo/vector-icons';
import { formatDate } from 'utils/dateFormatter';
import { aoserlogo_no_bg_blue, bcelone, pal } from 'assets';
import { useNavigation } from '@react-navigation/native';
type Props = {
    route: any;
};


const PaymentDetail_Id = ({ route }: Props) => {
    const { t } = useTranslation();
    const { workId } = route.params;

    const getBillDataMutation = useGetBillData(workId);
    const navigation = useNavigation();

    useEffect(() => {
        if (workId) {
            getBillDataMutation.mutate(workId);
        }
    }, [workId]);

    const formatCurrency = (amount: number, currency: string) => {
        try {
            return new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
            }).format(amount);
        } catch (err) {
            return String(amount);
        }
    };

    // Loading State
    if (getBillDataMutation.isPending) {
        return (
            <ScreenWrapper safeEdges={['bottom', 'top']}>
                <Header_back text={t('protectedRoute.protectedRoute')} onPress={navigation.goBack} iconColor='#3B82F6' />

                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text className="text-text mt-4">{t('payment_success.loading')}</Text>
                </View>
            </ScreenWrapper>
        );
    }

    // Error State
    if (getBillDataMutation.isError) {
        return (
            <ScreenWrapper safeEdges={['bottom', 'top']}>
                <Header_back text={t('protectedRoute.protectedRoute')} onPress={navigation.goBack} iconColor='#3B82F6' />

                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                        <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
                    </View>
                    <Text className="text-xl font-bold text-gray-800 mb-2 text-center">
                        {t('payment_success.error_loading')}
                    </Text>
                    <Text className="text-text text-center mb-6">
                        {t('payment_success.error_loading_message')}
                    </Text>
                    <TouchableOpacity
                        onPress={() => getBillDataMutation.mutate(workId)}
                        className="bg-primary py-3 px-6 rounded-xl"
                    >
                        <Text className="text-white font-semibold">
                            {t('payment_success.try_again')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    const billData = getBillDataMutation.data;

    // console.log("billData: ", JSON.stringify(billData, null, 2));
    if (!billData || !billData.payment) {
        return (
            <ScreenWrapper safeEdges={['bottom', 'top']}>
                <Header_back text={t('protectedRoute.protectedRoute')} onPress={navigation.goBack} iconColor='#3B82F6' />

                <View className="flex-1 justify-center items-center px-6">
                    <Text className="text-xl font-bold text-gray-800 mb-2">
                        {t('payment_success.no_data_title')}
                    </Text>
                    <Text className="text-text text-center">
                        {t('payment_success.no_data_message')}
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }

    const { payment } = billData;
    const {
        createdBy,
        invoiceType,
        terminalid,
        amount,
        currency,
        status,
        invoiceid,
        fromBankInformation,
        createdAt: paymentCreatedAt,
        payTo
    } = payment as any;


    if (!payment.createdBy) {
        return (
            <ScreenWrapper safeEdges={['bottom', 'top']}>
                <Header_back
                    text={t('protectedRoute.protectedRoute')}
                    onPress={navigation.goBack}
                    iconColor="#3B82F6"
                />
                <View className="flex-1 justify-center items-center">
                    <Text className="text-text">
                        {t('payment_success.completed')}
                    </Text>
                </View>
            </ScreenWrapper>
        );
    }
    return (
        <ScreenWrapper safeEdges={['bottom', 'top']}>
            <Header_back text={t('protectedRoute.protectedRoute')} onPress={navigation.goBack} iconColor='#3B82F6' />

            <ScrollView className="flex-1 px-4 py-4">
                {/* Status Badge */}
                <View className="mb-4 items-center">
                    <View
                        className={`px-6 py-3 rounded-full ${status === 'PAYMENT_COMPLETED' ? 'bg-green-100' : 'bg-yellow-100'
                            }`}
                    >
                        <View className="flex-row items-center">
                            <Ionicons
                                name={status === 'PAYMENT_COMPLETED' ? 'checkmark-circle' : 'time-outline'}
                                size={20}
                                color={status === 'PAYMENT_COMPLETED' ? '#10B981' : '#F59E0B'}
                            />
                            <Text
                                className={`ml-2 font-semibold ${status === 'PAYMENT_COMPLETED' ? 'text-green-700' : 'text-yellow-700'
                                    }`}
                            >
                                {status === 'PAYMENT_COMPLETED'
                                    ? t('payment_success.completed')
                                    : t('payment_success.pending')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Main Card */}
                <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
                    {/* Watermark Background (logo) */}
                    <View className="absolute inset-0 opacity-[0.1]  ">
                        <Image
                            source={aoserlogo_no_bg_blue}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    </View>

                    {/* Watermark Background - Line by Line Pattern */}


                    <View className="absolute inset-0 opacity-[0.1] overflow-hidden">
                        <View
                            style={{
                                transform: [{ rotate: '-30deg' }],
                                top: -100,
                                left: -100,
                                right: -200,
                                bottom: -100,
                                position: 'absolute',
                            }}
                        >
                            <Text
                                className="text-caption font-semibold text-textSecondary"
                                style={{ lineHeight: 25 }}
                            >
                                {[...Array(80)].map((_, i) => (
                                    `${formatDate(payment.fromBankInformation.txtime)} • ${payment.invoiceId} • ${formatCurrency(payment.amount, payment.currency)} ${payment.currency} • AOSER • `
                                )).join('')}
                            </Text>
                        </View>
                    </View>

                    {/* Header Section */}
                    <View className="bg-primary p-4">
                        <Text className="text-white text-center text-body font-bold ">
                            {t('payment_success.payment_details')}
                        </Text>

                    </View>

                    {/* Amount Section */}
                    <View className="bg-warning/10 p-6 border-b border-dashed border-border">
                        <Text className="text-textSecondary text-center text-cation mb-2">
                            {t('payment_success.total_amount')}
                        </Text>
                        <Text className="text-primary text-center text-3xl font-bold">
                            {formatCurrency(amount, currency)} {currency}
                        </Text>
                    </View>

                    {/* Details Section */}
                    <View className="p-6 space-y-4">


                        {/* Terminal ID */}
                        <View className="flex-row justify-between py-3 border-b border-border">
                            <Text className="text-text">{t('payment_success.invoice_id')}</Text>
                            <Text className="text-gray-900 font-semibold">{invoiceid}</Text>
                        </View>
                        <View className="flex-row justify-between py-3 border-b border-border">
                            <Text className="text-text">{t('payment_success.name_of_customer')}</Text>
                            <Text className="text-gray-900 font-semibold">{createdBy.firstName} {createdBy.lastName}</Text>
                        </View>

                        <View className="flex-row justify-between py-3 border-b border-border">
                            <Text className="text-text">{t('payment_success.name_of_freelancer')}</Text>
                            {payTo && (
                                <Text className="text-gray-900 font-semibold">{payTo.firstName} {payTo.lastName}</Text>
                            )}
                        </View>


                        {/* Payment Type */}
                        <View className="flex-row justify-between py-3 border-b border-border">
                            <Text className="text-text">{t('payment_success.payment_type')}</Text>
                            <Text className="text-text font-semibold text-body">
                                {invoiceType === 'WORK' && t('tab.works')}
                                {invoiceType === 'APPEND_WORK' && t('editWork.appendNewWork')}
                                {invoiceType === 'USER_RECOMMEND_STAR' && t('profile.buyStar.stars_plural')}
                            </Text>
                            {/* <Text className="text-gray-900 font-semibold">{invoiceType}</Text> */}
                        </View>

                        {/* Payment Method */}
                        <View className="flex-row justify-between py-3 border-b border-border">
                            <Text className="text-text">{t('payment_success.paid_via')}</Text>
                            <View className="flex-row items-center">
                                {fromBankInformation?.service === 'ONEPAY' ? (
                                    <Image source={bcelone} className="w-6 h-6 rounded-full mr-2" />
                                ) : (
                                    <Image source={pal} className="w-6 h-6 rounded-full mr-2" />
                                )}
                                <Text className="text-gray-900 font-semibold">
                                    {fromBankInformation?.service || 'N/A'}
                                </Text>
                            </View>
                        </View>

                        {/* Transaction Time */}
                        {fromBankInformation?.txtime && (
                            <View className="flex-row justify-between py-3 border-b border-border">
                                <Text className="text-text">{t('payment_success.transaction_time')}</Text>
                                <Text className="text-gray-900 font-semibold">
                                    {fromBankInformation.txtime}
                                </Text>
                            </View>
                        )}



                        {/* Footer */}
                        {/* <View className="items-center py-6">
                            <View className="flex-row items-center mb-2">
                                <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                                <Text className="text-gray-600 text-sm ml-2">
                                    {t('payment_success.powered_by')}
                                </Text>
                            </View>
                            <Text className="text-gray-400 text-xs">
                                {t('payment_success.secure_payment')}
                            </Text>
                        </View> */}


                    </View>

                    <View className="mx-6 mb-6">
                        <Text className="text-error text-body font-bold mb-2">
                            {t('payment_success.notice_title')}
                        </Text>


                        <View className="space-y-3">
                            {/* Point 1 */}
                            <View className="flex-row items-start gap-2">
                                <Text className="text-primary mt-1">•</Text>
                                <Text className="text-caption text-textSecondary flex-1 leading-5">
                                    {t('payment_success.important_info_point1')}
                                </Text>
                            </View>

                            {/* Point 2 */}
                            <View className="flex-row items-start gap-2">
                                <Text className="text-primary mt-1">•</Text>
                                <Text className="text-caption text-textSecondary flex-1 leading-5">
                                    {t('payment_success.important_info_point2')}
                                </Text>
                            </View>

                            {/* Point 3 */}
                            <View className="flex-row items-start gap-2">
                                <Text className="text-primary mt-1">•</Text>
                                <Text className="text-caption text-textSecondary flex-1 leading-5">
                                    {t('payment_success.important_info_point3')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>


            </ScrollView>
        </ScreenWrapper>
    );
};

export default PaymentDetail_Id;