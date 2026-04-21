// First, install the required dependencies:
// npx expo install react-native-svg react-native-qrcode-svg react-native-view-shot

// PaymentScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useGenerateOnepayQRcode } from 'hooks/usePayment';
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  ActivityIndicator,

} from 'react-native';
import { Payment, PaymentResponse } from 'types/payment';
import PaymentSuccessPopup from './PaymentSuccessPopup';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useNavigation } from '@react-navigation/native';
import Header_back from 'components/ui/Header_back';
import QRCode from 'react-native-qrcode-svg';
import SocketService from 'service/soctketService';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { useAuth } from 'hooks/useAuth';
import { aoserlogo_no_bg_blue, lao_qr } from 'assets';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { useTranslation } from 'react-i18next';

interface PaymentSuccessPopupProps {
  visible: boolean;
  onClose: () => void;
  paymentData: any;
}

type Props = {
  workId: string;
  budget: number;
  currency: string;
  terminalid: string;
  invoiceType: string;
  workCode?: string;
}

const PaymentScreen = ({ route }: any) => {
  const { workId, budget, currency, terminalid, invoiceType, workCode }: Props = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState('BCEL');
  const [isLoading, setIsLoading] = useState(false);
  const [qrString, setQrString] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { mutateAsync, isSuccess, data } = useGenerateOnepayQRcode();
  const { tokens, user } = useAuth();
  const qrRef = useRef<ViewShot>(null);
  const { t } = useTranslation();
  const language = "en"
  let desc = "";
  if (language == "en") {
    desc = `${terminalid} `
  } else {
    desc = "ສໍາລັບວຽກ"
  }
  const SERVER_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Generate QR code on component mount
  useEffect(() => {
    const generateQR = async () => {
      const formData = {
        amount: budget,
        currency: currency,
        invoiceType: invoiceType,
        terminalid: terminalid,
        paymentFor: workId,
        desc: desc,

      } as Payment;

      console.log('Generating QR with data:', formData);

      try {
        setIsLoading(true);
        const result = await mutateAsync({ data: formData });
        

        if (result && typeof result === 'object') {
          const paymentResponse = result as PaymentResponse;
          const qrcValue = paymentResponse.data?.qrc || result;
          const invoiceIdValue = paymentResponse.invoiceId || null;

          setQrString(qrcValue);
          setInvoiceId(invoiceIdValue);
          // setPaymentResult(paymentResponse);
        } else {
          setQrString(result);
        }

        setIsLoading(false);
      } catch (error) {
        console.log("QR generation error:", error);
        setIsLoading(false);
      }
    };

    generateQR();
  }, [workId, terminalid, currency, mutateAsync]);

  const paymentMethods = [
    {
      id: 'BCEL',
      name: 'BCEL One',
      logo: require('../../assets/bcelone.jpg'),
      type: 'bank'
    },
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPayment(methodId);

    if (!invoiceId || !tokens || !user) return;
    SocketService.connect(SERVER_URL, tokens.accessToken, user._id)
    const handlePaymentCallback = (payload: any) => {
      console.log('[PaymentScreen] received payment callback', payload);
      setIsPaymentProcessing(false);
      setPaymentResult(payload);
      setShowSuccessPopup(true);
    };

    SocketService.onPaymentCallback(invoiceId, handlePaymentCallback);

    return () => {
      SocketService.removePaymentCallback(invoiceId);
    };
  };

  const handleDownloadQR = async () => {
    try {
      setIsDownloading(true);

      // Request permissions
      // const { status } = await MediaLibrary.requestPermissionsAsync();
      // if (status !== 'granted') {
      //   Alert.alert('Permission Required', 'Please grant permission to save images');
      //   setIsDownloading(false);
      //   return;
      // }

      // Capture the QR code view

      if (qrRef.current && qrRef.current.capture) {
        const uri = await qrRef.current.capture();

        if (!uri) {
          throw new Error('Failed to capture QR code');
        }

        // Save to device
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('Aceer Payments', asset, false);

        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: 'Success',
          textBody: 'QR code saved to gallery!',
        });
      } else {
        throw new Error('QR code not ready');
      }

      setIsDownloading(false);
    } catch (error) {
      console.log('Download error:', error);
      // Alert.alert('Error', 'Failed to save QR code. Please try again.');
      setIsDownloading(false);
    }
  };


  // Add a refresh handler function (place this before the return statement)
