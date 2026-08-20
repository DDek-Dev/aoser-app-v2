import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  Image,
  RefreshControl,
  ListRenderItemInfo,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';
import SortByBottomSheet, { getSortDisplayLabel } from 'components/filter/SortByBottomSheet';
import { useGetTopfreelancers } from 'hooks/useFreelancer';
import { useAuth } from 'hooks/useAuth';
import { Freelancer } from 'types/profile';
import { FreelancerStackParamList } from 'types/navigation';
import { NoResults } from 'components/NoResults';
import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { useVideoPlayback } from 'contexts/VideoPlaybackProvider';
import { FreelancerCardSkeleton } from 'skeletonScreens/FreelancerCardSkelenton';

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;

type TopFreelancerNavigationProp = NativeStackNavigationProp<FreelancerStackParamList>;

const getDistanceScore = (freelancer: Freelancer): number | undefined =>
  (freelancer as Freelancer & { distanceScore?: number }).distanceScore;

const sortTopFreelancers = (freelancers: Freelancer[], sortBy: string): Freelancer[] => {
  const sorted = [...freelancers];
  switch (sortBy) {
    case 'price_low_high':
      return sorted.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
    case 'price_high_low':
      return sorted.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
    case 'distance_near_far':
      return sorted.sort(
        (a, b) =>
          (getDistanceScore(a) ?? Number.MAX_SAFE_INTEGER) -
          (getDistanceScore(b) ?? Number.MAX_SAFE_INTEGER)
      );
    case 'distance_far_near':
      return sorted.sort((a, b) => (getDistanceScore(b) ?? -1) - (getDistanceScore(a) ?? -1));
    case 'all':
    default:
      return sorted.sort((a, b) => {
        const starDiff =
          (b.recommendStar || b.starRating || 0) - (a.recommendStar || a.starRating || 0);
        if (starDiff !== 0) return starDiff;
        return (b.starRating || 0) - (a.starRating || 0);
      });
  }
};

// ─── FreelancerCard ───────────────────────────────────────────────────────────
// Isolated memo component so only the card whose props actually changed
// re-renders — not the entire grid every time `visibleIds` updates.
//
// IMPORTANT: `onPress` here is the STABLE `handleProfilePress` reference from
// the parent (not an inline arrow function created inside renderItem). The
// card builds its own per-row callback from `item._id` via useCallback, so
// React.memo's shallow prop comparison actually holds across re-renders.
// Previously `renderItem` was recreated on every `visibleIds` change (which
// fires continuously during scroll), and it created a NEW `() => onPress(id)`
// closure every time — that broke memoization for every visible card on every
// scroll tick, causing them to re-render mid-gesture and intermittently
// swallow taps (worst on this screen because more cards are visible/animating
// at once).
type FreelancerCardProps = {
  item: Freelancer;
  onPress: (userId: string) => void;
  t: (key: string) => string;
};

