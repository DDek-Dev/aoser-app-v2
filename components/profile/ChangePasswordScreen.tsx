import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header_back from 'components/ui/Header_back';
import PasswordInput from 'components/ui/PasswordInput';
import { useAuth } from 'hooks/useAuth';
import { ResetPasswordFormData } from 'types/auth';
import { Ionicons } from '@expo/vector-icons';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { useMyProfile } from 'hooks/useFreelancer';

type ChangePasswordStep = 'email' | 'otp' | 'password';

type ChangePasswordFormData = {
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

const ChangePasswordScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    forgotPWOTP,
    resetPassword,
    forgotPwIsLoading,
    resetPasswordLoading,
    resetPasswordError,
  } = useAuth();
  const { data, isLoading } = useMyProfile();
  const [step, setStep] = useState<ChangePasswordStep>('email');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<any>(null);
  const otpInputRef = useRef<RNTextInput>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<ChangePasswordFormData>({
    mode: 'onChange',
    defaultValues: {
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');
  const otp = watch('otp');

  const userEmail = data?.user?.email || '';

  // Countdown timer
  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 300);
    }
  }, [step]);

  // Request OTP
  const handleRequestOtp = () => {
    if (!userEmail) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('common.error'),
        textBody: 'Email not found',
      });
      return;
    }

    forgotPWOTP(userEmail, {
      onSuccess: () => {
        setStep('otp');
        startCountdown();
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: t('common.success'),
          textBody: t('changePassword.otpSent'),
        });
      },
      onError: () => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: t('common.error'),
          textBody: t('changePassword.errors.failedToSendOtp'),
        });
      }
    });
  };

  // Resend OTP
  const handleResendOtp = () => {
    if (countdown > 0 || !userEmail) return;

    forgotPWOTP(userEmail, {
      onSuccess: () => {
        startCountdown();
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: t('common.success'),
          textBody: t('changePassword.otpResent'),
        });
      },
      onError: () => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: t('common.error'),
          textBody: t('changePassword.errors.failedToSendOtp'),
        });
      }
    });
  };

  // Verify OTP
  const handleVerifyOtp = () => {
    if (!otp || otp.length !== 6) {
      setError('otp', {
        type: 'manual',
        message: t('changePassword.errors.otpRequired'),
      });
      return;
    }

    setStep('password');
    clearErrors('otp');
  };

  // Reset Password
  const handleResetPassword = (data: ChangePasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: t('changePassword.errors.passwordsNotMatch'),
      });
      return;
    }

    const resetData: ResetPasswordFormData = {
      email: userEmail,
      newPassword: data.newPassword,
      otp: data.otp,
    };

    resetPassword(resetData, {
      onSuccess: () => {
        Toast.show({
          type: ALERT_TYPE.SUCCESS,
          title: t('common.success'),
          textBody: t('changePassword.success'),
        });
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      },
      onError: () => {
        Toast.show({
          type: ALERT_TYPE.DANGER,
          title: t('common.error'),
          textBody: t('changePassword.errors.resetFailed'),
        });
      }
    });
  };

  // Handle back button
  const handleBack = () => {
    if (step === 'otp') {
      // Alert.alert(
      //   t('changePassword.goBack'),
      //   t('changePassword.goBackMessage'),
      //   [
      //     {
      //       text: t('common.cancel'),
      //       style: 'cancel',
      //     },
      //     {
      //       text: t('common.yes'),
      //       onPress: () => {
      //         setStep('email');
      //         clearErrors('otp');
      //         if (countdownRef.current) {
      //           clearInterval(countdownRef.current);
      //         }
      //         setCountdown(0);
      //       },
      //     },
      //   ]
      // );
      setStep('email');
      clearErrors('otp');
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      setCountdown(0);
    } else if (step === 'password') {
      setStep('otp');
    } else {
      navigation.goBack();
    }
  };

  // OTP Input Handler
  const handleOtpChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '').substring(0, 6);
    setValue('otp', numericText, { shouldValidate: true });
  };

  // Render OTP input boxes
  const renderOtpInput = () => {
    const otpArray = otp ? otp.split('') : Array(6).fill('');

    return (
      <View className="mb-6">
        <Text className="text-textPrimary text-sm font-medium mb-3">
          {t('changePassword.enterOtp')}
        </Text>

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => otpInputRef.current?.focus()}
          className="relative"
        >
          <View className="flex-row justify-between mb-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <View
                key={index}
                className={`
                  w-14 h-14 rounded-full border-2 
                  ${errors.otp ? 'border-error' : 'border-gray-300'}
                  ${otpArray[index] ? 'border-primary bg-primary/5' : 'bg-white'}
                  items-center justify-center
                `}
              >
                <Text className="text-2xl font-bold text-textPrimary">
                  {otpArray[index] || ''}
                </Text>
              </View>
            ))}
          </View>

          <RNTextInput
            ref={otpInputRef}
            value={otp}
            onChangeText={handleOtpChange}
            placeholder=""
            className="absolute w-full h-full opacity-0"
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={step === 'otp'}
            caretHidden={true}
          />
        </TouchableOpacity>

        {errors.otp && (
          <Text className="text-error text-sm mt-2">{errors.otp.message}</Text>
        )}
      </View>
    );
  };

  const goBackToOtp = () => {
    setStep('otp');
  };

  if (isLoading) {
    return (
      <ScreenWrapper safeEdges={['top']}>
        <Header_back
          text={t('changePassword.title')}
          onPress={() => navigation.goBack()}
          iconColor="#3B82F6"
          backgroundColor="bg-surface"
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper safeEdges={['top']}>
      <Header_back
        text={t('changePassword.title')}
        onPress={handleBack}
        iconColor="#3B82F6"
        backgroundColor="bg-surface"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          className="flex-1 bg-surface"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-6">
            {/* Progress Indicator */}
            <View className="flex-row items-center mb-8">
              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${step === 'email' ? 'bg-primary' : 'bg-success'
                  }`}>
                  <Text className="text-white font-bold text-sm">1</Text>
                </View>
                <Text className="text-textSecondary text-xs ml-2">{t('signUpScreen.email')}</Text>
              </View>

              <View className="h-1 flex-1 mx-2 bg-border" />

              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${step === 'otp' ? 'bg-primary' : step === 'password' ? 'bg-success' : 'bg-gray-300'
                  }`}>
                  <Text className="text-white font-bold text-sm">2</Text>
                </View>
                <Text className="text-textSecondary text-xs ml-2">OTP</Text>
              </View>

              <View className="h-1 flex-1 mx-2 bg-border" />

              <View className="flex-row items-center">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${step === 'password' ? 'bg-primary' : 'bg-gray-300'
                  }`}>
                  <Text className="text-white font-bold text-sm">3</Text>
                </View>
                <Text className="text-textSecondary text-xs ml-2">{t('signUpScreen.password')}</Text>
              </View>
            </View>

            {/* Step 1: Email - Show only Send OTP button */}
            {step === 'email' && (
              <View className="bg-white h-[90%] rounded-2xl flex-col justify-between">

                <View className=''>

                  <Text className="text-xl font-bold text-textPrimary mb-2">
                    {t('changePassword.enterEmail')}
                  </Text>
                  <Text className="text-textSecondary mb-6">
                    {t('changePassword.emailInstructions')}
                  </Text>

                </View>

                {/* Display User Email */}
                {/* <View className="mb-6">
                  <Text className="text-sm text-textSecondary mb-2">
                    {t('changePassword.sendingOtpTo')}:
                  </Text>
                  <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <Text className="text-base font-semibold text-textPrimary">
                      {userEmail}
                    </Text>
                  </View>
                </View> */}

                <Pressable
                  onPress={handleRequestOtp}
                  disabled={forgotPwIsLoading}
                  className={`
                    py-4 rounded-full items-center
                    ${forgotPwIsLoading ? 'bg-gray-300' : 'bg-primary'}
                  `}
                >
                  {forgotPwIsLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      {t('changePassword.sendOtp')}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <View className="bg-white rounded-2xl flex-col justify-between  h-[90%]">

                <View className=''>

                  <Text className="text-xl font-bold text-textPrimary mb-2">
                    {t('changePassword.verifyOtp')}
                  </Text>

                  <Text className="text-textSecondary mb-2">
                    {t('changePassword.otpSentTo')}
                  </Text>
                  <Text className="text-textPrimary font-semibold mb-6">
                    {userEmail}
                  </Text>

                  {renderOtpInput()}
                  <View className="flex-row justify-between items-center mt-4">
                    <Text className="text-textSecondary text-sm">
                      {t('changePassword.didntReceiveOtp')}
                    </Text>
                    <TouchableOpacity
                      onPress={handleResendOtp}
                      disabled={countdown > 0 || forgotPwIsLoading}
                    >
                      {forgotPwIsLoading ? (
                        <ActivityIndicator size="small" color="#3B82F6" />
                      ) : countdown > 0 ? (
                        <Text className="text-primary font-medium">
                          {t('changePassword.resendIn')} {countdown}s
                        </Text>
                      ) : (
                        <Text className="text-primary font-medium">
                          {t('changePassword.resendOtp')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>


                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={!otp || otp.length !== 6}
                  className={`
                    mt-8 py-4 rounded-full items-center
                    ${otp && otp.length === 6 ? 'bg-primary' : 'bg-gray-300'}
                  `}
                >
                  <Text className="text-white text-base font-semibold">
                    {t('changePassword.verifyOtpButton')}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Step 3: New Password */}
            {step === 'password' && (
              <View className="bg-white rounded-2xl  flex-col h-[90%] justify-between">

                <View>


                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-xl font-bold text-textPrimary">
                      {t('changePassword.setNewPassword')}
                    </Text>
                    <TouchableOpacity
                      onPress={goBackToOtp}
                      className="flex-row items-center"
                    >
                      <Ionicons name="arrow-back-outline" size={16} color="#3B82F6" />
                      <Text className="text-primary text-sm ml-1">
                        {t('changePassword.editOtp')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text className="text-textSecondary mb-6">
                    {t('changePassword.passwordInstructions')}
                  </Text>

                  <View className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <Text className="text-textSecondary text-sm">
                      {t('changePassword.verifyingOtp')}:
                    </Text>
                    <Text className="text-textPrimary font-semibold">
                      {otp} ••••
                    </Text>
                    <Text className="text-textSecondary text-xs mt-1">
                      {t('changePassword.sentTo')}: {userEmail}
                    </Text>
                  </View>

                  <View className="mb-6">
                    <Text className="text-textPrimary text-sm font-medium mb-2">
                      {t('changePassword.newPassword')}
                    </Text>
                    <PasswordInput
                      control={control}
                      name="newPassword"
                      placeholder={t('changePassword.newPasswordPlaceholder')}
                      rules={{
                        required: t('changePassword.errors.newPasswordRequired'),
                        minLength: {
                          value: 6,
                          message: t('changePassword.errors.passwordMinLength'),
                        },
                      }}
                      showPassword={showNewPassword}
                      onTogglePassword={() => setShowNewPassword(!showNewPassword)}
                      error={errors.newPassword?.message}
                    />
                  </View>

                  <View className="mb-6">
                    <Text className="text-textPrimary text-sm font-medium mb-2">
                      {t('changePassword.confirmPassword')}
                    </Text>
                    <PasswordInput
                      control={control}
                      name="confirmPassword"
                      placeholder={t('changePassword.confirmPasswordPlaceholder')}
                      rules={{
                        required: t('changePassword.errors.confirmPasswordRequired'),
                        validate: (value: string) =>
                          value === newPassword || t('changePassword.errors.passwordsNotMatch'),
                      }}
                      showPassword={showConfirmPassword}
                      onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                      error={errors.confirmPassword?.message}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleSubmit(handleResetPassword)}
                  disabled={!isValid || resetPasswordLoading}
                  className={`
                    mt-4 py-4 rounded-full items-center
                    ${isValid && !resetPasswordLoading ? 'bg-primary' : 'bg-gray-300'}
                  `}
                >
                  {resetPasswordLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white text-base font-semibold">
                      {t('changePassword.updateButton')}
                    </Text>
                  )}
                </Pressable>

                {resetPasswordError && (
                  <View className="mt-4 p-3 bg-red-50 rounded-lg">
                    <TouchableOpacity onPress={goBackToOtp} className="mt-2">
                      <Text className="text-error text-center text-sm">
                        {t('changePassword.wrongOtpTryAgain')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={{ height: insets.bottom }} />
    </ScreenWrapper>
  );
};

export default ChangePasswordScreen;