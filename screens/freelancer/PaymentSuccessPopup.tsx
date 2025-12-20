import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Animated, Image, ActivityIndicator } from 'react-native';
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

  console.log('paymentData');
  console.log('paymentData', JSON.stringify(paymentData, null, 2));



  // console.log('getBillDataMutation', JSON.stringify(getBillDataMutation, null, 2));
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
        // Fade in background
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Scale up receipt
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        // Animate check mark
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
      if (!currency) {
        return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount);
      }
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
      }).format(amount);
    } catch (err) {
      return String(amount);
    }
  };

  const saveBillToGallery = async () => {
    // Alert.alert('Success', 'Bill saved to gallery!');
    try {
      setIsDownloading(true);

      if (qrRef.current && qrRef.current.capture) {
        const uri = await qrRef.current.capture();

        if (!uri) {
          throw new Error('Failed to capture Bill image');
        }

        // Save to device
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

      setIsDownloading(false);
    } catch (error) {
      console.log('Download error:', error);
      // Alert.alert('Error', 'Failed to save Bill. Please try again.');
      setIsDownloading(false);
    }
  };

  const { t } = useTranslation();

  // Use fake data if no payment data
  // const data = paymentData || {
  // const data = {
  //   amount: 7000000,
  //   currency: 'LAK',
  //   terminalId: '230725ASW9VQIP4X33001',
  //   createdAt: "2025-12-09T17: 06: 55.724Z",
  //   bankName: 'BCEL One',
  //   transactionId: '230725ASW9VQIP4X33001',
  //   fromAccount: '1234-5678-9012',

  // };


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

  // const data = paymentData || {
  const data = {
    amount: paymentData.amount,
    currency: paymentData.currency,
    terminalId: paymentData.terminalid,
    createdAt: paymentData.createdAt,
    bankName: paymentData.fromBankInformation.service,
    invoiceType: paymentData.invoiceType,
    invoiceId: paymentData.invoiceid,

  };

  const checkScale = checkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  const checkRotate = checkAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        // className="w-[90%] max-w-[400px] px-4"
        >
          <ViewShot
            ref={qrRef}
            options={{ format: 'png', quality: 1.0 }}

            style={{ backgroundColor: '#3B82F6', width: '80%', padding: 32 }}


          >


            {/* Receipt Card */}
            <View className="bg-white rounded-t-3xl overflow-hidden">
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
                      `${formatDate(paymentData.fromBankInformation.txtime)} • ${data.invoiceId} • ${formatCurrency(data.amount, data.currency)} ${data.currency} • AOSER • ${data.terminalId} • ${data.bankName}`
                    )).join('')}
                  </Text>
                </View>
              </View>

              {/* Header with Success Animation */}
              <View className="pt-8  items-center relative overflow-hidden">

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

                <Text className="text-2xl font-bold text-text mb-1">
                  {t('payment_success.title')}
                </Text>

              </View>

              {/* Receipt Details */}
              <View className="px-6 py-6">
                {/* Date and Transaction ID */}
                <View className="mb-6 items-center border-b border-dashed border-gray-300 pb-4">

                  <Text className="text-gray-500 text-xs">
                    {t('payment_success.terminalId')} {data.invoiceId}
                  </Text>
                </View>

                <View className='absolute  right-0'>

                  <View className="">
                    <Image source={aoserlogo_no_bg_blue} className="w-64 h-134 opacity-[0.1]" resizeMode="cover" />


                  </View>
                </View>
                <View className=" bg-warning p-4 mb-6">
                  <Text className="text-center text-sm text-white/90 mb-1">
                    {t('payment_success.payment_details')}
                  </Text>


                </View>

                {/* Amount Section - Highlighted */}

                {/* Transaction Details */}
                <View className="space-y-3 mb-6">
                  <View className="flex-row justify-between py-2">
                    <Text className="text-gray-600">{t('payment_success.amount')}</Text>
                    <Text className="text-red-600 font-semibold">
                      {formatCurrency(data.amount, data.currency)} {data.currency}
                    </Text>
                  </View>

                  <View className="flex-row justify-between py-2">
                    <Text className="text-gray-600">{t('payment_success.payment_type')}</Text>
                    <Text className="text-gray-800 font-semibold">
                      {data.invoiceType}
                    </Text>
                  </View>

                  <View className="flex-row justify-between py-2 items-center">
                    <Text className="text-gray-600">{t('payment_success.paid_via')}</Text>
                    <View className="flex-row items-center">

                      {paymentData.fromBankInformation.service === "ONEPAY" ?

                        <View className="w-6 h-6 rounded-full  items-center justify-center mr-2">
                          <Image source={bcelone} className="w-6 h-6 rounded-full  items-center justify-center mr-2" />
                        </View>

                        :
                        <View className="w-6 h-6 rounded-full  items-center justify-center mr-2">
                          <Image source={pal} className="w-6 h-6 rounded-full items-center justify-center mr-2" />

                        </View>
                      }
                      <Text className="text-text font-semibold">{data.bankName}</Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between py-2">
                    <Text className="text-gray-600">{t('payment_success.transaction_time')}</Text>
                    <Text className="text-gray-800 font-semibold">
                      {paymentData.fromBankInformation.txtime}
                    </Text>
                  </View>


                </View>

                {/* ACEER Logo and QR Section */}
                {/* <View className="items-center border-t border-dashed border-gray-300 pt-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <View className="w-12 h-12 bg-border rounded-lg mr-3 items-center justify-center">
                      <Ionicons name="qr-code-outline" size={32} color="#666" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-gray-800 mb-1">
                        POWERED BY AOSER
                      </Text>
                      <Text className="text-xs text-gray-500">
                        ສາມາດກວດສອບສະຖານະການຈ່າຍເງີນໂດຍສະແກນ ຄີວອາໂຄດ
                      </Text>
                    </View>
                  </View>


                </View> */}
              </View>

              {/* Bottom Decorative Wave/Zigzag Pattern */}
              <View className="relative overflow-hidden bg-primary" >
                <View
                  className="flex-row"
                  style={{
                    height: 24,
                    // backgroundColor: 'white',
                  }}
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
          <View className="px-16 py-4 flex-row gap-3">
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