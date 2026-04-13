import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text,

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
import { useGetTopfreelancers, useRecommendedFreelancers } from 'hooks/useFreelancer';
import TopFreelancers from 'components/freelancer/TopFreelancers';
import NetworkErrorPopup from 'components/ui/NetworkErrorPopup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetryingNetwork, setIsRetryingNetwork] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'SearchBar'>;
  const navigation = useNavigation<SearchBarNavigationProp>();
  const { t } = useTranslation();
const insets = useSafeAreaInsets(); 
  // Fetch freelancers with current category filter
  const {
    data,
    isLoading,
    isFetching,
    isError: isRecommendedError,
    error: recommendedError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useRecommendedFreelancers(selectedCategoryId || '');
  const {
    data: topFreelancers = [],
    isLoading: isTopFreelancersLoading,
    isFetching: isTopFreelancersFetching,
    isError: isTopFreelancersError,
    error: topFreelancersError,
    refetch: refetchTopFreelancers,
  } = useGetTopfreelancers();

  // Flatten all pages efficiently
  const allFreelancers = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data?.pages]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchTopFreelancers()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refetch, refetchTopFreelancers]);

  const isLikelyNetworkError = (error: unknown): boolean => {
    if (!error) return false;

    const maybeError = error as any;
    const code = maybeError?.code;
    const message = String(maybeError?.message || '').toLowerCase();

    if (maybeError?.isAxiosError && !maybeError?.response) return true;
    if (code === 'ERR_NETWORK' || code === 'ERR_INTERNET_DISCONNECTED' || code === 'ECONNABORTED') return true;

    return (
      message.includes('network') ||
      message.includes('internet') ||
      message.includes('timeout') ||
      message.includes('failed to fetch')
    );
  };

  const hasNetworkIssue =
    (isRecommendedError && isLikelyNetworkError(recommendedError)) ||
    (isTopFreelancersError && isLikelyNetworkError(topFreelancersError));

  useEffect(() => {
    const hasAnyData = allFreelancers.length > 0 || topFreelancers.length > 0;
    const isAnyLoading = isLoading || isFetching || isTopFreelancersLoading || isTopFreelancersFetching;

    if (!isAnyLoading || hasAnyData) {
      setIsSlowConnection(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsSlowConnection(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, [
    allFreelancers.length,
    topFreelancers.length,
    isLoading,
    isFetching,
    isTopFreelancersLoading,
    isTopFreelancersFetching,
  ]);

  const showNetworkPopup = hasNetworkIssue || isSlowConnection;

  const handleNetworkRetry = useCallback(async () => {
    if (isRetryingNetwork) return;
    setIsRetryingNetwork(true);
    setIsSlowConnection(false);
    try {
      await Promise.all([refetch(), refetchTopFreelancers()]);
    } finally {
      setIsRetryingNetwork(false);
    }
  }, [isRetryingNetwork, refetch, refetchTopFreelancers]);

  // Banner animations
  const bannerTextOpacity = scrollY.interpolate({
    inputRange: [0, 180],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const bannerHeight = scrollY.interpolate({
    inputRange: [0, 380],
    outputRange: [110, 0],
    extrapolate: 'clamp',
  });

  const bannerRadius = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 1000],
    outputRange: [0, 0],
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
            // height: bannerHeight,
            borderBottomLeftRadius: bannerRadius,
            borderBottomRightRadius: bannerRadius,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ translateY: searchBarTranslateY }]}} >
          <Pressable
            onPress={() => navigation.navigate('SearchBar', { text: '', focus: true })}
            className="flex-row items-center bg-surface rounded-full border border-gray-300 px-4 py-4 "
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
        alwaysBounceVertical
        overScrollMode="always"
        contentContainerStyle={{ flexGrow: 1 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
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
          {selectedCategory === 'All' && (
            <TopFreelancers
              scrollY={scrollY}
              freelancers={topFreelancers}
              isLoading={isTopFreelancersLoading}
              isFetching={isTopFreelancersFetching}
  
            />
          )}

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
            selectedCategory={selectedCategory}
          />
        </Animated.View>
      </Animated.ScrollView>

      {/* <NetworkErrorPopup
        visible={showNetworkPopup}
        title={t('works.error.some_wrong')}
        message={t('works.error.if_the_problem')}
        retryLabel={t('works.error.try_again')}
        onRetry={handleNetworkRetry}
        isRetrying={isRetryingNetwork}
      /> */}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    // paddingTop: 30,
    paddingBottom: 12,
  },
});
