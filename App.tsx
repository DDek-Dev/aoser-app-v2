import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import MainNavigator from 'navigation/MainNavigator';
import { navigationRef } from 'navigation/RootNavigation';
import './i18n';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from 'contexts/AuthContext';
import { VideoPlaybackProvider } from 'contexts/VideoPlaybackProvider';
import { deactivateKeepAwake } from 'expo-keep-awake';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';
import { initLanguage } from 'utils/authStorage';
import NetInfo from '@react-native-community/netinfo';
import { NetworkErrorOverlay } from 'components/ui/NetworkErrorOverlay';
import { apiEvents } from 'api/networkCheck';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { usePushNotifications } from 'hooks/useNotifications';
import { enableCrashlytics, logScreenView } from 'utils/firebase'
import { ErrorBoundary } from 'components/ErrorBoundary';

const queryClient = new QueryClient();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

/**
 * NotificationController handles push notification registration and interaction.
 * By placing it inside AuthProvider, we ensure it can eventually react to login state.
 */
function NotificationController() {
  const handleNotificationTapped = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    console.log('🔔 Notification data payload:', data);
    if (!navigationRef.isReady()) return;

    if (data.screen && data.params) {
      navigationRef.navigate(data.screen as any, data.params);
    } else if (data.screen && !data.params) {
      navigationRef.navigate(data.screen as any);
    }
  };

  // Note: For a complete fix, your usePushNotifications hook should be updated 
  // to skip the backend API call if the user is not logged in.
  usePushNotifications(handleNotificationTapped);

  return null;
}

function AppContent() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [hasApiError, setHasApiError] = useState(false);
  const routeNameRef = useRef<string | undefined>(undefined); // ✅ add

  const [fontsLoaded, fontError] = useFonts({
    'LaoFont': require('./assets/fonts/Noto_Sans_Lao/NotoSansLao-VariableFont_wdth,wght.ttf'),
  });





  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    enableCrashlytics(); // ✅ add

    const unsubscribeNet = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected) setHasApiError(false);
    });

    const onApiNetworkError = () => setHasApiError(true);
    apiEvents.on('network_error', onApiNetworkError);

    const initializeApp = async () => {
      try {
        await initLanguage(i18n);
        deactivateKeepAwake();
      } catch (error) {
        console.log('Error initializing app:', error);
      }
    };
    initializeApp();

    return () => {
      unsubscribeNet();
      apiEvents.off('network_error', onApiNetworkError);
    };
  }, []);


  const handleRetry = async () => {
    const state = await NetInfo.fetch();
    setIsConnected(state.isConnected);
    setHasApiError(false);
  };

  // ✅ Screen tracking
  const onNavigationReady = () => {
    routeNameRef.current = navigationRef.getCurrentRoute()?.name;
  };

  const onNavigationStateChange = async () => {
    const previousRoute = routeNameRef.current;
    const currentRoute = navigationRef.getCurrentRoute()?.name;
    if (currentRoute && previousRoute !== currentRoute) {
      await logScreenView(currentRoute);
    }
    routeNameRef.current = currentRoute;
  };

  const isOverlayVisible = isConnected === false || hasApiError;
  const insets = useSafeAreaInsets();

  if (!fontsLoaded && !fontError) return null;

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={onNavigationReady}
      onStateChange={onNavigationStateChange}
    >
      <AuthProvider>
        <NotificationController />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AlertNotificationRoot theme='light'>
              <BottomSheetModalProvider>
                <StatusBar style="auto" />
                <VideoPlaybackProvider>
                  <MainNavigator />
                  <NetworkErrorOverlay
                    visible={isOverlayVisible}
                    onRetry={handleRetry}
                  />

                  <View
                    pointerEvents="none"
                    style={{
                      height: insets.bottom,
                      backgroundColor: Platform.OS === 'ios' ? '#fff' : '#000',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      zIndex: 9999,
                    }}
                  />
                </VideoPlaybackProvider>
              </BottomSheetModalProvider>
            </AlertNotificationRoot>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </I18nextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  defaultFont: {
    fontFamily: 'LaoFont',
  },
});