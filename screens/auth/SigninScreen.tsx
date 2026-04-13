import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { useAuth } from 'hooks/useAuth';
import { FreelancerStackParamList } from 'types/navigation';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useTranslation } from 'react-i18next';

// ========================================
// VALIDATION SCHEMA
// ========================================

type FormData = {
  email: string;
  password: string;
};

// ========================================
// MAIN COMPONENT
// ========================================
export default function SigninScreen({ navigation }: any) {
  const navigations = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useTranslation();

  const {
    login,
    loginLoading,
    loginError,
    googleLogin,
    googleloading,
  } = useAuth();


  const schema = yup.object({
    email: yup
      .string()
      .email(t('signUpScreen.email_invalid'))
      .required(t('signUpScreen.email_required')),
    password: yup
      .string()
      .min(4, t('signUpScreen.password_min'))
      .required(t('signUpScreen.password_required')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });


  // ========================================
  // HANDLERS
  // ========================================
  const onSubmit = async (data: FormData) => {
    try {
      const res = await login(data);
      if (res.success) {
        console.log('✅ Login successful');
        navigation.goBack();
      } else {
        console.log('❌ Login failed');
      }

    } catch (err) {
      console.log('Login failed:', err);
    }
  };

  const handleGoogleLoginPress = async () => {
    try {
      await googleLogin();


    } catch (err) {
      console.log('❌ Google login failed:', err);
    }
  };

  const handleForgotPassword = () => {
    navigations.navigate('ForgotPassword');
  };

  const handleNavigateToSignUp = () => {
    navigations.replace('SignUp');
  };

  // ========================================
  // EFFECTS
  // ========================================
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
      // Handle deep link logic here
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // ========================================
  // COMPUTED VALUES
  // ========================================
  const isLoading = loginLoading || googleloading;

  // ========================================
  // RENDER
  // ========================================
  return (
    <ScreenWrapper safeEdges={['bottom', 'top']}>
      <Header_back
        text={t('loginScreen.login')}
        onPress={() => navigations.goBack()}
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
              {/* Email Input */}
              <EmailInput
                control={control}
                error={errors.email}
                disabled={isLoading}
              />

              {/* Password Input */}
              <PasswordInput
                control={control}
                error={errors.password}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              />

              {/* Divider */}
              <Divider />

              {/* Google Login Button */}
              <GoogleLoginButton
                onPress={handleGoogleLoginPress}
                loading={googleloading}
                disabled={isLoading}
              />

              {/* Error Message */}
              {loginError && <ErrorMessage />}

              {/* Forgot Password Link */}
              <ForgotPasswordLink
                onPress={handleForgotPassword}
              />

              {/* Sign Up Link */}
              <SignUpLink
                onPress={handleNavigateToSignUp}
                disabled={isLoading}
              />
            </View>
          </ScrollView>

          {/* Fixed Login Button - Outside ScrollView */}
          <View className="px-6 pb-6">
            <LoginButton
              onPress={handleSubmit(onSubmit)}
              loading={loginLoading}
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

// Email Input Component
type EmailInputProps = {
  control: any;
  error?: any;
  disabled: boolean;
};

function EmailInput({ control, error, disabled }: EmailInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <Controller
      control={control}
      name="email"
      render={({ field: { onChange, value } }) => (
        <View>
          <View
            className={`flex-row items-center px-4 rounded-2xl mb-2 mt-4 ${error
              ? 'border border-red-500'
              : isFocused
                ? 'border border-primary'
                : 'border border-gray-300'
              }`}
            style={{ height: 52, minHeight: 52 }}
          >
            <FontAwesome
              name="envelope"
              size={16}
              color="#999"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder="Aoser@example.com"
              style={{ flex: 1, fontSize: 16, paddingVertical: 0, includeFontPadding: false }}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={onChange}
              value={value}
              placeholderTextColor="#999"
              editable={!disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>
          {error && (
            <Text className="text-error text-sm mb-3">{error.message}</Text>
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
  const [isFocused, setIsFocused] = useState(false);
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name="password"
      render={({ field: { onChange, value } }) => (
        <View>
          <View
            className={`flex-row items-center px-4  rounded-2xl mb-2 ${error
              ? 'border border-error'
              : isFocused
                ? 'border border-primary'
                : 'border border-border'
              }`}
            style={{ height: 52, minHeight: 52 }}
          >
            <FontAwesome
              name="lock"
              size={18}
              color="#999"
              style={{ marginRight: 8 }}
            />
            <TextInput
              placeholder={t('loginScreen.password')}
              style={{ flex: 1, fontSize: 16, paddingVertical: 0, includeFontPadding: false }}
              secureTextEntry={!showPassword}
              onChangeText={onChange}
              value={value}
             
              placeholderTextColor="#999"


              editable={!disabled}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className='text-text'
            />
            <TouchableOpacity
              style={{
                position: 'absolute',
                right: 16, top: 0, bottom: 0,
                justifyContent: 'center'
              }}
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

// Divider Component
function Divider() {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-center my-4">
      <View className="flex-1 h-px bg-border" />
      <Text className="mx-4 text-textSecondary">{t('loginScreen.or')}</Text>
      <View className="flex-1 h-px bg-border" />
    </View>
  );
}

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
          <FontAwesome
            name="google"
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
        {t('loginScreen.email_password_error')}
      </Text>
    </View>
  );
}

// Forgot Password Link Component
type ForgotPasswordLinkProps = {
  onPress: () => void;
};

function ForgotPasswordLink({ onPress }: ForgotPasswordLinkProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row justify-end">
      <TouchableOpacity onPress={onPress}>
        <Text className="text-primary font-medium">{t('loginScreen.forgot_password')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Sign Up Link Component
type SignUpLinkProps = {
  onPress: () => void;
  disabled: boolean;
};

function SignUpLink({ onPress, disabled }: SignUpLinkProps) {
  const { t } = useTranslation();
  return (
    <View className="flex-row justify-center items-center mt-6">
      <Text className="text-gray-500">{t('loginScreen.noaccount')} </Text>
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <Text className="text-primary font-semibold">{t('loginScreen.signup')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Login Button Component
type LoginButtonProps = {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
};

function LoginButton({ onPress, loading, disabled }: LoginButtonProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      className={`py-4 rounded-2xl items-center justify-center ${disabled ? 'bg-gray-400' : 'bg-primary'
        }`}
      disabled={disabled}
    >
      {loading ? (
        <View className="flex-row items-center">
          <ActivityIndicator color="white" size="small" />
          <Text className="text-surface font-semibold ml-2">{t('loginScreen.signning_In')}</Text>
        </View>
      ) : (
        <Text className="text-surface font-semibold text-center">{t('loginScreen.login')}</Text>
      )}
    </Pressable>
  );
}