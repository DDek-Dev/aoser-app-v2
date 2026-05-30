import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';

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

import { navigate, replace } from 'navigation/RootNavigation';

import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { UserProfile } from 'types/profile';
import { clearStaleKycDataForOtherUsers } from 'utils/kycStorage';
import axios from 'axios';
import { auth } from 'firebaceConfig';



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


  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (data) => {
      const newTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      const userData = data.data.userData;
      await clearStaleKycDataForOtherUsers(userData?._id || '');
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
      // console.log('✅ Mutation success, data:');

      const newTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      // console.log( "New daTa in Google Login API : ", { newTokens });

      await clearStaleKycDataForOtherUsers(data.data.userProfile?._id || '');
      await storeTokens(newTokens);
      await storeUser(data.data.userProfile);

      // Update cache
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
      queryClient.setQueryData(AUTH_KEYS.user, data.data.userProfile);
      const isUserProfileSetup = data.data.userProfile.gender && data.data.userProfile.firstName && data.data.userProfile.lastName && data.data.userProfile.phone ;
      if (isUserProfileSetup) {
        replace('MainTabs');
      } else {
        navigate('ProfileSetup');
      }

      // navigation.goBack();

    },
    onError: (error) => {
      console.log('❌ Google login failed:', error);
      // Alert.alert('Error', 'Failed to login with Google');
    },
  });


  const googleLogin = async () => {
    // console.log('Starting Google login process', process.env.EXPO_PUBLIC_WEBCLIENT_ID);
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


  const appleUrlMutation = useMutation({
    mutationFn: authApi.handleApplelogin,
    onSuccess: async (data) => {

      const newTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      // console.log( "New daTa in Google Login API : ", { newTokens });

      await clearStaleKycDataForOtherUsers(data.data.userProfile?._id || '');
      await storeTokens(newTokens);
      await storeUser(data.data.userProfile);

      // Update cache
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
      queryClient.setQueryData(AUTH_KEYS.user, data.data.userProfile);
      const isUserProfileSetup = 
    data.data.userProfile.gender &&
    data.data.userProfile.firstName &&
    data.data.userProfile.lastName &&
    data.data.userProfile.phone &&
    data.data.userProfile.userProfileImage;
      if (isUserProfileSetup) {
        replace('MainTabs');
      } else {
        navigate('ProfileSetup');
      }
      // ทำสิ่งที่ต้องทำต่อ เช่น เก็บ Token หรือนำทางไปหน้า Home
    },
    onError: (error) => {
      console.log('Login Error:', error);
    }
  });

  const appleLogin = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const payload = {
        idToken: credential.identityToken,
        firstName: credential.fullName?.givenName || "",
        lastName: credential.fullName?.familyName || ""
      };

      // ส่งไปที่ Backend
      await appleUrlMutation.mutate(payload as any);

    } catch (err) {
      console.log('❌ Apple login failed:', err);
    }
  };

  // OTP signup mutations
  const sendOTPMutation = useMutation({
    mutationFn: authApi.sendSignupOTP,

    onError: (error) => {
      console.log('Send OTP failed:', error);
    },
  });

  const useDeleteAccount = useMutation({
    mutationFn: (token: string) => authApi.deleteAccount(token),
    onSuccess: async (data) => {
      console.log('Account deletion successful:', data);
      await clearTokens();
      navigate('MainTabs');
    },
    onError: (error) => {
      console.log('Delete account failed:', error);
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


      await clearStaleKycDataForOtherUsers((userData as any)?._id || '');
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

      navigate('MainTabs');

    },
    onSuccess: () => {
      console.log("Logout successful, look is authenticated:", isAuthenticated);
      queryClient.clear();
      navigate('MainTabs');

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
    loginMutation.isPending ||
    userLoading ||
    verifyOTPMutation.isPending ||
    refreshTokenMutation.isPending ||
    logoutMutation.isPending;

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
    logout: logoutMutation.mutateAsync,
    googleLogin,
    appleLogin,
    // handleGoogleCallback,
    signupOTPRequest,
    signupWithOTP,

    forgotPWOTP: forgotOTPMutation.mutate,

    resetPassword: resetPasswordMutation.mutate,
    refreshToken: refreshTokenMutation.mutate,
    useDeleteAccount,
    deletingAccount: useDeleteAccount.isPending,
    // Loading states
    loading: loginMutation.isPending || logoutMutation.isPending, // Keep for backward compatibility
    loginLoading: loginMutation.isPending,
    googleloading: googleUrlMutation.isPending,
    appleleloading: appleUrlMutation.isPending,
    appleError: appleUrlMutation.error,
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
