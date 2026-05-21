// OnboardingNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import LanguageSelectionScreen from 'screens/onboarding/LanguageSelectionScreen';
import { useAuth } from 'hooks/useAuth';
import MainNavigator from './MainNavigator';
// import { TabNavigator } from './MainNavigator';
const Stack = createStackNavigator();

export default function OnboardingNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  // const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompleteLanguage, setHasCompleteLanguage] = useState(false);
  // const [profileSetup, setPProfileSetup] = useState(false);
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');
      const selectedLang = await AsyncStorage.getItem('selected_language');
      // const passProfileSetup = await AsyncStorage.getItem('profileSetup');
      // setHasCompletedOnboarding(onboardingComplete === 'true' && !!selectedLang);
      setHasCompleteLanguage(selectedLang === 'true');
      // setPProfileSetup(passProfileSetup === 'true');
      if (selectedLang && ['en', 'la'].includes(selectedLang)) {
        i18n.changeLanguage(selectedLang);
      }
    } catch (error) {
      console.log('Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{
      headerShown: false,
      gestureEnabled: false
    }}>
      {!hasCompleteLanguage && <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} initialParams={{ onComplete: () => setHasCompleteLanguage(true) }} />}

      {/* {!hasCompletedOnboarding &&
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          initialParams={{ onComplete: () => setHasCompletedOnboarding(true) }}
        />

      } */}

      {/* {!profileSetup && <ProfileSetup />} */}
      {hasCompleteLanguage && (
        <Stack.Screen name="MainTabs" component={MainNavigator} />

      )}
    </Stack.Navigator>
  );
}