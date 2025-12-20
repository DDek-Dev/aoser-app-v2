import  { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAuth } from 'hooks/useAuth';
import { clearFormData, getFormData } from 'utils/authStorage';
import Header_back from 'components/ui/Header_back';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';

export default function OtpRequestScreen({ navigation }: any) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { email } = route.params as { email: string };

  const schema = yup.object({
    otp: yup
      .string()
      .length(6, t('otpScreen.otp_length'))
      .required(t('otpScreen.otp_required')),
  });

  const [formData, setFormData] = useState<any>(null);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const { otpVerifyLoading, signupWithOTP } = useAuth();

  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      otp: '',
    },
  });

  const otpRefs = Array.from({ length: 6 }, () => useRef<TextInput>(null));
  const otpValues = useRef(Array(6).fill(''));

  // Countdown
 useEffect(() => {
  startCountdown();

  return () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  };
}, []);

  useEffect(() => {
    const loadFormData = async () => {
      const savedData = await getFormData();
      if (savedData) setFormData(savedData);
    };
    loadFormData();
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    countdownRef.current && clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          countdownRef.current && clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // OTP input logic
  const handleOtpChange = (text: string, index: number) => {
    if (/^\d$/.test(text)) {
      otpValues.current[index] = text;
      setValue('otp', otpValues.current.join(''));

      if (index < 5) otpRefs[index + 1].current?.focus();
    } else if (text === '') {
      otpValues.current[index] = '';
      setValue('otp', otpValues.current.join(''));
      if (index > 0) otpRefs[index - 1].current?.focus();
    }
  };

  // Submit
  const onSubmit = async (data: { otp: string }) => {
    if (!formData) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: `${t('otpScreen.error_title')}`,
        textBody: `${t('otpScreen.form_data_not_found')}`,
      });

      return;
    }

    try {
      await signupWithOTP({ ...formData, otp: data.otp });
      await clearFormData();

      // navigation.replace('ProfileSetup');
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: `${t('otpScreen.success_title')}`,
        textBody: `${t('otpScreen.registration_successful')}`,
      });
      // navigation.popToTop();
      navigation.navigate('ProfileSetup');

    } catch (error) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: `${t('otpScreen.error_title')}`,
        textBody:`${t('otpScreen.registration_failed')}`,
      });

      // Alert.alert(
      //   t('otpScreen.error_title'),
      //   error instanceof Error ? error.message : t('otpScreen.registration_failed')
      // );
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;

    try {
      setIsResending(true);
      startCountdown();
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: `${t('otpScreen.success_title')}`,
        textBody: `${t('otpScreen.otp_resent')}`,
      });
    } catch (error) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: `${t('otpScreen.error_title')}`,
        textBody: error instanceof Error ? error.message : t('otpScreen.resend_failed'),
      });
      
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>

      <Header_back
        onPress={() => navigation.goBack()}
        iconColor="#3B82F6"
        iconName="chevron-left"
        text={t('forgotPassword.otp_request')}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View className="flex-1">
            {/* Scrollable Form Content */}
            <ScrollView
              className="flex-1 px-6 py-8"
              contentContainerStyle={{ paddingBottom: 140 }}
              keyboardShouldPersistTaps="handled"
            >
              <Text className="text-gray-500 mb-1">{t('otpScreen.otp_sent_to')}</Text>
              <Text className="text-gray-900 mb-6 font-semibold">{email}</Text>

              {/* OTP Input */}
              <Controller
                control={control}
                name="otp"
                render={() => (
                  <View className="flex-row justify-between mb-4">
                    {otpRefs.map((ref, i) => (
                      <TextInput
                        key={i}
                        ref={ref}
                        maxLength={1}
                        keyboardType="numeric"
                        className={`text-lg text-center w-12 h-12 rounded-full border ${
                          errors.otp ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={otpValues.current[i]}
                        onChangeText={(text) => handleOtpChange(text, i)}
                      />
                    ))}
                  </View>
                )}
              />

              {errors.otp && (
                <Text className="text-red-500 text-sm mt-2">{errors.otp.message}</Text>
              )}

              {/* Resend */}
              <View className="flex-row justify-end mt-2 mb-6">
                <Text className="text-gray-400">{t('otpScreen.didnt_receive')} </Text>

                <TouchableOpacity
                  onPress={handleResendOTP}
                  disabled={countdown > 0 || isResending}
                >
                  {isResending ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : countdown > 0 ? (
                    <Text className="text-textSecondary font-medium">
                      {t('otpScreen.resend_in')} {countdown}s
                    </Text>
                  ) : (
                    <Text className="text-blue-600 font-medium">
                      {t('otpScreen.send_again')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Fixed Bottom Button */}
            <View
              style={{
                paddingBottom: insets.bottom + 12,
                paddingHorizontal: 24,
                backgroundColor: 'white',
              }}
            >
              <Pressable
                onPress={handleSubmit(onSubmit)}
                className="bg-primary py-4 rounded-2xl"
                disabled={otpVerifyLoading}
              >
                {otpVerifyLoading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white font-semibold ml-2">
                      {t('otpScreen.verifying')}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-center">
                    {t('otpScreen.verify')}
                  </Text>
                )}
              </Pressable>
            </View>

          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
