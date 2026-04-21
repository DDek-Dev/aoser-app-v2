import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FontAwesome, Ionicons } from '@expo/vector-icons';

import { useAuth } from 'hooks/useAuth';
import { FreelancerStackParamList } from 'types/navigation';
import { storeFormData } from 'utils/authStorage';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useTranslation } from 'react-i18next';

// ========================================
// VALIDATION SCHEMA
// ========================================

type FormData = {
  gender: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  rePassword: string;
};

// ========================================
// CONSTANTS
// ========================================

// ========================================
// MAIN COMPONENT
// ========================================
export default function SignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const [showPassword, setShowPassword] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);

  const {
    otpSendLoading,
    googleloading,
    otpSendError,
    signupOTPRequest,
    googleLogin,
  } = useAuth();

  const { t } = useTranslation();

  const schema = yup.object({
    gender: yup.string().required(t('signUpScreen.gender_required')),
    firstName: yup.string().required(t('signUpScreen.firstName_required')),
    lastName: yup.string().required(t('signUpScreen.lastName_required')),
    email: yup
      .string()
      .email(t('signUpScreen.email_invalid'))
      .required(t('signUpScreen.email_required')),
    password: yup
      .string()
      .min(6, t('signUpScreen.password_min'))
      .required(t('signUpScreen.password_required')),
    rePassword: yup
      .string()
      .oneOf([yup.ref('password')], t('signUpScreen.password_match'))
      .required(t('signUpScreen.rePassword_required')),
  }).required();



  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      gender: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      rePassword: '',
    },
  });

  // ========================================
  // HANDLERS
  // ========================================
  const onSubmit = async (data: FormData) => {
    try {
      await storeFormData(data);
      const cleanEmail = data.email.trim().replace(/^"+|"+$/g, '');
      const response = await signupOTPRequest(cleanEmail);

      if (!response.success) {
        throw new Error(response.message || 'Send OTP request failed');
      }

      navigation.navigate('OtpRequest', { email: cleanEmail });
    } catch (err) {
      console.log('Error submitting form:', err);
    }
  };

  const handleGoogleLoginPress = async () => {
    try {
      await googleLogin();
    } catch (err) {
      console.log('❌ Google login failed:', err);
    }
  };

  const handleNavigateToSignIn = () => {
    navigation.replace('SignIn');
  };

  // ========================================
  // COMPUTED VALUES
  // ========================================
  const isLoading = otpSendLoading || googleloading;

  // ========================================
  // RENDER
  // ========================================
  return (
    <ScreenWrapper safeEdges={['top', 'bottom']}>
      <Header_back
        text={t('signUpScreen.sign_up')}
        onPress={() => navigation.goBack()}
        iconColor="#3B82F6"
        backgroundColor="bg-surface"
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={'padding'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={{
            flex: 1,
            backgroundColor: 'white'
          }}
        >
          {/* Scrollable Content */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View className="px-6 py-6">


              {/* Google Login Button */}
              <GoogleLoginButton
                onPress={handleGoogleLoginPress}
                loading={googleloading}
                disabled={isLoading}
              />

              {/* Divider */}
              <Divider />

              {/* Gender Dropdown */}
              <GenderInput
                control={control}
                error={errors.gender}
                modalVisible={genderModalVisible}
                setModalVisible={setGenderModalVisible}
                disabled={isLoading}
              />

              {/* First Name & Last Name */}
              <Text className="text-text mb-2 font-bold text-body">{t('signUpScreen.fullname')}</Text>
              <FirstNameInput
                control={control}
                error={errors.firstName}
                disabled={isLoading}
              />
              <LastNameInput
                control={control}
                error={errors.lastName}
                disabled={isLoading}
              />

              {/* Email Input */}
              <Text className="text-text mb-2 font-bold text-body">{t('signUpScreen.email')}</Text>
              <EmailInput
                control={control}
                error={errors.email}
                disabled={isLoading}
              />

              {/* Password Input */}
              <Text className="text-text mb-2 font-bold text-body">{t('signUpScreen.password')}</Text>
              <PasswordInput
                control={control}
                error={errors.password}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              />

              {/* Confirm Password Input */}
              <ConfirmPasswordInput
                control={control}
                error={errors.rePassword}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              />

              {/* Error Message */}
              {otpSendError && <ErrorMessage />}

              {/* Sign In Link */}
              <SignInLink
                onPress={handleNavigateToSignIn}
                disabled={isLoading}
              />
            </View>
          </ScrollView>

          {/* Fixed Submit Button - Outside ScrollView */}
          <View className="px-6 pb-6">
            <SubmitButton
              onPress={handleSubmit(onSubmit)}
              loading={otpSendLoading}
              disabled={isLoading}
            />
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
}

// ========================================
// SUB-COMPONENTS
// ========================================

// Google Login Button Component
type GoogleLoginButtonProps = {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
};

function GoogleLoginButton({ onPress, loading, disabled }: GoogleLoginButtonProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row justify-center items-center border border-border py-6 rounded-2xl bg-background mb-4"
    >
      {loading ? (
        <ActivityIndicator color="#DB4437" />
      ) : (
        <>
          <Ionicons
            name="logo-google"
            size={18}
            color="#DB4437"
            style={{ marginRight: 10 }}
          />
          <Text className="text-gray-700 font-medium">{t('loginScreen.login_with_google')}</Text>
        </>
      )}
    </Pressable>
  );
}

// Divider Component
function Divider() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center mb-4">
      <View className="flex-1 h-px bg-gray-200" />
      <Text className="mx-2 text-gray-400 text-caption">{t('signUpScreen.or')}</Text>
      <View className="flex-1 h-px bg-gray-200" />
    </View>
  );
}

