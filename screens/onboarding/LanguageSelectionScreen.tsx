import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../types/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18n';

type LanguageScreenNavigationProp = StackNavigationProp<OnboardingStackParamList>;

export default function LanguageSelectionScreen(route : any) {
  const navigation = useNavigation<LanguageScreenNavigationProp>();

  const handleSelectLanguage = async (lang: 'la' | 'en') => {
    try {
      await i18n.changeLanguage(lang);
      // ✅ Use 'userLanguage' key (same as settings screen)
      await AsyncStorage.setItem('userLanguage', lang);
      // navigation.replace();
      route.params?.onComplete?.();
      // return navigation.navigate('Onboarding');
    } catch (error) {
      console.log('Error setting language:', error);
    }
  };

  return (
    <View className="flex-1 bg-white justify-center items-center px-6">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Logo Card */}
      <View className="bg-blue-300 rounded-3xl p-1 shadow-lg">
        <View className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl px-10 py-12 items-center w-80">
          <Image
            source={require('../../assets/icon.png')}
            resizeMode="contain"
            className="w-16 h-16 mb-4"
          />
          <Text className="text-white text-2xl font-bold mb-2">Aoser</Text>
          <Text className="text-white text-center text-sm">
            Connect with top freelancers and get your project done, beautifully and fast!
          </Text>
        </View>
      </View>

      {/* Language Selection */}
      <Text className="text-blue-600 font-semibold text-sm mt-12 mb-4">
        Choose Your Language
      </Text>

      <TouchableOpacity
        onPress={() => handleSelectLanguage('la')}
        className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 w-64 mb-3"
      >
        <Image source={require('../../assets/flags/la-flag.png')} className="w-6 h-6 mr-3" />
        <Text className="text-base">ພາສາລາວ</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => handleSelectLanguage('en')}
        className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3 w-64"
      >
        <Image source={require('../../assets/flags/uk-flag.png')} className="w-6 h-6 mr-3" />
        <Text className="text-base">English</Text>
      </TouchableOpacity>
    </View>
  );
}