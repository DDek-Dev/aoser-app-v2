import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useRecommendedFreelancers } from 'hooks/useFreelancer';
import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { FreelancerCardSkeleton } from 'skeletonScreens/FreelancerCardSkelenton';
import { NoResults } from 'components/NoResults';
import { useAuth } from 'hooks/useAuth';
import { useTranslation } from 'react-i18next';

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;

type Props = {
  serviceType?: string | null;
  title?: string;
  scrollY?: any;
  exceptedIds?: string;
};

// ─── Isolated memo card ───────────────────────────────────────────────────────
const FamiliarCard = React.memo(({
  item,
  isVisible,
  onPress,
  t,
}: {
  item: any;
  isVisible: boolean;
  onPress: () => void;
  t: any;
}) => (
  <Pressable
    onPress={onPress}
    android_ripple={{ color: 'rgba(0,0,0,0.05)', borderless: false }}
    className="w-[49.5%] bg-white rounded-xl mb-1 border border-border overflow-hidden"
  >
    {item.videoPromote != null ? (
      <VDOPromote_free_profile
        video={item.videoPromote}
        poster={item.bannerImage}
        context="home"
        isVisible={isVisible}
        onPress={onPress}
      />
    ) : (
      <Image
        source={{ uri: IMAGE_BASE + item.bannerImage }}
        className="w-full h-28"
        resizeMode="cover"
      />
    )}
    <View className="p-3 space-y-2">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <FontAwesome name="star" size={12} color="#facc15" />
          <Text className="ml-1 text-caption font-medium text-yellow-500">
            {item.starRating}
          </Text>
        </View>
        <View className="bg-blue-50 px-2 py-1 rounded-full flex-row items-center">
          <Text className="text-caption text-warning">{item.hourlyRateCurrency}</Text>
          <Text className="text-caption font-semibold text-primary ml-1">
            {item.hourlyRate} /hour
          </Text>
        </View>
      </View>
      <Text className="text-body font-semibold text-text" numberOfLines={1}>
        {item.jobTitle}
      </Text>
      {item.address && (
        <View className="flex-row items-end">
          <Ionicons name="location-outline" size={18} color="#6B7280" />
          <Text className="text-[12px] text-textSecondary ml-1" numberOfLines={1}>
            {item.address.village}, {item.address.district}, {item.address.province}
          </Text>
        </View>
      )}
    </View>
  </Pressable>
));

export default function FamiliarFreelancers({ title, serviceType, exceptedIds }: Props) {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const isLoadingMoreRef = useRef(false);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setVisibleIds(new Set(viewableItems.map((v: any) => v.item._id)));
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRecommendedFreelancers(serviceType ?? '', exceptedIds);

  const allFreelancers = useMemo(
    () => data?.pages.flat() ?? [],
    [data?.pages]
  );

  const handleNavigate = useCallback((item_id: string) => {
    if (isAuthenticated && user?._id === item_id) {
      navigation.replace('AuthFreelancerProfile', { userId: item_id });
    } else {
      navigation.replace('FreelancerProfile', { userId: item_id });
    }
  }, [isAuthenticated, user?._id, navigation]);

  const handleEndReached = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;
    fetchNextPage().finally(() => {
      isLoadingMoreRef.current = false;
    });
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <FamiliarCard
      item={item}
      isVisible={visibleIds.has(item._id)}
      onPress={() => handleNavigate(item._id)}
      t={t}
    />
  ), [visibleIds, handleNavigate, t]);

  const listFooter = useMemo(() => (
    <>
      {isFetchingNextPage && (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="text-caption text-textSecondary mt-2">{t('home.loading_more')}</Text>
        </View>
      )}
      {!hasNextPage && allFreelancers.length > 0 && (
        <View className="py-4 items-center">
          <Text className="text-caption text-textSecondary">{t('home.nomore_freelancers')}</Text>
        </View>
      )}
    </>
  ), [isFetchingNextPage, hasNextPage, allFreelancers.length, t]);

  // Loading state
  if (isLoading || error) {
    return (
      <View className="mt-4 px-4 mb-24">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-body font-bold mb-2">{title}</Text>
        </View>
        <View className="flex-row gap-4">
          <FreelancerCardSkeleton />
          <FreelancerCardSkeleton />
        </View>
        <View className="flex-row gap-4">
          <FreelancerCardSkeleton />
        </View>
      </View>
    );
  }

  // Empty state
  if (!data || allFreelancers.length === 0) {
    return (
      <View className="mt-6 px-1">
        <View className="h-[1px] mb-4 bg-border" />
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-body font-bold mb-2">{title}</Text>
        </View>
        <NoResults
          title={`${t('freelancer_profile.no_freelancer_fimiliar')}`}
          subtitle={`${t('freelancer_profile.no_freelancer_fimiliar_dec')}`}
          isShow={false}
        />
      </View>
    );
  }

  return (
    <View className="mt-4 px-1">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-body font-bold mb-2">{title}</Text>
      </View>

      {/*
        ✅ FlatList instead of .map() + flex-wrap.
        The old approach rendered ALL cards at once with no virtualization.
        FlatList only renders visible cards + a small buffer (windowSize),
        which is critical when each card has a video player.
        Also removes the need for the old scrollY.addListener hack for
        pagination — onEndReached handles it natively and correctly.
      */}
      <FlatList
        data={allFreelancers}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item._id}-${index}`}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', gap: 1 }}
        contentContainerStyle={{ paddingBottom: 16 }}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListFooterComponent={listFooter}
        scrollEnabled={false}
        // scrollEnabled=false because this FlatList lives inside a parent
        // ScrollView/FlatList on the profile screen — let the parent handle scroll
        windowSize={5}
        maxToRenderPerBatch={6}
        initialNumToRender={6}
      />
    </View>
  );
}