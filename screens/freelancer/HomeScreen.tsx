import { useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  RefreshControl,
  Pressable,
} from 'react-native';

import CategoryTabs from 'components/freelancer/CategoryTabs';
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

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'SearchBar'>;
  const navigation = useNavigation<SearchBarNavigationProp>();
  const { t } = useTranslation();

  // Fetch freelancers with current category filter
  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useRecommendedFreelancers(selectedCategoryId || '');

  // Flatten all pages efficiently
  const allFreelancers = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data?.pages]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

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

  const handleCategoryChange = useCallback((category: string, index: number, categoryId?: string) => {
    setSelectedIndex(index);
    setSelectedCategory(category);
    setSelectedCategoryId(categoryId || null);

    // Trigger smooth fade animation
    const direction = index > selectedIndex ? 1 : -1;

    fadeAnim.setValue(0);
    translateXAnim.setValue(30 * direction);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selectedIndex, fadeAnim, translateXAnim]);

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
          <Pressable
            onPress={() => navigation.navigate('SearchBar', { text: '', focus: true })}
            className="flex-row items-center bg-surface rounded-full border border-gray-300 px-4 py-4 mt-3"
          >
            <Ionicons name="search-outline" size={20} color="#3B82F6" />
            <Text className="ml-2 text-base text-[#999]">{t('home.search_freelancer')}</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Category Tabs */}
      <View style={{ backgroundColor: 'white' }}>
        <CategoryTabs
          selectedCategory={selectedCategory}
          selectedIndex={selectedIndex}
          onCategoryChange={handleCategoryChange}
        />
      </View>

      <Animated.ScrollView
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
            title={t('home.pull_to_refresh') || 'Pull to refresh...'}
            titleColor="#666"
          />
        }
      >
        {/* Freelancers List */}
        <Animated.View
          style={{
            paddingTop: 8,
            zIndex: 1,
            opacity: fadeAnim,
            transform: [{ translateX: translateXAnim }],
          }}
        >
          {selectedCategory === 'All' && <TopFreelancers />}

          <Freelancers
            title={
              selectedCategory === 'All'
                ? t('home.recommended_freelancers')
                : `${selectedCategory} ${t('home.freelancers')}`
            }
            freelancers={allFreelancers}
            isLoading={isLoading}
            isFetching={isFetching}
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