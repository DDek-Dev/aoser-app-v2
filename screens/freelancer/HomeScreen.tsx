import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

import CategoryTabs from 'components/freelancer/CategoryTabs';
import Advert from 'components/freelancer/Advert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import Freelancers from 'components/freelancer/Freelancers';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useTranslation } from 'react-i18next';
import { useRecommendedFreelancers } from 'hooks/useFreelancer';
import TopFreelancers from 'components/freelancer/TopFreelancers';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'SearchBar'>;
  const navigation = useNavigation<SearchBarNavigationProp>();
  const { t } = useTranslation();

  // Fetch all freelancers once (no category filter in API call)
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useRecommendedFreelancers(''); // Always fetch all

  // Flatten all pages
  const allFreelancers = useMemo(() => {
    return data?.pages.flat() || [];
  }, [data]);

  // Filter freelancers locally based on selected category
  const filteredFreelancers = useMemo(() => {
    if (!selectedCategoryId || selectedCategory === 'All') {
      return allFreelancers;
    }

    return allFreelancers.filter(freelancer =>
      freelancer.serviceType === selectedCategoryId
    );
  }, [allFreelancers, selectedCategoryId, selectedCategory]);

  // Banner animations
  const bannerTextOpacity = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const bannerHeight = scrollY.interpolate({
    inputRange: [0, 380],
    outputRange: [110, 110],
    extrapolate: 'clamp',
  });

  const bannerRadius = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 1000],
    outputRange: [0, -4],
    extrapolate: 'clamp',
  });

  const stickyTabsTranslateY = scrollY.interpolate({
    inputRange: [0, 150, 151],
    outputRange: [-100, -100, 0],
    extrapolate: 'clamp',
  });

  const stickyTabsOpacity = scrollY.interpolate({
    inputRange: [0, 200, 200],
    outputRange: [0, 0, 1],
    extrapolate: 'clamp',
  });

  const handleCategoryChange = (category: string, index: number, categoryId?: string) => {
    setPrevIndex(selectedIndex);
    setSelectedIndex(index);
    setSelectedCategory(category);
    setSelectedCategoryId(categoryId || null);

    // Trigger fade animation
    const direction = index > selectedIndex ? 1 : -1;

    fadeAnim.setValue(0);
    translateXAnim.setValue(30 * direction);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <ScreenWrapper safeEdges={[]} style={{ flex: 1 }}>
      {/* Search Banner */}
      <Animated.View
        style={[
          styles.banner,
          {
            zIndex: 99,
            height: bannerHeight,
            borderBottomLeftRadius: bannerRadius,
            borderBottomRightRadius: bannerRadius,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: searchBarTranslateY }] }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('SearchBar', { text: '', focus: true })}
            className="flex-row items-center bg-surface rounded-full border border-gray-300 px-4 py-4 mt-3"
          >
            <Ionicons name="search-outline" size={20} color="#3B82F6" />
            <Text className="ml-2 text-base text-[#999]">{t('home.search_freelancer')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Sticky Category Tabs */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 110,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          paddingVertical: 8,
          zIndex: 2,
          elevation: 4,
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          transform: [{ translateY: stickyTabsTranslateY }],
          opacity: stickyTabsOpacity,
        }}
        pointerEvents="box-none"
      >
        <View pointerEvents="auto">
          <CategoryTabs
            selectedCategory={selectedCategory}
            selectedIndex={selectedIndex}
            onCategoryChange={handleCategoryChange}
          />
        </View>
      </Animated.View>

      <Animated.ScrollView
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        keyboardShouldPersistTaps="handled"
      >
        {/* Advert */}
        <Animated.View style={{ opacity: bannerTextOpacity }}>
          <Advert />
        </Animated.View>

        {/* Regular Category Tabs */}
        <View style={{ backgroundColor: 'white', paddingVertical: 8 }}>
          <CategoryTabs
            selectedCategory={selectedCategory}
            selectedIndex={selectedIndex}
            onCategoryChange={handleCategoryChange}
          />
        </View>

        {/* Freelancers List */}
        <Animated.View
          style={{
            paddingTop: 8,
            zIndex: 1,
            opacity: fadeAnim,
            transform: [{ translateX: translateXAnim }],
          }}
        >
          {selectedCategory === 'All' && (
            <TopFreelancers />
          )}


          <Freelancers
            title={selectedCategory === 'All'
              ? t('home.recommended_freelancers')
              : `${selectedCategory} ${t('home.freelancers')}`
            }
            freelancers={filteredFreelancers}
            isLoading={isLoading}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            scrollY={scrollY}
          />
        </Animated.View>
      </Animated.ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 12,
  },
});