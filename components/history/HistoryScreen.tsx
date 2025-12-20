import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';


import PublicWorkHistoryList from './PublicWorkHistoryList';
import FreelancerHistoryList from './FreelancerHistoryList';
import Header_back from 'components/ui/Header_back';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { usegetAllMyWork, useGetHiredFreelancers } from 'hooks/usePublicWork';
import JobListItem from 'skeletonScreens/JobListItem';
import { HistoryNoResult } from './HistoryNoResult';
import { useTranslation } from 'react-i18next';


// const TABS = ['Public works', 'Freelancer', 'Accommodation', 'Driver', 'Company'] as const;
// type TabType = typeof TABS[number];
const TAB_KEYS = ['public_works', 'freelancer'];


// Main component
const HistoryScreen = () => {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState('public_works');
  const { t } = useTranslation();
  // Hooks
  const { data: publicWorkData, isLoading: publicWorkLoading } = usegetAllMyWork();
  const { data: freelancerData, isLoading: freelancerLoading } = useGetHiredFreelancers();

  // Render tab content based on selected tab
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'freelancer':
        if (freelancerLoading) return <JobListItem />;

        if (!freelancerData || freelancerData.length === 0) {
          return (
            <HistoryNoResult />
          );
        }

        return <FreelancerHistoryList data={freelancerData || []} />;

      case 'public_works':
        if (publicWorkLoading || !publicWorkData) return <JobListItem />;

        return <PublicWorkHistoryList data={publicWorkData} />;

      default:
        return <HistoryNoResult />;
    }
  };

  return (
    <ScreenWrapper safeEdges={['top']}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <Header_back
          text={t('history.history')}
          onPress={() => navigation.goBack()}
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
          className="bg-white flex-1 px-4 pt-6"
          showsVerticalScrollIndicator={false}
        >
          {renderTabContent()}
          <View className="h-32" />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default HistoryScreen;