import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  authApi,
} from '../api/authApi';
import {
  storeTokens,
  getStoredTokens,
  clearTokens,
  getStoredUser,
  storeUser,
} from '../utils/apiClient';
import { OTPVerifyData } from '../types/auth';

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Use } from 'react-native-svg';
import { UserProfile } from 'types/profile';
import { use } from 'react';


export const AUTH_KEYS = {
  user: ['auth', 'user'],
  tokens: ['auth', 'tokens'],
} as const;



export const useAuth = () => {
  const queryClient = useQueryClient();

  // Query for stored tokens
  const {
    data: tokens,
    isLoading: tokensLoading,
  } = useQuery({
    queryKey: AUTH_KEYS.tokens,
    queryFn: getStoredTokens,
    staleTime: Infinity, // Tokens don't become stale
  });


  // Query for stored user
  const {
    data: user,
    isLoading: userLoading,
  } = useQuery({
    queryKey: AUTH_KEYS.user,
    queryFn: getStoredUser,
    staleTime: Infinity, // Tokens don't become stale
  });

  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      const newTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      const userData = data.data.userData;

      await storeTokens(newTokens);
      await storeUser(userData as UserProfile);

      // Update cache
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
      queryClient.setQueryData(AUTH_KEYS.user, userData);


      // navigation.goBack();
      return { success: true };

    },
    onError: (error: any) => { // Type as 'any' or create proper error type
      // Custom error handling
      const errorMessage = error.response?.data?.message || 'Username or password incorrect';
      console.log('Login failed:', errorMessage);
    },
  });


  // Google URL mutation
  const googleUrlMutation = useMutation({
    mutationFn: authApi.handleGoogleLogin,
    onSuccess: async (data) => {  // ← CORRECT! Remove the extra () =>
      console.log('✅ Mutation success, data:');

      const newTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      // console.log( "New daTa in Google Login API : ", { newTokens });

      await storeTokens(newTokens);
      await storeUser(data.data.userProfile);

      // Update cache
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
      queryClient.setQueryData(AUTH_KEYS.user, data.data.userProfile);
      const isUserProfileSetup = data.data.userProfile.gender && data.data.userProfile.firstName && data.data.userProfile.lastName && data.data.userProfile.phone && data.data.userProfile.address;
      if (isUserProfileSetup) {
        navigation.replace('MainTabs');
      } else {
        navigation.navigate('ProfileSetup');
      }

      // navigation.goBack();

    },
    onError: (error) => {
      console.log('❌ Google login failed:', error);
      Alert.alert('Error', 'Failed to login with Google');
    },
  });


  const googleLogin = async () => {
    console.log('Starting Google login process', process.env.EXPO_PUBLIC_WEBCLIENT_ID);
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_WEBCLIENT_ID, // from Google Cloud Console
        offlineAccess: false,
      });
      await GoogleSignin.hasPlayServices();

      // 🔥 IMPORTANT: clear previous session
      await GoogleSignin.signOut();

      const user: any = await GoogleSignin.signIn();
      const idToken = user.data.idToken;

      await googleUrlMutation.mutate(idToken);

    } catch (err) {
      console.log('❌ Google login failed:', err);
    }
  };

  // OTP signup mutations
  const sendOTPMutation = useMutation({
    mutationFn: authApi.sendSignupOTP,

    onError: (error) => {
      console.log('Send OTP failed:', error);
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: authApi.verifySignupOTP,
    onSuccess: async (data) => {
      const userData = data.data.userData || data.data.user;
      const newTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };


      await storeTokens(newTokens);
      await storeUser(userData as UserProfile);


      // Update cache
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
      queryClient.setQueryData(AUTH_KEYS.user, userData);


      return { success: true };

    },
    onError: (error) => {
      console.log('OTP verification failed:', error);
    },
  });


  //  forgot password send otp 

  // OTP signup mutations
  const forgotOTPMutation = useMutation({
    mutationFn: authApi.forgotPwOTP,

    onError: (error) => {
      console.log('Send OTP failed:', error);
    },
  });

  // reset password

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onError: (error) => {
      console.log('Reset password failed:', error);
    },
  });



  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await clearTokens();
      // await AsyncStorage.multiRemove(['onboarding_complete', 'selected_language']);
      await AsyncStorage.multiRemove(['authTokens', 'authUser', 'user']);

      navigation.navigate('MainTabs');

    },
    onSuccess: () => {
      console.log("Logout successful, look is authenticated:", isAuthenticated);
      queryClient.clear();
      navigation.navigate('MainTabs');

    },
  });


  // Token refresh mutation
  const refreshTokenMutation = useMutation({
    mutationFn: authApi.refreshToken,
    onSuccess: async (newTokens) => {
      await storeTokens(newTokens);
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
    },
    onError: async () => {
      await logoutMutation.mutateAsync();
    },
  });



  // OTP signup functions
  const signupOTPRequest = async (email: string) => {
    try {
      return await sendOTPMutation.mutateAsync(email);
    } catch (error) {
      throw error;
    }
  };

  const signupWithOTP = async (data: OTPVerifyData) => {
    try {
      const res = await verifyOTPMutation.mutateAsync(data);
      return res ?? { success: false };
    } catch (error) {
      throw error;
    }
  };
  const login = async (data: any) => {
    const result = await loginMutation.mutateAsync(data);
    return result ?? { success: false };
  };

  // Computed values
  const isAuthenticated = !!tokens?.accessToken;
  const isLoadingAuth =
    tokensLoading ||
    loginMutation.isPending || userLoading


  verifyOTPMutation.isPending ||
    refreshTokenMutation.isPending;


  return {
    // Data
    user,
    tokens,


    // Status

    isLoadingAuth,
    isAuthenticated,


    // Auth functions
    // login: loginMutation.mutate,
    login,
    logout: logoutMutation.mutate,
    googleLogin,
    // handleGoogleCallback,
    signupOTPRequest,
    signupWithOTP,

    forgotPWOTP: forgotOTPMutation.mutate,

    resetPassword: resetPasswordMutation.mutate,
    refreshToken: refreshTokenMutation.mutate,

    // Loading states
    loading: loginMutation.isPending, // Keep for backward compatibility
    loginLoading: loginMutation.isPending,
    googleloading: googleUrlMutation.isPending,
    otpSendLoading: sendOTPMutation.isPending,
    otpVerifyLoading: verifyOTPMutation.isPending,
    forgotPwIsLoading: forgotOTPMutation.isPending,
    resetPasswordLoading: resetPasswordMutation.isPending,
    logoutLoading: logoutMutation.isPending,

    // Error states
    error: loginMutation.error, // Keep for backward compatibility
    loginError: loginMutation.error
    ,
    // googleError: googleUrlMutation.error,
    otpSendError: sendOTPMutation.error,
    otpVerifyError: verifyOTPMutation.error,
    resetPasswordError: resetPasswordMutation.error,

    // Utils

  };
};