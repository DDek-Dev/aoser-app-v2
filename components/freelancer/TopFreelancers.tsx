import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Image, Pressable, useWindowDimensions, FlatList } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from 'hooks/useAuth';
import { Freelancer } from 'types/profile';

import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { useTranslation } from 'react-i18next';
import { FreelancerCardSkeleton } from 'skeletonScreens/FreelancerCardSkelenton';

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;

type Props = {
  scrollY?: any;
  freelancers: Freelancer[];
  isLoading: boolean;
  isFetching?: boolean;
  onReported?: (userId: string) => void;
};

function VideoCard({ item, onPress }: { item: Freelancer; onPress: () => void }) {
  return (
    <VDOPromote_free_profile
      video={item.videoPromote}
      poster={item.bannerImage}
      context="home"
      onPress={onPress}
    />
  );
}

export default function TopFreelancers({
  freelancers,
  isLoading,
  onReported,
}: Props) {
  type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'FreelancerProfile'>;
  const navigation = useNavigation<SearchBarNavigationProp>();
  const { width } = useWindowDimensions();

  const HORIZONTAL_PADDING = 4;
  const GAP = 4;
  const cardWidth = (width - HORIZONTAL_PADDING * 2 - GAP) / 2.04;

  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    setVisibleIds(new Set(viewableItems.map((v: any) => v.item._id)));
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 10,
    minimumViewTime: 100,
  }).current;

  const handleNavigate = useCallback(
    (item_id: string) => {
      if (isAuthenticated && user?._id === item_id) {
        navigation.navigate('AuthFreelancerProfile', { userId: item_id });
      } else {
        navigation.navigate('FreelancerProfile', { userId: item_id });
      }
    },
    [isAuthenticated, user?._id, navigation]
  );

  const renderItem = useCallback(
    ({ item }: { item: Freelancer }) => {
      const navigate = () => handleNavigate(item._id);

      return (
        <Pressable onPress={navigate}>
          <View
            className="bg-white rounded-xl border border-border"
            style={{ width: cardWidth, marginRight: GAP, overflow: 'hidden' }}
          >
            <View style={{ width: '100%', aspectRatio: 4 / 5, overflow: 'hidden' }}>
              {item.videoPromote !== null ? (
                <VideoCard item={item} onPress={navigate} />
              ) : (
                <Image
                  source={{ uri: IMAGE_BASE + item.bannerImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              )}
            </View>
            <View className="p-2 space-y-1">
              <View className="flex-row justify-between">
                <View className="flex-row items-center">
                  <FontAwesome name="star" size={14} color="#facc15" />
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

              <Text className="text-body" numberOfLines={1}>{item.jobTitle}</Text>

              {item.address && (
                <View className="flex-row items-end">
                  <Ionicons name="location-outline" size={18} color="#6B7280" />
                  <View>
                    <Text className="text-[12px] text-textSecondary" numberOfLines={1}>
                      {item.address.village}, {item.address.district}, {item.address.province}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      );
    },
    [cardWidth, handleNavigate, t, visibleIds]
  );

  if (isLoading && freelancers.length === 0) {
    return (
      <View className="mt-2">
        <View className="flex-row justify-between items-center px-1 mb-2">
          <Text className="text-body font-bold mb-2 px-2">{t('home.top_freelancers')}</Text>
        </View>
        <View className="flex-row pl-2 gap-1">
          <FreelancerCardSkeleton />
          <FreelancerCardSkeleton />
        </View>
      </View>
    );
  }

  return (
    <View className="mt-2 overflow-hidden">
      <View className="flex-row justify-between items-center px-1 mb-2">
        <Text className="text-body font-bold mb-2 px-2">{t('home.top_freelancers')}</Text>
        <Pressable onPress={() => navigation.navigate('TopFreelancerList')}>
          <Text className="text-body px-2 text-primary underline">{t('home.see_all')}</Text>
        </Pressable>
      </View>

      <FlatList
        horizontal
        data={freelancers}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={true}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={3}
      />
    </View>
  );
}