const handleRefreshQR = async () => {
  const formData = {
    amount: budget,
    currency: currency,
    invoiceType: invoiceType,
    terminalid: terminalid,
    paymentFor: workId,
    desc: desc,
  } as Payment;

  try {
    setIsLoading(true);
    const result = await mutateAsync({ data: formData });

    if (result && typeof result === 'object') {
      const paymentResponse = result as PaymentResponse;
      const qrcValue = paymentResponse.data?.qrc || result;
      const invoiceIdValue = paymentResponse.invoiceId || null;
      setQrString(qrcValue);
      setInvoiceId(invoiceIdValue);
    } else {
      setQrString(result);
    }

    setIsLoading(false);
  } catch (error) {
    console.log("QR generation error:", error);
    setIsLoading(false);
  }
};
  const handlePopupClose = () => {
    setShowSuccessPopup(false);
    navigation.popTo('FreelancerWorkDetail', { workId: workId });
  };

  const currentQrString = qrString;
  // console.log('Current QR String:', currentQrString);

  // Listen for payment callback when we have an invoiceId
  useEffect(() => {
    if (!invoiceId || !tokens || !user) return;
    SocketService.connect(SERVER_URL, tokens.accessToken, user._id)
    const handlePaymentCallback = (payment: any) => {
      console.log('[PaymentScreen] received payment callback', payment);
      setIsPaymentProcessing(false);
      setPaymentResult(payment);
      setShowSuccessPopup(true);
    };

    SocketService.onPaymentCallback(invoiceId, handlePaymentCallback);

    return () => {
      SocketService.removePaymentCallback(invoiceId);
    };
  }, [invoiceId]);



  return (
    <ScreenWrapper safeEdges={['top', 'bottom']}>
      <Header_back text={t('payment.title')} iconColor='#3B82F6' onPress={() => navigation.goBack()} />
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* QR Code Section with Enhanced Design */}
        <View className="items-center">


          {/* QR Code Card with Gradient Background */}
          <ViewShot
            ref={qrRef}
            options={{ format: 'png', quality: 1.0 }}

          >


            <View className="p-8">

              <View className='bg-white/95 rounded-3xl px-8 pb-4 shadow-lg border-2 border-blue-100 '>


                {/* Brand Header */}
                <View className="flex-row items-center mb-4">
                  <Image
                    source={aoserlogo_no_bg_blue}
                    className="w-24 h-24 mb-2"
                    resizeMode="contain"
                  />

                  {invoiceType === "WORK" && (

                    <Text className="text-lg font-bold text-gray-800">{t('payment.paymentForWork')}</Text>
                  )}
                  {invoiceType === "APPEND_WORK" && (

                    <Text className="text-lg font-bold text-gray-800">{t('payment.paymentForAppendWork')}</Text>
                  )}
                  {invoiceType === "USER_RECOMMEND_STAR" && (

                    <Text className="text-lg font-bold text-gray-800">{t('payment.paymentForStar')}</Text>
                  )}

                </View>

                {/* QR Code Container with Decorative Border */}
                {/* QR Code Container with Decorative Border */}
<View className="bg-white rounded-2xl p-6 border-2 border-primary shadow-inner items-center justify-center mb-4">
  {isLoading ? (
    <View className="w-48 h-48 items-center justify-center">
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  ) : !currentQrString ? (
    // ✅ Show refresh button when QR string is null/undefined
    <View className="w-48 h-48 items-center justify-center gap-3">
      <Ionicons name="wifi-outline" size={48} color="#9CA3AF" />
      <Text className="text-gray-500 text-sm text-center">
        {t('payment.qrLoadFailed')}
      </Text>
      <TouchableOpacity
        onPress={handleRefreshQR}
        className="flex-row items-center bg-blue-600 px-4 py-2 rounded-xl"
      >
        <Ionicons name="refresh-outline" size={18} color="#ffffff" />
        <Text className="text-white font-semibold text-sm ml-1">
          {t('works.error.refresh')}
        </Text>
      </TouchableOpacity>
    </View>
  ) : (
    <QRCode
      value={currentQrString}
      size={192}
      color="#1F2937"
      backgroundColor="#ffffff"
      logo={lao_qr}
      logoMargin={2}
      ecl="M"
      enableLinearGradient={false}
      quietZone={4}
    />
  )}