const FreelancerCard = React.memo(function FreelancerCard({
  item,
  onPress,
  t,
}: FreelancerCardProps) {
  const handlePress = useCallback(() => {
    onPress(item._id);
  }, [onPress, item._id]);

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: 'rgba(0,0,0,0.05)', borderless: false }}
      className="w-[49.5%] mt-1 bg-white rounded-lg m-[1px] border border-border overflow-hidden"
    >
      {item.videoPromote ? (
        // ✅ onPress passed into VDOPromote so its own overlay Pressable
        // sits above the TextureView in Z-order and fires before Android's
        // native surface steals the touch event.
        <VDOPromote_free_profile
          video={item.videoPromote}
          poster={item.bannerImage}
          context="home"
          maxActive={4}
          onPress={handlePress}
        />
      ) : (
        <Image
          source={{ uri: `${IMAGE_BASE}${item.bannerImage || ''}` }}
          className="w-full h-28"
          resizeMode="cover"
        />
      )}
      <View className="p-3 space-y-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <FontAwesome name="star" size={12} color="#facc15" />
            <Text className="ml-1 text-caption font-medium text-yellow-500">
              {item.totalStartRate || 0}
            </Text>
          </View>
          <View className="p-1 bg-blue-50 rounded-full flex-row">
            <Text className="text-caption text-warning">{item.hourlyRateCurrency}</Text>
            <Text className="text-caption font-semibold text-primary ml-2">
              {new Intl.NumberFormat().format(item.hourlyRate || 0)}
            </Text>
            <Text className="text-caption text-primary">
              {' '}
              / {t('freelancer_profile.hour') || 'hour'}
            </Text>
          </View>
        </View>
        <Text className="text-body" numberOfLines={1}>
          {item.jobTitle}
        </Text>
        {item.address && (
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text className="text-sm text-textSecondary flex-1 ml-1" numberOfLines={1}>
              {item.address.district}, {item.address.province}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

export default function TopFreelancerList() {
  const navigation = useNavigation<TopFreelancerNavigationProp>();
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const [isSortVisible, setIsSortVisible] = useState(false);
  const [selectedSort, setSelectedSort] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: topFreelancers = [], isLoading, isFetching, refetch } = useGetTopfreelancers();
    const { markScrolled, pauseAll } = useVideoPlayback();
  const isFocused = useIsFocused();

  // When the screen gains/loses focus, re-evaluate playback or pause everything.
  useEffect(() => {
    if (isFocused) {
      markScrolled();
    } else {
      pauseAll();
    }
  }, [isFocused, markScrolled, pauseAll]);

  const handleScroll = useCallback((event: any) => {
    markScrolled();
  }, [markScrolled]);

  const sortedFreelancers = useMemo(
    () => sortTopFreelancers(topFreelancers, selectedSort),
    [topFreelancers, selectedSort]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  // ✅ Stable reference across renders — this is what makes FreelancerCard's
  // React.memo actually work. Depends only on auth state, not on scroll state.
  const handleProfilePress = useCallback(
    (userId: string) => {
      if (isAuthenticated && user?._id === userId) {
        navigation.navigate('AuthFreelancerProfile', { userId });
        return;
      }
      // ✅ No function params — only serializable data
      navigation.navigate('FreelancerProfile', { userId });
    },
    [isAuthenticated, navigation, user?._id]
  );

  // ✅ renderItem depends only on stable props — the played state comes from
  // the shared VideoPlaybackProvider, so cards do NOT re-render on scroll.
  const renderFreelancerCard = useCallback(
    ({ item }: ListRenderItemInfo<Freelancer>) => (
      <FreelancerCard
        item={item}
        onPress={handleProfilePress}
        t={t}
      />
    ),
    [handleProfilePress, t]
  );

  const keyExtractor = useCallback((item: Freelancer) => item._id, []);

  return (
    <ScreenWrapper safeEdges={['top']} style={{ flex: 1 }}>
      <View className="flex-1 bg-white">
        <View className="bg-surface px-4 py-2 flex-row items-center justify-between border-b border-border">
          <View className="flex-row items-center gap-2">
            <Header_back
              text={t('home.top_freelancers')}
              iconColor="#3B82F6"
              onPress={() => navigation.popToTop()}
            />
          </View>
          <TouchableOpacity
            onPress={() => setIsSortVisible(true)}
            className="flex-row items-center justify-between border border-gray-200 rounded-full px-4 py-2"
          >
            <MaterialIcons name="sort" size={18} color="#666" />
            <Text className="ml-2 text-sm text-gray-700">
              {getSortDisplayLabel(selectedSort, t)}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="mt-2 px-2 mb-24">
            <View className="flex-row gap-1">
              <FreelancerCardSkeleton />
              <FreelancerCardSkeleton />
            </View>
            <View className="flex-row gap-1">
              <FreelancerCardSkeleton />
              <FreelancerCardSkeleton />
            </View>
            <View className="flex-row gap-1">
              <FreelancerCardSkeleton />
              <FreelancerCardSkeleton />
            </View>
          </View>
        ) : (
          <FlatList
            data={sortedFreelancers}
            renderItem={renderFreelancerCard}
            keyExtractor={keyExtractor}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 2,
              paddingBottom: 64,
              flexGrow: 1,
              marginTop: 8,
            }}
            columnWrapperStyle={{ gap: 1 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            windowSize={3}
            maxToRenderPerBatch={4}
            initialNumToRender={4}
            removeClippedSubviews
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing || isFetching}
                onRefresh={handleRefresh}
                colors={['#3B82F6']}
                tintColor="#3B82F6"
                title={t('home.pull_to_refresh') || 'Pull to refresh...'}
                titleColor="#666"
              />
            }
            ListEmptyComponent={
              <NoResults
                title={t('freelancer_profile.no_freelancer_found')}
                subtitle={t('freelancer_profile.search_another_key')}
              />
            }
          />
        )}
      </View>

      <SortByBottomSheet
        visible={isSortVisible}
        onClose={() => setIsSortVisible(false)}
        selected={selectedSort}
        onSelect={setSelectedSort}
      />
    </ScreenWrapper>
  );
}