// Gender Input Component
type GenderInputProps = {
  control: any;
  error?: any;
  modalVisible: boolean;
  setModalVisible: (visible: boolean) => void;
  disabled: boolean;
};
function GenderInput({
  control,
  error,
  modalVisible,
  setModalVisible,
  disabled,
}: GenderInputProps) {
  const { t } = useTranslation();

  const GENDER_OPTIONS = [
    { label: `${t('signUpScreen.male')}`, value: 'MALE' },
    { label: `${t('signUpScreen.female')}`, value: 'FEMALE' },
  ];

  return (
    <Controller
      control={control}
      name="gender"
      render={({ field: { onChange, value } }) => {
        const displayValue =
          GENDER_OPTIONS.find((opt) => opt.value === value)?.label || t('signUpScreen.selectGender');

        return (
          <View>
            <Text className="text-text mb-2 font-bold text-body">{t('signUpScreen.gender')}</Text>

            {/* Fixed: Made the Pressable fill the entire container */}
            <Pressable
              onPress={() => !disabled && setModalVisible(true)}
              disabled={disabled}
              className={`flex-row items-center justify-between px-4 py-4 rounded-2xl mb-2 ${error ? 'border border-error' : 'border border-border'
                }`}
            >
              <Text className={`text-body ${value ? 'text-text' : 'text-gray-400'}`}>
                {displayValue}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </Pressable>

            {error && (
              <Text className="text-error text-caption mb-3">{error.message}</Text>
            )}

            {/* Gender Selection Modal */}
            <Modal
              visible={modalVisible}
              transparent
              animationType="fade"
              onRequestClose={() => setModalVisible(false)}
            >
              <TouchableOpacity
                className="flex-1 justify-center items-center bg-black/40 px-8"
                activeOpacity={1}
                onPressOut={() => setModalVisible(false)}
              >
                <TouchableWithoutFeedback>
                  <View className="bg-surface w-full rounded-2xl p-4">
                    <Text className="text-center text-body font-bold mb-4 text-text">
                      {t('signUpScreen.selectGender')}
                    </Text>
                    {GENDER_OPTIONS.map((option, index) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => {
                          onChange(option.value);
                          setModalVisible(false);
                        }}
                        className={`py-4 ${index !== GENDER_OPTIONS.length - 1 ? 'border-b border-border' : ''
                          }`}
                      >
                        <View className="flex-row items-center justify-between">
                          <Text className="text-body text-text">{option.label}</Text>
                          {value === option.value && (
                            <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableWithoutFeedback>
              </TouchableOpacity>
            </Modal>
          </View>
        );
      }}
    />
  );
}
// First Name Input Component
type FirstNameInputProps = {
  control: any;
  error?: any;
  disabled: boolean;
};

function FirstNameInput({ control, error, disabled }: FirstNameInputProps) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name="firstName"
      render={({ field: { onChange, value } }) => (
        <View>
          <View
            className={`flex-row items-center px-4  rounded-2xl mb-2 ${error ? 'border border-error' : 'border border-border'
              }`}
            style={{ minHeight: 52 }}
          >
            <TextInput
              placeholder={t('signUpScreen.firstName')}
              className="flex-1 text-text"
              onChangeText={onChange}
              value={value}
              placeholderTextColor="#999"
              editable={!disabled}
            />
          </View>
          {error && (
            <Text className="text-error text-caption mb-3">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}

// Last Name Input Component
type LastNameInputProps = {
  control: any;
  error?: any;
  disabled: boolean;
};

function LastNameInput({ control, error, disabled }: LastNameInputProps) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name="lastName"
      render={({ field: { onChange, value } }) => (
        <View>

          <View
            className={`flex-row items-center px-4  rounded-2xl mb-2 ${error ? 'border border-error' : 'border border-border'
              }`}
            style={{ minHeight: 52 }}
          >
            <TextInput
              placeholder={t('signUpScreen.lastName')}
              className="flex-1 text-text"
              onChangeText={onChange}
              value={value}
              placeholderTextColor="#999"
              editable={!disabled}
            />
          </View>
          {error && (
            <Text className="text-error text-caption mb-3">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}

// Email Input Component
type EmailInputProps = {
  control: any;
  error?: any;
  disabled: boolean;
};

function EmailInput({ control, error, disabled }: EmailInputProps) {
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name="email"
      render={({ field: { onChange, value } }) => (
        <View>

          <View
            className={`flex-row items-center px-4   rounded-2xl mb-2 ${error ? 'border border-error' : 'border border-border'
              }`}
            style={{ minHeight: 52 }}
          >
            <TextInput
              placeholder={t('signUpScreen.email_holder')}
              keyboardType="email-address"
              autoCapitalize="none"
              className='flex-1 text-text'
              onChangeText={onChange}
              value={value}
              placeholderTextColor="#999"
              editable={!disabled}
            />
          </View>
          {error && (
            <Text className="text-error text-caption mb-3">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}

// Password Input Component
type PasswordInputProps = {
  control: any;
  error?: any;
  showPassword: boolean;
  onTogglePassword: () => void;
  disabled: boolean;
};

function PasswordInput({
  control,
  error,
  showPassword,
  onTogglePassword,
  disabled,
}: PasswordInputProps) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name="password"
      render={({ field: { onChange, value } }) => (
        <View>
          <View
            className={`flex-row items-center px-4  rounded-2xl mb-2 ${error ? 'border border-error' : 'border border-border'
              }`}
            style={{ minHeight: 52 }}
          >
            <TextInput
              placeholder={t('signUpScreen.password')}
              className="flex-1 text-text"
              secureTextEntry={!showPassword}
              onChangeText={onChange}
              value={value}
              placeholderTextColor="#999"
              editable={!disabled}
            />
            <TouchableOpacity
              className="absolute right-4"
              onPress={onTogglePassword}
              disabled={disabled}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {error && (
            <Text className="text-error text-caption mb-3">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}

// Confirm Password Input Component
type ConfirmPasswordInputProps = {
  control: any;
  error?: any;
  showPassword: boolean;
  onTogglePassword: () => void;
  disabled: boolean;
};

function ConfirmPasswordInput({
  control,
  error,
  showPassword,
  onTogglePassword,
  disabled,
}: ConfirmPasswordInputProps) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name="rePassword"
      render={({ field: { onChange, value } }) => (
        <View>
          <View
            className={`flex-row items-center px-4 rounded-2xl mb-2 ${error ? 'border border-error' : 'border border-border'
              }`}
            style={{ minHeight: 52 }}
          >
            <TextInput
              placeholder={t('signUpScreen.confirm_password')}
              className="flex-1 text-text"
              secureTextEntry={!showPassword}
              onChangeText={onChange}
              value={value}
              placeholderTextColor="#999"
              editable={!disabled}
            />
            <TouchableOpacity
              className="absolute right-4"
              onPress={onTogglePassword}
              disabled={disabled}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          </View>
          {error && (
            <Text className="text-error text-caption mb-4">{error.message}</Text>
          )}
        </View>
      )}
    />
  );
}

// Error Message Component
function ErrorMessage() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center px-4 py-4 rounded-2xl mb-2 bg-background">
      <FontAwesome
        name="exclamation-circle"
        size={16}
        color="#ef4444"
        style={{ marginRight: 8 }}
      />
      <Text className="text-error text-body flex-1">
        {t('loginScreen.email_exist')}
      </Text>
    </View>
  );
}

// Sign In Link Component
type SignInLinkProps = {
  onPress: () => void;
  disabled: boolean;
};

function SignInLink({ onPress, disabled }: SignInLinkProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row justify-center items-center mt-4">
      <Text className="text-gray-500">{t('signUpScreen.haveAccount')} </Text>
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <Text className="text-blue-600 font-semibold">{t('signUpScreen.signIn')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Submit Button Component
type SubmitButtonProps = {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
};

function SubmitButton({ onPress, loading, disabled }: SubmitButtonProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      className={`py-4 rounded-2xl items-center justify-center ${disabled ? 'bg-gray-400' : 'bg-blue-600'
        }`}
      disabled={disabled}
    >
      {loading ? (
        <View className="flex-row items-center">
          <ActivityIndicator color="white" size="small" />
          <Text className="text-surface font-semibold ml-2">
            {t('signUpScreen.sending_OTP')}
          </Text>
        </View>
      ) : (
        <Text className="text-surface font-semibold text-center">
          {t('signUpScreen.send_otp_request')}

        </Text>
      )}
    </Pressable>
  );
}