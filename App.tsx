// App.tsx
import React, { useEffect, useState } from 'react';
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
import { deactivateKeepAwake } from 'expo-keep-awake';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';
import { initLanguage } from 'utils/authStorage';
import NetInfo from '@react-native-community/netinfo';
import { NetworkErrorOverlay } from 'components/ui/NetworkErrorOverlay';
import { apiEvents } from 'api/networkCheck'; // ນຳເຂົ້າ apiEvents ທີ່ເຮົາສ້າງໄວ້

const queryClient = new QueryClient();

export default function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [hasApiError, setHasApiError] = useState(false);

  useEffect(() => {
    // 1. ຕິດຕາມສະຖານະເນັດ (Real-time NetInfo)
    const unsubscribeNet = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
      if (state.isConnected) setHasApiError(false); // ຖ້າເນັດມາໃຫ້ລ້າງ Error
    });

    // 2. ຕິດຕາມ Error ຈາກ Axios Interceptor
    const onApiNetworkError = () => setHasApiError(true);
    apiEvents.on('network_error', onApiNetworkError);

    // 3. Initialize App Data
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

  const isOverlayVisible = isConnected === false || hasApiError;


  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <NavigationContainer ref={navigationRef}>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AlertNotificationRoot theme='light'>
                  <BottomSheetModalProvider>
                    <StatusBar style="auto" />
                    <MainNavigator />

                    <NetworkErrorOverlay
                      visible={isOverlayVisible}
                      onRetry={handleRetry}
                    />
                  </BottomSheetModalProvider>
                </AlertNotificationRoot>
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AuthProvider>
        </NavigationContainer>
      </I18nextProvider>
    </QueryClientProvider>
  );
}