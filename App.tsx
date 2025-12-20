// App.tsx - CORRECTED VERSION
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import './global.css';
import OnboardingNavigator from 'navigation/OnboardingNavigator';
import MainNavigator from 'navigation/MainNavigator';
import './i18n'; // This imports and initializes i18n
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertNotificationRoot } from 'react-native-alert-notification';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider } from 'contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initLanguage } from 'utils/authStorage';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native'; // For loading indicator

const queryClient = new QueryClient();

export default function App() {
  const [isCompleteOnboarding, setIsCompleteOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  // Initialize everything in one useEffect
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // 1. Initialize language first
        await initLanguage(i18n);
        setIsLanguageReady(true);
        
        // 2. Check onboarding status
        const value = await AsyncStorage.getItem('onboarding_complete');
        setIsCompleteOnboarding(value === 'true');
      } catch (error) {
        console.log('Error initializing app:', error);
        // Set defaults on error
        setIsCompleteOnboarding(false);
        setIsLanguageReady(true); // Still set to true to show app
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Show loading indicator while initializing
  if (isLoading || !isLanguageReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <NavigationContainer>
          <AuthProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AlertNotificationRoot
                  theme='light'
                  toastConfig={{
                    autoClose: true,
                  }}
                >
                  <BottomSheetModalProvider>
                    <StatusBar style="auto" />
                    {isCompleteOnboarding ? (
                      <MainNavigator />
                    ) : (
                      <OnboardingNavigator />
                    )}
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