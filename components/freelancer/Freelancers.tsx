import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
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
  selectedCategory: string
};

export default function Freelancers({
  title,
  freelancers,
  isLoading,
  isFetching,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  selectedCategory,
  scrollY,
}: FreelancersProps) {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const containerRef = useRef<View>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingMoreRef = useRef(false);
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Optimized scroll handler with debouncing
  useEffect(() => {
    if (!scrollY || !containerRef.current || !fetchNextPage || !hasNextPage) return;

    const listener = scrollY.addListener(({ value }: { value: number }) => {
      if (isLoadingMoreRef.current || isFetchingNextPage) return;

      containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
        const LOAD_MORE_THRESHOLD = 300;
        const contentBottom = pageY + height;
        const scrollBottom = value + 1000; // Approximate screen height
        const isNearBottom = scrollBottom > contentBottom - LOAD_MORE_THRESHOLD;

        if (isNearBottom && hasNextPage && !isFetchingNextPage) {
          // Clear any existing timeout
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
          }

          // Debounce the load more call
          loadingTimeoutRef.current = setTimeout(() => {
            if (!isLoadingMoreRef.current) {
              isLoadingMoreRef.current = true;
              fetchNextPage()
                .finally(() => {
                  isLoadingMoreRef.current = false;
                });
            }
          }, 300);
        }
      });
    });

    return () => {
      scrollY.removeListener(listener);
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [scrollY, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNavigate = useCallback((item_id: string) => {
    if (isAuthenticated && user?._id === item_id) {
      navigation.navigate('AuthFreelancerProfile', { userId: item_id });
    } else {
      navigation.navigate('FreelancerProfile', { userId: item_id });
    }
  }, [isAuthenticated, user?._id, navigation]);

  // Initial loading state
  if (isLoading && selectedCategory !== "All") {
    return (

      <View className=''>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-body font-bold mb-2">{title}</Text>
        </View>
        <LoadingScreen />
      </View>
    )
  }
  if (isLoading && selectedCategory === "All") {
    return (
      <View className="mt-6 px-2 mb-24">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-body font-bold mb-2 px-2">{title}</Text>
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
    )
  }

  // No results state
  if (freelancers.length === 0 && !isFetching) {
    return (
      <NoResults
        title={t('freelancer_profile.no_freelancer_found')}
        subtitle={t('freelancer_profile.search_another_key')}
      />
    );
  }

  // Main render
  return (
    <View ref={containerRef} className="mt-4 px-1 pb-8">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-body font-bold mb-2 px-2">{title}</Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-[1px]">
        {freelancers.map((item, index) => (
          <Pressable
            onPress={() => handleNavigate(item._id)}
            key={`${item._id}-${index}`}
            className="w-[49.5%] bg-white rounded-lg mb-1 border border-border overflow-hidden"
          >
            {item.videoPromote !== null ? (
              <VDOPromote_free_profile video={item.videoPromote} context="home" scrollY={scrollY} />
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

                <View className='p-1 bg-blue-50 rounded-full flex-row'>
                  <Text className="text-caption text-warning">{item.hourlyRateCurrency}</Text>
                  <Text className="text-caption font-semibold text-primary ml-2">{new Intl.NumberFormat().format(item.hourlyRate)}</Text>
                  <Text className="text-caption text-primary">/ {t('freelancer_profile.hour') || 'hour'}</Text>
                </View>
              </View>

              <Text className="text-body font-semibold text-text" numberOfLines={1}>
                {item.jobTitle}
              </Text>

              {/* <Text className="text-caption text-textSecondary" numberOfLines={2}>
                {item.address.country}, {item.address.city} 
              </Text> */}
              {item.address &&


                <View className="flex-row items-end">
                  {/* <Text>{t('workDetail.deadline')} : </Text> */}
                  {/* <Text>{t('payment_success.address')}:  </Text> */}
                  <Ionicons name="location-outline" size={18} color="#6B7280" />

                  <View className="">

                    <Text className="text-[12px] text-textSecondary" numberOfLines={1}>
                      {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                      {item.address.village}, {item.address.district}, {item.address.province}
                    </Text>
                  </View>
                </View>
              }
            </View>
          </Pressable>
        ))}
      </View>

      {/* Loading more indicator */}
      {isFetchingNextPage && (
        <View className="py-6 items-center">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="text-caption text-textSecondary mt-2">
            {t('home.loading_more') || 'Loading more...'}
          </Text>
        </View>
      )}

      {/* Background fetching indicator */}
      {isFetching && !isLoading && !isFetchingNextPage && (
        <View className="absolute top-0 right-4">
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}

      {/* No more data message */}
      {!hasNextPage && freelancers.length > 0 && !isFetching && (
        <View className="py-6 items-center">
          <Text className="text-caption text-textSecondary">
            {t('home.nomore_freelancers') || 'No more freelancers'}
          </Text>
        </View>
      )}
    </View>
  );
}
