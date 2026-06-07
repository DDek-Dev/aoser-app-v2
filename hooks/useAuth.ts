import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { authApi } from '../api/authApi';
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
import i18n from 'i18n';

// ✅ Firebase
import { setFirebaseUser, clearFirebaseUser, logLogin } from 'utils/firebase';

// ✅ Mixpanel
import {
  mixpanelIdentify,
  mixpanelReset,
  trackLogin,
  trackSignUp,
  trackLogout,
  trackAccountDeleted,
  UserRole,
} from 'utils/mixpanel';

// ─────────────────────────────────────────
// ✅ Role mapper
// ─────────────────────────────────────────
const toMixpanelRole = (businessType?: string): UserRole => {
  const validRoles: UserRole[] = [
    'CUSTOMER', 'FREELANCER', 'TRANSPORT',
    'ACCOMMODATION', 'COMPANY', 'SHOP', 'AOSER_ADMIN'
  ];
  return validRoles.includes(businessType as UserRole)
    ? (businessType as UserRole)
    : 'CUSTOMER';
};

export const AUTH_KEYS = {
  user: ['auth', 'user'],
  tokens: ['auth', 'tokens'],
} as const;

export const useAuth = () => {
  const queryClient = useQueryClient();

  const {
    data: tokens,
    isLoading: tokensLoading,
  } = useQuery({
    queryKey: AUTH_KEYS.tokens,
    queryFn: getStoredTokens,
    staleTime: Infinity,
  });

  const {
    data: user,
    isLoading: userLoading,
  } = useQuery({
    queryKey: AUTH_KEYS.user,
    queryFn: getStoredUser,
    staleTime: Infinity,
  });

  // ─────────────────────────────────────────
  // ✅ LOGIN
  // ─────────────────────────────────────────
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
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
      queryClient.setQueryData(AUTH_KEYS.user, userData);

      // ✅ Firebase
      await setFirebaseUser(userData?._id || '', userData?.businessType);
      await logLogin(userData?.email || '');

      // ✅ Mixpanel
      await mixpanelIdentify(userData?._id || '', {
        name: `${userData?.firstName} ${userData?.lastName}`,
        email: userData?.email,
        phone: userData?.phone,
        businessType: toMixpanelRole(userData?.businessType),
        language: i18n.language,
      });
      trackLogin('email', toMixpanelRole(userData?.businessType));

      return { success: true };
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Username or password incorrect';
      console.log('Login failed:', errorMessage);
    },
  });

  // ─────────────────────────────────────────
  // ✅ GOOGLE LOGIN
  // ─────────────────────────────────────────
  const googleUrlMutation = useMutation({
    mutationFn: authApi.handleGoogleLogin,
    onSuccess: async (data) => {
      const newTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      await clearStaleKycDataForOtherUsers(data.data.userProfile?._id || '');
      await storeTokens(newTokens);
      await storeUser(data.data.userProfile);
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
      queryClient.setQueryData(AUTH_KEYS.user, data.data.userProfile);

      // ✅ Firebase
      await setFirebaseUser(
        data.data.userProfile?._id || '',
        data.data.userProfile?.businessType
      );
      await logLogin(data.data.userProfile?.email || '');

      // ✅ Mixpanel
      await mixpanelIdentify(data.data.userProfile?._id || '', {
        name: `${data.data.userProfile?.firstName} ${data.data.userProfile?.lastName}`,
        email: data.data.userProfile?.email,
        phone: data.data.userProfile?.phone,
        businessType: toMixpanelRole(data.data.userProfile?.businessType),
        language: i18n.language,
      });
      trackLogin('google', toMixpanelRole(data.data.userProfile?.businessType));

      const isUserProfileSetup =
        data.data.userProfile.gender &&
        data.data.userProfile.firstName &&
        data.data.userProfile.lastName &&
        data.data.userProfile.phone;
      if (isUserProfileSetup) {
        replace('MainTabs');
      } else {
        navigate('ProfileSetup');
      }
    },
    onError: (error) => {
      console.log('❌ Google login failed:', error);
    },
  });

  const googleLogin = async () => {
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_WEBCLIENT_ID,
        offlineAccess: false,
      });
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signOut();
      const user: any = await GoogleSignin.signIn();
      const idToken = user.data.idToken;
      await googleUrlMutation.mutateAsync(idToken);
    } catch (err) {
      console.log('❌ Google login failed:', err);
    }
  };

  // ─────────────────────────────────────────
  // ✅ APPLE LOGIN
  // ─────────────────────────────────────────
  const appleUrlMutation = useMutation({
    mutationFn: authApi.handleApplelogin,
    onSuccess: async (data) => {
      const newTokens = {
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };
      await clearStaleKycDataForOtherUsers(data.data.userProfile?._id || '');
      await storeTokens(newTokens);
      await storeUser(data.data.userProfile);
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
      queryClient.setQueryData(AUTH_KEYS.user, data.data.userProfile);

      // ✅ Firebase
      await setFirebaseUser(
        data.data.userProfile?._id || '',
        data.data.userProfile?.businessType
      );
      await logLogin(data.data.userProfile?.email || '');

      // ✅ Mixpanel
      await mixpanelIdentify(data.data.userProfile?._id || '', {
        name: `${data.data.userProfile?.firstName} ${data.data.userProfile?.lastName}`,
        email: data.data.userProfile?.email,
        phone: data.data.userProfile?.phone,
        businessType: toMixpanelRole(data.data.userProfile?.businessType),
        language: i18n.language,
      });
      trackLogin('apple', toMixpanelRole(data.data.userProfile?.businessType));

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
    },
    onError: (error) => {
      console.log('Login Error:', error);
    },
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
        firstName: credential.fullName?.givenName || '',
        lastName: credential.fullName?.familyName || '',
      };
      await appleUrlMutation.mutateAsync(payload as any);
    } catch (err) {
      console.log('❌ Apple login failed:', err);
    }
  };

  // ─────────────────────────────────────────
  // ✅ OTP SIGNUP
  // ─────────────────────────────────────────
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
      await clearStaleKycDataForOtherUsers((userData as any)?._id || '');
      await storeTokens(newTokens);
      await storeUser(userData as UserProfile);
      queryClient.setQueryData(AUTH_KEYS.tokens, newTokens);
      queryClient.setQueryData(AUTH_KEYS.user, userData);

      // ✅ Firebase
      await setFirebaseUser(
        (userData as any)?._id || '',
        (userData as any)?.businessType
      );

      // ✅ Mixpanel
      await mixpanelIdentify((userData as any)?._id || '', {
        name: `${(userData as any)?.firstName} ${(userData as any)?.lastName}`,
        email: (userData as any)?.email,
        phone: (userData as any)?.phone,
        businessType: toMixpanelRole((userData as any)?.businessType),
        language: i18n.language,
      });
      trackSignUp('otp', toMixpanelRole((userData as any)?.businessType));

      return { success: true };
    },
    onError: (error) => {
      console.log('OTP verification failed:', error);
    },
  });

  // ─────────────────────────────────────────
  // ✅ DELETE ACCOUNT
  // ─────────────────────────────────────────
  const useDeleteAccount = useMutation({
    mutationFn: (token: string) => authApi.deleteAccount(token),
    onSuccess: async (data) => {
      console.log('Account deletion successful:', data);

      // ✅ track before clearing
      trackAccountDeleted(toMixpanelRole(user?.businessType));
      await clearFirebaseUser();
      await mixpanelReset();

      await clearTokens();
      queryClient.clear();
      navigate('MainTabs');
    },
    onError: (error) => {
      console.log('Delete account failed:', error);
    },
  });

  // ─────────────────────────────────────────
  // ✅ LOGOUT
  // ─────────────────────────────────────────
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await clearTokens();
      await AsyncStorage.multiRemove(['authTokens', 'authUser', 'user']);

      // ✅ track before clearing
      trackLogout();
      await clearFirebaseUser();
      await mixpanelReset();

      navigate('MainTabs');
    },
    onSuccess: () => {
      console.log('Logout successful, isAuthenticated:', isAuthenticated);
      queryClient.clear();
      navigate('MainTabs');
    },
  });

  // ─────────────────────────────────────────
  // ✅ OTHER MUTATIONS
  // ─────────────────────────────────────────
  const forgotOTPMutation = useMutation({
    mutationFn: authApi.forgotPwOTP,
    onError: (error) => {
      console.log('Send OTP failed:', error);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onError: (error) => {
      console.log('Reset password failed:', error);
    },
  });

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

  const isAuthenticated = !!tokens?.accessToken;
  const isLoadingAuth =
    tokensLoading ||
    loginMutation.isPending ||
    userLoading ||
    verifyOTPMutation.isPending ||
    refreshTokenMutation.isPending ||
    logoutMutation.isPending;

  return {
    user,
    tokens,
    isLoadingAuth,
    isAuthenticated,
    login,
    logout: logoutMutation.mutateAsync,
    googleLogin,
    appleLogin,
    signupOTPRequest,
    signupWithOTP,
    forgotPWOTP: forgotOTPMutation.mutate,
    resetPassword: resetPasswordMutation.mutate,
    refreshToken: refreshTokenMutation.mutate,
    useDeleteAccount,
    deletingAccount: useDeleteAccount.isPending,
    loading: loginMutation.isPending || logoutMutation.isPending,
    loginLoading: loginMutation.isPending,
    googleloading: googleUrlMutation.isPending,
    appleleloading: appleUrlMutation.isPending,
    appleError: appleUrlMutation.error,
    otpSendLoading: sendOTPMutation.isPending,
    otpVerifyLoading: verifyOTPMutation.isPending,
    forgotPwIsLoading: forgotOTPMutation.isPending,
    resetPasswordLoading: resetPasswordMutation.isPending,
    logoutLoading: logoutMutation.isPending,
    error: loginMutation.error,
    loginError: loginMutation.error,
    otpSendError: sendOTPMutation.error,
    otpVerifyError: verifyOTPMutation.error,
    resetPasswordError: resetPasswordMutation.error,
  };
};