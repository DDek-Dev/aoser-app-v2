import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import en from './locales/en.json';
import la from './locales/la.json';

const resources = {
  en: { translation: en },
  la: { translation: la },
};

const fallback = 'en';
const locales = getLocales();
const languageTag = locales[0]?.languageCode || fallback;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: languageTag,
    fallbackLng: fallback,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;