import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LanguageSelectScreen = () => {
  const { t, i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<'la' | 'en'>(i18n.language as 'la' | 'en');
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);


  const loadSavedLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem('userLanguage');
      if (savedLang) {
        setSelectedLang(savedLang as 'la' | 'en');
        i18n.changeLanguage(savedLang);
      }
    } catch (error) {
      console.log('Error loading language:', error);
    }
  };

  const handleLanguageChange = async (langKey: 'la' | 'en') => {
    try {
      setSelectedLang(langKey);
      await i18n.changeLanguage(langKey);
      await AsyncStorage.setItem('userLanguage', langKey);
    } catch (error) {
      console.log('Error changing language:', error);
    }
  };

  const languages = [
    {
      key: 'la',
      label: 'ພາສາລາວ',
      flag: require('../../assets/flags/la-flag.png'),
    },
    {
      key: 'en',
      label: 'English',
      flag: require('../../assets/flags/uk-flag.png'),
    },
  ];

  return (
    <ScreenWrapper safeEdges={['bottom']} style={{backgroundColor:'white'}}>

  

        <View style={{ paddingTop: insets.top }} className="bg-surface">
          <Header_back
            text={t('language.title')}
            onPress={() => navigation.goBack()}
            iconColor='#3B82F6'
            backgroundColor='bg-surface'
          />


        </View>
        <View className="flex-1 bg-surface justify-center items-center px-4">
          <View className='p-4 text-center flex-col items-center justify-center mb-6'>
            <Ionicons name="language" size={50} color="#3b82f6" />
            <Text className="text-textSecondary text-heading mb-2">
              {t('language.chooseLanguage')}
            </Text>
            <Text className='text-textSecondary text-base text-center'>
              {t('language.description')}
            </Text>
          </View>

          <View className="w-full space-y-4">
            {languages.map((lang) => {
              const isActive = selectedLang === lang.key;

              return (
                <TouchableOpacity
                  key={lang.key}
                  onPress={() => handleLanguageChange(lang.key as 'la' | 'en')}
                  className={`flex-row items-center justify-between border rounded-2xl p-4 mb-4 ${isActive ? 'bg-primary border-primary' : 'bg-surface border-border'
                    }`}
                >
                  <View className="flex-row items-center">
                    <Image
                      source={lang.flag}
                      className="w-8 h-8 rounded-full mr-4"
                      resizeMode="contain"
                    />
                    <Text
                      className={`text-base ${isActive ? 'text-white' : 'text-text'
                        }`}
                    >
                      {lang.label}
                    </Text>
                  </View>

                  {isActive && (
                    <Ionicons name="checkmark-circle" size={24} color="white" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
   

    </ScreenWrapper>
  );
};

export default LanguageSelectScreen;
