import { useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FreelancerStackParamList } from 'types/navigation';

const { width } = Dimensions.get('window');

type OnboardingStackParamList = {
  Onboarding: undefined;
  MainApp: undefined;
};

// type NavigationProp = StackNavigationProp<OnboardingStackParamList>;

export default function OnboardingScreen({ navigation, route }: any) {
  // const navigation = useNavigation<StackNavigationProp<FreelancerStackParamList>>();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { t } = useTranslation();



 const handleSkip = async () => {
  try {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    console.log('Onboarding completed');
    // navigation.replace('SignIn');
    route.params?.onComplete?.();
    //  navigation.navigate('Auth', { screen: 'SignIn' });
  } catch (error) {
    console.log('Error completing onboarding:', error);
  }
};

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const slides = [
    {
      key: '1',
      title: `${t('onboarding.s_t_1')}`,
      description: `${t('onboarding.s_t_1_description')}`,
      image: require('../../assets/onboarding/on1.jpg'),
    },
    {
      key: '2',
      title: 'Discover Content',
      description: 'Find content tailored to your interests.',
      image: require('../../assets/onboarding/on2.png'),
    },
    {
      key: '3',
      title: 'Connect With People',
      description: 'Chat, share, and build your community.',
      image: require('../../assets/onboarding/on3.jpg'),
    },
    {
      key: '4',
      title: 'You’re Ready!',
      description: 'Start your journey with Aoser now.',
      image: require('../../assets/onboarding/on4.jpeg'),
    },
  ];

  return (
    <View className="flex-1 bg-white relative">
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {currentIndex < slides.length - 1 && (
        <TouchableOpacity onPress={handleSkip} className="absolute top-14 right-5 z-10">
          <Text className="text-base text-blue-500">{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        onScroll={handleScroll}
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {slides.map((slide) => (
          <View
            key={slide.key}
            style={{ width }}
            className="flex-1 items-center justify-center px-8"
          >
            <Image
              source={slide.image}
              resizeMode="cover"
              className="w-full h-64 rounded-xl mb-8"
            />
            <Text className="text-2xl font-bold text-center mb-3">{slide.title}</Text>
            <Text className="text-base text-gray-500 text-center mb-8">{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ✅ Show Pagination Dots or Final Button */}
      <View className="absolute bottom-20 left-0 right-0 items-center justify-center">
        {currentIndex === slides.length - 1 ? (
          <TouchableOpacity
            onPress={handleSkip}
            className="bg-blue-500 px-10 py-3 rounded-full "
          >
            <Text className="text-white text-base font-semibold">I Understand</Text>
          </TouchableOpacity>
        ) : (
          <View className="flex-row space-x-2">
            {slides.map((_, index) => (
              <View
                key={index}
                className={`w-2.5 h-2 rounded-full ${
                  index === currentIndex ? 'bg-blue-500 w-4' : 'bg-gray-300'
                }`}
                style={{ marginHorizontal: 4 }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
