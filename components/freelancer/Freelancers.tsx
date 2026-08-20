import React, { useRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { FreelancerCardSkeleton } from 'skeletonScreens/FreelancerCardSkelenton';
import { NoResults } from 'components/NoResults';
import { useAuth } from 'hooks/useAuth';
import { useTranslation } from 'react-i18next';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { Freelancer } from 'types/profile';

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;


type FreelancersProps = {
  title?: string;
  freelancers: any[];
  isLoading: boolean;
  isFetching?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => Promise<any>;
  scrollY?: any;
  selectedCategory: string;
  onReported?: (userId: string) => void;
  onScroll?: any;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  ListHeaderComponent?: React.ReactElement;
};

// ─── FreelancerCard ───────────────────────────────────────────────────────────
// Isolated memo component so only the card that changes re-renders,
// not the entire list when visibleIds set updates.
const FreelancerCard = React.memo(({
  item,
  isVisible,
  onPress,
  t,
}: {
  item: any;
  isVisible: boolean;
  onPress: (userId: string) => void;
  t: any;
}) => {
  const handlePress = useCallback(() => onPress(item._id), [item._id, onPress]);

  return (
  <Pressable
    onPress={handlePress}
    android_ripple={{ color: 'rgba(0,0,0,0.05)', borderless: false }}
    className="w-[49.5%] bg-white rounded-lg mb-1 border border-border overflow-hidden"
  >
    {item.videoPromote ? (
      // ✅ Pass onPress into VDOPromote so the Pressable overlay inside it
      // sits above the TextureView in Z-order and fires before Android's
      // native surface steals the touch event.
      <VDOPromote_free_profile
        video={item.videoPromote}
        poster={item.bannerImage}
        context="home"
        maxActive={4}
        isVisible={isVisible}
        onPress={handlePress}
      />
    ) : (
      <Image
        source={{ uri: `${IMAGE_BASE}${item.bannerImage || ''}` }}
        className="w-full h-64 object-cover"
        resizeMode="cover"
      />
    )}
    <View className="p-3 space-y-2">
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center">
          <FontAwesome name="star" size={12} color="#facc15" />
          <Text className="ml-1 text-caption font-medium text-warning">
            {item.totalStartRate || 0}
          </Text>
        </View>
        <View className="p-1 bg-blue-50 rounded-full flex-row">
          <Text className="text-caption text-warning">{item.hourlyRateCurrency}</Text>
          <Text className="text-caption font-semibold text-primary ml-2">
            {new Intl.NumberFormat().format(item.hourlyRate)}
          </Text>
          <Text className="text-caption text-primary" numberOfLines={1}>
            /
            {item?.rateType === 'PER_HOUR' && t('kyc.step3.rateType.perHour')}
            {item?.rateType === 'PER_DAY' && t('kyc.step3.rateType.perDay')}
            {item?.rateType === 'PER_JOB' && t('kyc.step3.rateType.perJob')}
          </Text>
        </View>
      </View>
      <Text className="text-body text-text" numberOfLines={1}>{item.jobTitle}</Text>
      {item.address && (
        <View className="flex-row items-end">
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <View>
            <Text className="text-caption text-textSecondary" numberOfLines={1}>
              {item.address.village}, {item.address.district}, {item.address.province}
            </Text>
          </View>
        </View>
      )}
    </View>
  </Pressable>
  );
});

export default function Freelancers({
  title,
  freelancers,
  isLoading,
  isFetching,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  selectedCategory,
  onReported,
  onScroll,
  isRefreshing,
  onRefresh,
  ListHeaderComponent,
}: FreelancersProps) {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const isLoadingMoreRef = useRef(false);
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [visibleVideoIds, setVisibleVideoIds] = useState<ReadonlySet<string>>(() => new Set());

  // FlatList calculates visibility natively. Updating this set only when a
  // card crosses the threshold avoids the measureInWindow bridge work that was
  // occurring on every scroll frame.
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const next = new Set<string>();
    for (const viewable of viewableItems) {
      if (!viewable.isViewable || !viewable.item?.videoPromote) continue;
      next.add(viewable.item._id);
      if (next.size === 4) break;
    }
    setVisibleVideoIds((current) => {
      if (current.size === next.size && [...current].every((id) => next.has(id))) {
        return current;
      }
      return next;
    });
  }).current;

  const viewabilityConfig = useRef({
    // A card must be completely inside the list viewport before it can play.
    // As the top row becomes partly hidden, it pauses and only fully visible
    // middle cards remain active.
    itemVisiblePercentThreshold: 100,
    minimumViewTime: 150,
  }).current;

  const handleNavigate = useCallback(
    (item_id: string) => {
      if (isAuthenticated && user?._id === item_id) {
        navigation.navigate('AuthFreelancerProfile', { userId: item_id });
      } else {
        // ✅ Never pass functions as navigation params — causes serialization
        // stall and broken/slow navigation
        navigation.navigate('FreelancerProfile', { userId: item_id });
      }
    },
    [isAuthenticated, user?._id, navigation]
  );

  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    fetchNextPage?.().finally(() => {
      isLoadingMoreRef.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ✅ renderItem only re-creates when handleNavigate or t change — cards no
  // longer re-render on every scroll tick (played state comes from the shared
  // VideoPlaybackProvider, not from this list's state).
  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <FreelancerCard
        item={item}
        isVisible={visibleVideoIds.has(item._id)}
        onPress={handleNavigate}
        t={t}
      />
    ),
    [visibleVideoIds, handleNavigate, t]
  );

  const listHeader = useMemo(() => (
    <>
      {ListHeaderComponent}
      <View className="flex-row justify-between items-center px-2 mt-4 mb-2">
        <Text className="text-body font-bold px-2">{title}</Text>
        <View className="flex-row justify-between items-center px-1 mb-2">
          {selectedCategory === 'All' && (
            
          <Pressable onPress={() => navigation.navigate('TopFreelancerList')}>
            <Text className="text-body px-2 text-primary underline">{t('home.see_all')}</Text>
          </Pressable>
          )}
        </View>
      </View>
      {isLoading && selectedCategory !== 'All' && <LoadingScreen />}
      {isLoading && selectedCategory === 'All' && (
        <View className="px-2 mb-24">
          <View className="flex-row gap-1">
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
          </View>
          <View className="flex-row gap-1">
            <FreelancerCardSkeleton />
            <FreelancerCardSkeleton />
          </View>
        </View>
      )}
    </>
  ), [ListHeaderComponent, title, isLoading, selectedCategory]);

  const listEmpty = useMemo(() => (
    !isLoading ? (
      <NoResults
        title={t('freelancer_profile.no_freelancer_found')}
        subtitle={t('freelancer_profile.search_another_key')}
      />
    ) : null
  ), [isLoading, t]);

  const listFooter = useMemo(() => (
    <>
      {isFetchingNextPage && (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="text-caption text-textSecondary mt-2">
            {t('home.loading_more') || 'Loading more...'}
          </Text>
        </View>
      )}
      {!hasNextPage && freelancers.length > 0 && !isFetching && (
        <View className="py-6 items-center">
          <Text className="text-caption text-textSecondary">
            {t('home.nomore_freelancers') || 'No more freelancers'}
          </Text>
        </View>
      )}
      {isFetching && !isLoading && !isFetchingNextPage && (
        <View className="py-2 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
    </>
  ), [isFetchingNextPage, hasNextPage, freelancers.length, isFetching, isLoading, t]);

  return (
    <FlatList
      key="freelancer-grid"
      data={freelancers}
      numColumns={2}
      keyExtractor={(item, index) => `${item._id}-${index}`}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      ListFooterComponent={listFooter}
      columnWrapperStyle={{ justifyContent: 'space-between', gap: 1, paddingHorizontal: 4 }}
      contentContainerStyle={{ paddingBottom: 32 }}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      onScroll={onScroll}
      scrollEventThrottle={16}
      extraData={visibleVideoIds}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      // Reduce offscreen rendering to lower memory pressure (videos + images)
      windowSize={3}
      maxToRenderPerBatch={4}
      initialNumToRender={4}
      removeClippedSubviews={true}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing ?? false}
          onRefresh={onRefresh}
          colors={['#3B82F6']}
          tintColor="#3B82F6"
        />
      }
    />
  );
}
