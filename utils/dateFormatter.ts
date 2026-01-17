import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "i18n";

export type Language = 'en' | 'la';

export const formatRelativeTime = (dateString: string, language: Language = 'en'): string => {
  if (!dateString) return language === 'en' ? 'Unknown date' : 'ບໍ່ຮູ້ວັນທີ';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Lao translations
    const translations = {
      en: {
        justNow: 'Just now',
        minutesAgo: (min: number) => `${min} min ago`,
        hoursAgo: (hours: number) => `${hours} hour${hours > 1 ? 's' : ''} ago`,
        yesterday: 'Yesterday',
        daysAgo: (days: number) => `${days} days ago`,
      },
      la: {
        justNow: 'ດຽວນີ້',
        minutesAgo: (min: number) => `${min} ນາທີກ່ອນ`,
        hoursAgo: (hours: number) => `${hours} ຊົ່ວໂມງກ່ອນ`,
        yesterday: 'ມື້ວານ',
        daysAgo: (days: number) => `${days} ມື້ກ່ອນ`,
      }
    };

    const t = translations[language];

    // If today
    if (diffInDays === 0) {
      if (diffInHours === 0) {
        if (diffInMinutes === 0) {
          return t.justNow;
        }
        return t.minutesAgo(diffInMinutes);
      }
      return t.hoursAgo(diffInHours);
    }
    
    // If yesterday
    if (diffInDays === 1) {
      return t.yesterday;
    }
    
    // If within this week (2-6 days ago)
    if (diffInDays > 1 && diffInDays < 7) {
      return t.daysAgo(diffInDays);
    }
    
    // If more than a week ago, show the date
    return formatDate(dateString, language);
  } catch (error) {
    console.log('Error formatting date:', error);
    return language === 'en' ? 'Invalid date' : 'ວັນທີບໍ່ຖືກຕ້ອງ';
  }
};

export const formatRelativeTimeWithTime = (dateString: string, language: Language = 'en'): string => {
  if (!dateString) return language === 'en' ? 'Unknown date' : 'ບໍ່ຮູ້ວັນທີ';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    const translations = {
      en: {
        today: 'Today at',
        yesterday: 'Yesterday at',
      },
      la: {
        today: 'ມື້ນີ້ເວລາ',
        yesterday: 'ມື້ວານເວລາ',
      }
    };

    const t = translations[language];

    if (isToday) {
      return `${t.today} ${formatTime(date, language)}`;
    } else if (isYesterday) {
      return `${t.yesterday} ${formatTime(date, language)}`;
    } else {
      return formatDate(dateString, language);
    }
  } catch (error) {
    console.log('Error formatting date:', error);
    return language === 'en' ? 'Invalid date' : 'ວັນທີບໍ່ຖືກຕ້ອງ';
  }
};

export const formatDate = (dateString: string, language: Language = 'en'): string => {
  if (!dateString) return language === 'en' ? 'Unknown date' : 'ບໍ່ຮູ້ວັນທີ';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    if (language === 'la') {
      // Lao date formatting - DD/MM/YYYY
      return `${day}/${month}/${year}`;
    } else {
      // English date formatting - DD/MM/YYYY
      return `${day}/${month}/${year}`;
    }
  } catch (error) {
    console.log('Error formatting date:', error);
    return language === 'en' ? 'Invalid date' : 'ວັນທີບໍ່ຖືກຕ້ອງ';
  }
};

export const formatTime = (date: Date, language: Language = 'en'): string => {
  try {
    if (language === 'la') {
      // Lao time formatting (24-hour format)
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } else {
      // English time formatting (12-hour format with AM/PM)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch (error) {
    console.log('Error formatting time:', error);
    return language === 'en' ? 'Invalid time' : 'ເວລາບໍ່ຖືກຕ້ອງ';
  }
};

export const getCurrentLanguage = (): Language => {
  return (i18n.language as Language) || 'en';
};
// export const getCurrentLanguage = async (): Promise<Language> => {
//   try {
//     const lang = await AsyncStorage.getItem('userLanguage');
//     return (lang as Language) || 'en';
//   } catch {
//     return 'en';
//   }
// };
// Helper function to get current language (you can replace this with your actual language detection)
// export const getCurrentLanguage = (): Language => {
//   // You can replace this with your actual language detection logic
//   // For example: const language = useLanguageStore.getState().language;
//   return 'en'; // default to English
// };