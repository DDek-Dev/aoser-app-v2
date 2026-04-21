import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import PublicWorkHistoryList from './PublicWorkHistoryList';
import FreelancerHistoryList from './FreelancerHistoryList';
import Header_back from 'components/ui/Header_back';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useGetAllMyWorkInfinite, useGetHiredFreelancers } from 'hooks/usePublicWork';
import JobListItem from 'skeletonScreens/JobListItem';
import { HistoryNoResult } from './HistoryNoResult';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { Job } from 'types';

const PAGE_SIZE = 15;
const LOAD_MORE_THRESHOLD_PX = 180;

const TAB_KEYS = ['public_works', 'freelancer'] as const;
type TabKey = (typeof TAB_KEYS)[number];
type PublicWorkStatusFilter = 'ALL' | Job['workStatus'];

const PUBLIC_WORK_STATUS_I18N_KEY: Record<Job['workStatus'], string> = {
  PUBLISHED: 'published',
  PRIVATE: 'private',
  ASSIGNED_WORKER: 'assigned',
  ASSIGNED_AWAIT_PAYMENT: 'awaiting_payment',
  DOING: 'in_progress',
  AWAITING_COMPLETED: 'pending_review',
  COMPLETED: 'completed',
  DELAY: 'delayed',
};

const PUBLIC_WORK_STATUS_FILTERS: PublicWorkStatusFilter[] = [
  'ALL',
  'PUBLISHED',
  'ASSIGNED_WORKER',
  'ASSIGNED_AWAIT_PAYMENT',
  'DOING',
  'AWAITING_COMPLETED',
  'COMPLETED',
  'DELAY',
];

const HistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  const [selectedTab, setSelectedTab] = useState<TabKey>('public_works');
  const [publicWorkStatusFilter, setPublicWorkStatusFilter] = useState<PublicWorkStatusFilter>('ALL');
  const { t } = useTranslation();

  const {
    data: publicWorkPages,
    isLoading: publicWorkLoading,
    refetch: refetchAllWork,
    isRefetching: isRefetchingAllWork,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetAllMyWorkInfinite(PAGE_SIZE);

  const {
    data: freelancerData,
    isLoading: freelancerLoading,
    refetch: refetchFreelancer,
    isRefetching: isRefetchingFreelancer,
  } = useGetHiredFreelancers();

  const publicWorkData = useMemo(
    () => publicWorkPages?.pages?.flat?.() ?? [],
    [publicWorkPages]
  );

  const filteredPublicWorkData = useMemo(() => {
    if (!Array.isArray(publicWorkData)) return [];
    if (publicWorkStatusFilter === 'ALL') return publicWorkData;
    return publicWorkData.filter((job) => job.workStatus === publicWorkStatusFilter);
  }, [publicWorkData, publicWorkStatusFilter]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (selectedTab !== 'public_works') return;
      if (!hasNextPage || isFetchingNextPage) return;

      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom =
        contentSize.height - (layoutMeasurement.height + contentOffset.y);

      if (distanceFromBottom <= LOAD_MORE_THRESHOLD_PX) {
        fetchNextPage();
      }
    },
    [selectedTab, hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleRefresh = useCallback(() => {
    if (selectedTab === 'freelancer') return refetchFreelancer();
    return refetchAllWork();
  }, [selectedTab, refetchAllWork, refetchFreelancer]);

  const statusFilterLabel = useCallback(
    (filterId: PublicWorkStatusFilter) => {
      if (filterId === 'ALL') return t('categoryTabs.all');
      return t(`postWork.status.${PUBLIC_WORK_STATUS_I18N_KEY[filterId]}`);
    },
    [t]
  );

  return (
    <ScreenWrapper safeEdges={['top']}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <Header_back
          text={t('profile.history')}
          onPress={() => navigation.popToTop()}
          iconColor="#3B82F6"
          backgroundColor="bg-surface"
        />

        {/* Tabs */}
        <View className="bg-primary px-1 py-4 mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {TAB_KEYS.map((tabKey) => (
              <TouchableOpacity
                key={tabKey}
                onPress={() => setSelectedTab(tabKey)}
                className={`flex-1 py-2 px-6 space-x-4 rounded-full items-center ${
                  selectedTab === tabKey ? 'bg-surface' : ''
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedTab === tabKey ? 'text-primary' : 'text-surface'
                  }`}
                >
                  {t(`favorites.${tabKey}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Status filter — only visible on public_works tab */}
        {selectedTab === 'public_works' && (
          <View className="bg-white px-4 pb-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
            >
              {PUBLIC_WORK_STATUS_FILTERS.map((filterId) => {
                const isActive = filterId === publicWorkStatusFilter;
                return (
                  <Pressable
                    key={filterId}
                    onPress={() => setPublicWorkStatusFilter(filterId)}
                    className={`px-3 py-2 rounded-full border ${
                      isActive ? 'bg-primary border-primary' : 'bg-surface border-border'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        isActive ? 'text-white' : 'text-textSecondary'
                      }`}
                    >
                      {statusFilterLabel(filterId)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Content — both tabs stay mounted, toggled via display to avoid remount */}
        <ScrollView
          className="bg-white flex-1 px-2"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={
                selectedTab === 'public_works' ? isRefetchingAllWork : isRefetchingFreelancer
              }
              onRefresh={handleRefresh}
              colors={['#2B68F2']}
              tintColor="#2B68F2"
              title={t('works.error.refresh')}
            />
          }
        >
          {/* Public Works Tab */}
          <View style={{ display: selectedTab === 'public_works' ? 'flex' : 'none' }}>
            {publicWorkLoading ? (
              <JobListItem />
            ) : publicWorkData.length === 0 ? (
              <HistoryNoResult
                title={t('history.history_no_result.no_history')}
                desc={t('history.history_no_result.items_will_appear_here')}
              />
            ) : filteredPublicWorkData.length === 0 ? (
              <View className="py-2">
                <HistoryNoResult
                  title={t('history.history_no_result.no_history')}
                  desc={t('history.history_no_result.items_will_appear_here')}
                />
                {hasNextPage && (
                  <Pressable
                    onPress={() => fetchNextPage()}
                    className="mt-4 bg-primary px-6 py-3 rounded-full self-center"
                  >
                    <Text className="text-white font-semibold">Load more</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <PublicWorkHistoryList data={filteredPublicWorkData} />
            )}

            {isFetchingNextPage && (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#2B68F2" />
              </View>
            )}
          </View>

          {/* Freelancer Tab */}
          <View style={{ display: selectedTab === 'freelancer' ? 'flex' : 'none' }}>
            {freelancerLoading || !freelancerData ? (
              <JobListItem />
            ) : freelancerData.length === 0 ? (
              <HistoryNoResult
                title={t('history.history_no_result.no_history_freelancer')}
                desc={t('history.history_no_result.items_will_appear_here_freelancer')}
              />
            ) : (
              <FreelancerHistoryList data={freelancerData} />
            )}
          </View>

          <View className="h-32" />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default HistoryScreen;