</View>

                {/* Amount Display */}
                <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 items-center">
                  <Text className="text-sm text-gray-600 mb-1">{t('payment.amountToPay')}</Text>
                  <View className="flex-row items-baseline">
                    <Text className="text-3xl font-bold text-blue-600">
                      {new Intl.NumberFormat().format(budget)}
                    </Text>
                    <Text className="text-xl font-semibold text-amber-500 ml-2">
                      {currency}
                    </Text>
                  </View>
                </View>

                {/* Invoice ID */}
                <View className="mt-4 pt-4 border-t border-gray-200">
                  {invoiceId && (
                    <Text className="text-xs mb-2 text-gray-500 text-center">
                      Invoice ID: {invoiceId}
                    </Text>
                  )}
                  {workCode && (
                    <Text className="text-xs mb-2 text-gray-500 text-center">
                      Work Code: {workCode}
                    </Text>
                  )}

                </View>
              </View>
            </View>

          </ViewShot>

          {/* Download Button */}
          <TouchableOpacity
            onPress={handleDownloadQR}
            disabled={isLoading || isDownloading}
            className={`flex-row items-center px-8 py-4 rounded-2xl shadow-lg ${isLoading || isDownloading ? 'bg-gray-400' : 'bg-blue-600'
              }`}
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            {isDownloading ? (
              <>
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white font-semibold text-base ml-2">
                  {t('payment.saving')}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="download-outline" size={24} color="#ffffff" />
                <Text className="text-white font-semibold text-base ml-2">
                  {t('payment.downloadQR')}
                </Text>
              </>
            )}
          </TouchableOpacity>
          <Text className="text-xs text-gray-500 mt-3 text-center">
            {t('payment.saveQRHint')}
          </Text>
        </View>

        {/* Info Banner */}
        <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 mb-6 border-l-4 border-blue-500">
          <View className="flex-row items-start">
            <View className="bg-blue-100 rounded-full p-2">
              <Ionicons name="information-circle" size={24} color="#3B82F6" />
            </View>
            {invoiceType === "APPEND_WORK" || invoiceType === "WORK" && (
              <View className="flex-1 ml-4">
                <Text className="text-base text-blue-900 font-semibold mb-2">
                  {t('payment.unlockPotential')}
                </Text>
                <Text className="text-sm text-gray-700 leading-5">
                  {t('payment.upgradeFee')}
                </Text>
              </View>
            )}
            {invoiceType === "USER_RECOMMEND_STAR" && (

              //USER_RECOMMEND_STAR
              <View className="flex-1 ml-4">
                <Text className="text-base text-blue-900 font-semibold mb-2">
                  {t('payment.unlockPotential_star')}
                </Text>
                <Text className="text-sm text-gray-700 leading-5">
                  {t('payment.upgradeFee_star')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Payment Instructions */}
        <View className="bg-white rounded-2xl p-5 mb-6 shadow-sm border border-gray-200">
          <Text className="text-lg font-semibold text-gray-800 mb-4">
            {t('payment.howToPay')}
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-start">
              <View className="bg-blue-100 rounded-full w-8 h-8 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">1</Text>
              </View>
              <Text className="flex-1 text-gray-700 mt-1">
                {t('payment.step1')}
              </Text>
            </View>

            <View className="flex-row items-start">
              <View className="bg-blue-100 rounded-full w-8 h-8 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">2</Text>
              </View>
              <Text className="flex-1 text-gray-700 mt-1">
                {t('payment.step2')}
              </Text>
            </View>

            <View className="flex-row items-start">
              <View className="bg-blue-100 rounded-full w-8 h-8 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">3</Text>
              </View>
              <Text className="flex-1 text-gray-700 mt-1">
                {t('payment.step3')}
              </Text>
            </View>

            <View className="flex-row items-start">
              <View className="bg-blue-100 rounded-full w-8 h-8 items-center justify-center mr-3">
                <Text className="text-blue-600 font-bold">4</Text>
              </View>
              <Text className="flex-1 text-gray-700 mt-1">
                {t('payment.step4')}
              </Text>
            </View>
          </View>
        </View>

        {/* Security Badge */}
        <View className="items-center mb-8">
          <View className="flex-row items-center bg-green-50 px-4 py-2 rounded-full border border-green-200">
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text className="text-green-700 font-medium ml-2">
              {t('payment.securePayment')}
            </Text>
          </View>
        </View>



        {/* Success Popup */}
        <PaymentSuccessPopup
          visible={showSuccessPopup}

          onClose={() => handlePopupClose()}
          paymentData={paymentResult}
        />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default PaymentScreen;