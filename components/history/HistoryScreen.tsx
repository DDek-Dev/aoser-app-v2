import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';


import PublicWorkHistoryList from './PublicWorkHistoryList';
import FreelancerHistoryList from './FreelancerHistoryList';
import Header_back from 'components/ui/Header_back';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { usegetAllMyWork, useGetHiredFreelancers } from 'hooks/usePublicWork';
import JobListItem from 'skeletonScreens/JobListItem';
import { HistoryNoResult } from './HistoryNoResult';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';


// const TABS = ['Public works', 'Freelancer', 'Accommodation', 'Driver', 'Company'] as const;
// type TabType = typeof TABS[number];
const TAB_KEYS = ['public_works', 'freelancer'];


// Main component
const HistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();


  const [selectedTab, setSelectedTab] = useState('public_works');
  const { t } = useTranslation();
  // Hooks
  const { data: publicWorkData, isLoading: publicWorkLoading, refetch: refetchAllWork, isRefetching: isRefetchingAllWork } = usegetAllMyWork();
  const { data: freelancerData, isLoading: freelancerLoading, refetch: refetchFreelancer, isRefetching: isRefetchingFreelancer } = useGetHiredFreelancers();

  // Render tab content based on selected tab
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'freelancer':
        if (freelancerLoading || !freelancerData) return <JobListItem />;

        if (!freelancerData || freelancerData.length === 0) {
          return (
            <HistoryNoResult title={t('history.history_no_result.no_history_freelancer')} desc={t('history.history_no_result.items_will_appear_here_freelancer')} />

          );
        }

        return <FreelancerHistoryList data={freelancerData || []} />;

      case 'public_works':
        if (publicWorkLoading || !publicWorkData) return <JobListItem />;
        if (!publicWorkData || publicWorkData.length === 0) {
          return (<HistoryNoResult title={t('history.history_no_result.no_history')} desc={t('history.history_no_result.items_will_appear_here')} />)

        }
        return <PublicWorkHistoryList data={publicWorkData} />;



    }
  };

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
        <View className="flex-row justify-between gap-1 bg-primary px-1 py-4 mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {TAB_KEYS.map((tabKey) => (
              <TouchableOpacity
                key={tabKey}
                onPress={() => setSelectedTab(tabKey)}
                className={`flex-1 py-2 px-6 space-x-4 rounded-full items-center ${selectedTab === tabKey ? 'bg-surface' : ''
                  }`}
              >
                <Text
                  className={`text-sm font-medium ${selectedTab === tabKey ? 'text-primary' : 'text-surface'
                    }`}
                >
                  {t(`favorites.${tabKey}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView
          className="bg-white flex-1 px-2 "
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingAllWork || isRefetchingFreelancer}
              onRefresh={refetchAllWork || refetchFreelancer}
              colors={['#2B68F2']}
              tintColor="#2B68F2"
              title={t('works.error.refresh')}
            />
          }
        >
          {renderTabContent()}
          <View className="h-32" />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default HistoryScreen;