import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeFormData = async (data: any) => {
  try {
    await AsyncStorage.setItem('signupFormData', JSON.stringify(data));
  } catch (error) {
    console.log('Error storing form data:', error);
  }
};

export const getFormData = async () => {
  try {
    const data = await AsyncStorage.getItem('signupFormData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.log('Error getting form data:', error);
    return null;
  }
};

export const clearFormData = async () => {
  try {
    await AsyncStorage.removeItem('signupFormData');
  } catch (error) {
    console.log('Error clearing form data:', error);
  }
};


export const initLanguage = async (i18n: any) => {
  // try {
  //   const savedLang = await AsyncStorage.getItem('userLanguage');
  //   if (savedLang) {
  //     await i18n.changeLanguage(savedLang);
  //   }
  //   // If no saved language, i18n will use its default (first language in config)
  // } catch (error) {
  //   console.log('Error initializing language:', error);
  // }

  try {
    const saved = await AsyncStorage.getItem('userLanguage');
    const lang: 'la' | 'en' =
      saved && ['la', 'en'].includes(saved) ? (saved as any) : 'la';

    // change language and keep the key so next launch is correct
    await i18n.changeLanguage(lang);
    if (!saved) {
      await AsyncStorage.setItem('userLanguage', lang);
    }
  } catch (err) {
    console.log('initLanguage error', err);
  }
};