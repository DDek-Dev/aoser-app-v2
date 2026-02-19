import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from 'utils/dateFormatter';
import { aoserlogo_no_bg_blue, bcelone, pal } from 'assets';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { useTranslation } from 'react-i18next';

interface PaymentSuccessPopupProps {
  visible: boolean;
  onClose: () => void;
  paymentData: any;
}

const PaymentSuccessPopup: React.FC<PaymentSuccessPopupProps> = ({
  visible,
  onClose,
  paymentData,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { t } = useTranslation();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const qrRef = useRef<ViewShot>(null);

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      checkAnim.setValue(0);
      fadeAnim.setValue(0);

      // Sequence of animations
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(checkAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const formatCurrency = (amount: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
      }).format(amount);
    } catch (err) {
      return String(amount);
    }
  };

  const saveBillToGallery = async () => {
    try {
      setIsDownloading(true);

      if (qrRef.current && qrRef.current.capture) {
        const uri = await qrRef.current.capture();

        if (!uri) {
          throw new Error('Failed to capture Bill image');
        }

        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('Aceer Payments', asset, false);

        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Success',
          textBody: 'Bill saved to gallery!',
        });

        onClose();
      } else {
        throw new Error('Bill not ready');
      }
    } catch (error) {
      console.log('Download error:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error',
        textBody: 'Failed to save Bill. Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  const checkRotate = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Handle no payment data
  if (!paymentData) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-[400px]">
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                {t('payment_success.no_data_title')}
              </Text>
              <Text className="text-gray-600 text-center">
                {t('payment_success.no_data_message')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="bg-primary py-4 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-base">
                {t('payment_success.close')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Extract all data fields
  const {
    createdBy,
    payTo,
    invoiceType,
    terminalid,
    amount,
    currency,
    status,
    invoiceid,
    fromBankInformation,
    createdAt,
  } = paymentData;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="flex-1 bg-primary justify-center items-center"
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="w-[90%] max-w-[400px]"
        >
          <ViewShot
            ref={qrRef}
            options={{ format: 'png', quality: 1.0 }}
            style={{ backgroundColor: '#3B82F6', padding: 16 }}
          >
            {/* Receipt Card */}
            <View className="bg-white rounded-3xl overflow-hidden">
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
                    right: -100,
                    bottom: -100,
                    position: 'absolute',
                  }}
                >
                  <Text
                    className="text-caption font-semibold text-textSecondary"
                    style={{ lineHeight: 25 }}
                  >
                    {[...Array(50)].map((_, i) => (
                      `${fromBankInformation?.txtime || formatDate(createdAt)} • ${invoiceid} • ${formatCurrency(amount, currency)} ${currency} • AOSER • ${terminalid} • ${fromBankInformation?.service || 'Payment'}`
                    )).join('')}
                  </Text>
                </View>
              </View>

              {/* Header with Success Animation */}
              <View className="pt-8 pb-4 items-center relative overflow-hidden">
                <View className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16" />
                <View className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mb-12" />

                <Animated.View
                  style={{
                    transform: [
                      { scale: checkScale },
                      { rotate: checkRotate },
                    ],
                  }}
                  className="w-20 h-20 rounded-full bg-secondary items-center justify-center mb-4 shadow-lg"
                >
                  <Ionicons name="checkmark" size={48} color="#fff" />
                </Animated.View>

                {/* <Text className="text-2xl font-bold text-text mb-1">
                  {t('payment_success.title')}
                </Text> */}

                {/* Status Badge */}
                <View
                  className={`px-4 py-2 rounded-full mt-2 ${status === 'PAYMENT_COMPLETED' ? 'bg-green-100' : 'bg-yellow-100'
                    }`}
                >
                  <Text
                    className={`text-body font-semibold ${status === 'PAYMENT_COMPLETED' ? 'text-green-700' : 'text-yellow-700'
                      }`}
                  >
                    {status === 'PAYMENT_COMPLETED'
                      ? t('payment_success.completed')
                      : t('payment_success.pending')}
                  </Text>
                </View>
              </View>

              {/* Receipt Details */}
              <View className="px-6 py-4">
                {/* Invoice ID */}
                <View className="mb-4 items-center border-b border-dashed border-gray-300 pb-4">
                  <Text className="text-gray-500 text-xs">
                    {t('payment_success.invoice_id')} {invoiceid}
                  </Text>
                  {/* <Text className="text-gray-400 text-xs mt-1">
                    {t('payment_success.terminalId')}: {terminalid}
                  </Text> */}
                </View>

                {/* Amount Section - Highlighted */}
                <View className="bg-warning/10 p-4 rounded-xl mb-4 border border-warning/20">
                  <Text className="text-center text-xs text-gray-600 mb-1">
                    {t('payment_success.total_amount')}
                  </Text>
                  <Text className="text-center text-2xl font-bold text-primary">
                    {formatCurrency(amount, currency)} {currency}
                  </Text>
                </View>

                {/* Transaction Details */}
                <View className="space-y-3 mb-4">
                  {/* Customer Name */}
                  {createdBy && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-gray-600 text-sm">
                        {t('payment_success.name_of_customer')}
                      </Text>
                      <Text className="text-gray-800 font-semibold text-sm">
                        {createdBy.firstName} {createdBy.lastName}
                      </Text>
                    </View>
                  )}

                  {/* Freelancer Name */}
                  {payTo && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-gray-600 text-sm">
                        {t('payment_success.name_of_freelancer')}
                      </Text>
                      <Text className="text-gray-800 font-semibold text-sm">
                        {payTo.firstName} {payTo.lastName}
                      </Text>
                    </View>
                  )}

                  {/* Payment Type */}
                  <View className="flex-row justify-between py-2 border-b border-gray-100">
                    <Text className="text-gray-600 text-sm">
                      {t('payment_success.payment_type')}
                    </Text>
                    <Text className="text-gray-800 font-semibold text-sm">
                      {invoiceType}
                    </Text>
                  </View>

                  {/* Payment Method */}
                  <View className="flex-row justify-between py-2 items-center border-b border-gray-100">
                    <Text className="text-gray-600 text-sm">
                      {t('payment_success.paid_via')}
                    </Text>
                    <View className="flex-row items-center">
                      {fromBankInformation?.service === 'ONEPAY' ? (
                        <Image source={bcelone} className="w-5 h-5 rounded-full mr-2" />
                      ) : (
                        <Image source={pal} className="w-5 h-5 rounded-full mr-2" />
                      )}
                      <Text className="text-gray-800 font-semibold text-sm">
                        {fromBankInformation?.service || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {/* Transaction Time */}
                  {fromBankInformation?.txtime && (
                    <View className="flex-row justify-between py-2 border-b border-gray-100">
                      <Text className="text-gray-600 text-sm">
                        {t('payment_success.transaction_time')}
                      </Text>
                      <Text className="text-gray-800 font-semibold text-sm">
                        {fromBankInformation.txtime}
                      </Text>
                    </View>
                  )}

                  {/* Transaction Reference */}
                  {/* {fromBankInformation?.fccref && (
                    <View className="flex-row justify-between py-2">
                      <Text className="text-gray-600 text-sm">
                        Reference
                      </Text>
                      <Text className="text-gray-800 font-semibold text-sm">
                        {fromBankInformation.fccref}
                      </Text>
                    </View>
                  )} */}
                </View>

                {/* Important Notice */}
                <View className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <Text className="text-error text-xs font-bold mb-2">
                    {t('payment_success.notice_title')}
                  </Text>
                  <View className="space-y-2">
                    <View className="flex-row items-start gap-2">
                      <Text className="text-primary text-xs mt-0.5">•</Text>
                      <Text className="text-[10px] text-gray-700 flex-1 leading-4">
                        {t('payment_success.important_info_point1')}
                      </Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-primary text-xs mt-0.5">•</Text>
                      <Text className="text-[10px] text-gray-700 flex-1 leading-4">
                        {t('payment_success.important_info_point2')}
                      </Text>
                    </View>
                    <View className="flex-row items-start gap-2">
                      <Text className="text-primary text-xs mt-0.5">•</Text>
                      <Text className="text-[10px] text-gray-700 flex-1 leading-4">
                        {t('payment_success.important_info_point3')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Bottom Decorative Wave Pattern */}
              <View className="relative overflow-hidden bg-primary">
                <View
                  className="flex-row"
                  style={{ height: 24 }}
                >
                  {[...Array(23)].map((_, i) => (
                    <View
                      key={i}
                      style={{
                        width: 0,
                        height: 0,
                        backgroundColor: 'transparent',
                        borderStyle: 'solid',
                        borderLeftWidth: 8,
                        borderRightWidth: 8,
                        borderBottomWidth: 24,
                        borderLeftColor: 'transparent',
                        borderRightColor: 'transparent',
                        borderBottomColor: i % 2 === 0 ? '#fff' : '#E5E7EB',
                        transform: [{ scaleY: -1 }],
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>
          </ViewShot>

          {/* Action Buttons */}
          <View className="px-4 py-4 flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-transparent py-4 rounded-xl items-center border-2 border-white"
            >
              <Text className="text-white font-semibold text-base">
                {t('payment_success.close')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={saveBillToGallery}
              disabled={isDownloading}
              className="flex-1 bg-transparent py-4 rounded-xl items-center flex-row justify-center gap-2 border-2 border-white"
            >
              {isDownloading ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white font-semibold text-base ml-2">
                    {t('payment_success.saving')}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="download-outline" size={20} color="#ffffff" />
                  <Text className="text-white font-semibold text-base ml-2">
                    {t('payment_success.save_bill')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default PaymentSuccessPopup;