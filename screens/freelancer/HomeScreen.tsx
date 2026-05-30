import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Text,
  RefreshControl,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
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
// import NetworkErrorPopup from 'components/ui/NetworkErrorPopup';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HIDE_THRESHOLD = 100;  // must scroll down this many px to hide
const SHOW_THRESHOLD = 100;  // must scroll up this many px to show
const MIN_SCROLL_Y = 10;    // don't hide when near the very top

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetryingNetwork, setIsRetryingNetwork] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const [reportedFreelancerIds, setReportedFreelancerIds] = useState<string[]>([]);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateXAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // For hide/show search bar on scroll
  const lastScrollY = useRef(0);
  const bannerVisible = useRef(new Animated.Value(1)).current;
  const bannerState = useRef<'shown' | 'hidden'>('shown');
  const scrollAccumulator = useRef(0);

  type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'SearchBar'>;
  const navigation = useNavigation<SearchBarNavigationProp>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const BANNER_FULL_HEIGHT = insets.top + 12 + 12; // paddingTop + search bar height + paddingBottom

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
  } = useRecommendedFreelancers(selectedCategoryId || '', undefined);

  // console.log('Recommended Freelancers:', JSON.stringify(data, null, 2)); 
  const {
    data: topFreelancers = [],
    isLoading: isTopFreelancersLoading,
    isFetching: isTopFreelancersFetching,
    isError: isTopFreelancersError,
    error: topFreelancersError,
    refetch: refetchTopFreelancers,
  } = useGetTopfreelancers();
  // console.log('Top Freelancers:', JSON.stringify(topFreelancers, null, 2));

  const allFreelancers = useMemo(() => {
    return data?.pages.flatMap(page => page) || [];
  }, [data?.pages]);

  const reportedFreelancerIdSet = useMemo(
    () => new Set(reportedFreelancerIds),
    [reportedFreelancerIds]
  );

  const handleReportedFreelancer = useCallback((userId: string) => {
    if (!userId) return;
    setReportedFreelancerIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  }, []);

  const filteredAllFreelancers = useMemo(
    () => allFreelancers.filter((f: any) => !reportedFreelancerIdSet.has(f?._id)),
    [allFreelancers, reportedFreelancerIdSet]
  );

  const filteredTopFreelancers = useMemo(
    () => (topFreelancers || []).filter((f: any) => !reportedFreelancerIdSet.has(f?._id)),
    [topFreelancers, reportedFreelancerIdSet]
  );

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

  // Combined scroll handler: updates scrollY for other animations + handles banner hide/show
  const handleScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
        useNativeDriver: false,
        listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const currentY = event.nativeEvent.contentOffset.y;
          const diff = currentY - lastScrollY.current;
          lastScrollY.current = currentY;

          // Always show banner when near the top
          if (currentY <= MIN_SCROLL_Y) {
            if (bannerState.current !== 'shown') {
              bannerState.current = 'shown';
              scrollAccumulator.current = 0;
              Animated.spring(bannerVisible, {
                toValue: 1,
                useNativeDriver: false,
                bounciness: 0,
                speed: 20,
              }).start();
            }
            return;
          }

          // Accumulate scroll in the same direction, reset on direction change
          if (
            (diff > 0 && scrollAccumulator.current < 0) ||
            (diff < 0 && scrollAccumulator.current > 0)
          ) {
            scrollAccumulator.current = 0; // direction changed, reset
          }
          scrollAccumulator.current += diff;

          // Only act when accumulated scroll crosses the threshold
          if (scrollAccumulator.current > HIDE_THRESHOLD && bannerState.current !== 'hidden') {
            bannerState.current = 'hidden';
            scrollAccumulator.current = 0;
            Animated.spring(bannerVisible, {
              toValue: 0,
              useNativeDriver: false,
              bounciness: 0,
              speed: 20,
            }).start();
          } else if (scrollAccumulator.current < -SHOW_THRESHOLD && bannerState.current !== 'shown') {
            bannerState.current = 'shown';
            scrollAccumulator.current = 0;
            Animated.spring(bannerVisible, {
              toValue: 1,
              useNativeDriver: false,
              bounciness: 0,
              speed: 20,
            }).start();
          }
        },
      }
    ),
    []
  );

  const bannerHeightAnimated = bannerVisible.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BANNER_FULL_HEIGHT],
  });

  const bannerOpacity = bannerVisible.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const bannerRadius = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [10, 0],
    extrapolate: 'clamp',
  });

  const handleCategoryChange = useCallback((category: string, index: number, categoryId?: string) => {
    setSelectedIndex(index);
    setSelectedCategory(category);
    setSelectedCategoryId(categoryId || null);

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
    <ScreenWrapper safeEdges={['top']} style={{ flex: 1 }}>
      {/* Search Banner */}
      <Animated.View
        style={[
          styles.banner,
          {
            zIndex: 99,
            height: bannerHeightAnimated,
            opacity: bannerOpacity,
            overflow: 'hidden',
            borderBottomLeftRadius: bannerRadius,
            borderBottomRightRadius: bannerRadius,
          },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate('SearchBar', { text: '', focus: true })}
          className="flex-row items-center bg-surface rounded-full border border-gray-300 px-4 py-4"
        >
          <Ionicons name="search-outline" size={20} color="#3B82F6" />
          <Text className="ml-2 text-base text-[#999]">{t('home.search_freelancer')}</Text>
        </Pressable>
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
        onScroll={handleScroll}
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
              freelancers={filteredTopFreelancers}
              isLoading={isTopFreelancersLoading}
              isFetching={isTopFreelancersFetching}
              onReported={handleReportedFreelancer}
            />
          )}

          <Freelancers
            title={
              selectedCategory === 'All'
                ? t('home.recommended_freelancers')
                : `${selectedCategory} ${t('home.freelancers')}`
            }
            freelancers={filteredAllFreelancers}
            isLoading={isLoading}
            isFetching={isFetching}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            scrollY={scrollY}
            selectedCategory={selectedCategory}
            onReported={handleReportedFreelancer}
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
    paddingBottom: 12,
    backgroundColor: 'white',
  },
});
