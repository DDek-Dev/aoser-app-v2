import { useState } from 'react';
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import FavoriteCardList from './FavoriteCardList';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import PublicWorkCardList from './PublicWorkCardList';
import Header_back from 'components/ui/Header_back';
import { useNavigation } from '@react-navigation/native';
import { useGetAllFavorites } from 'hooks/useFreelancer';
import JobListItem from 'skeletonScreens/JobListItem';
import { FavoriteNoResult } from './FavoriteNoResult';
import { useTranslation } from 'react-i18next';

// Use keys instead of values
const TAB_KEYS = ['public_works', 'freelancer'];
// const TAB_KEYS = ['public_works', 'freelancer', 'accommodation', 'driver', 'company'];

const FavoriteScreen = () => {
    const { t } = useTranslation();
    const [selectedTab, setSelectedTab] = useState('public_works'); // Use key instead of value

    const navigation = useNavigation();
    const { data, isLoading, error, refetch } = useGetAllFavorites();

    const renderTabContent = () => {
        switch (selectedTab) {
            case 'freelancer':
                if (isLoading) return <JobListItem />;

                if (!data || data.length === 0) {
                    return <FavoriteNoResult />;
                }

                return <FavoriteCardList data={data} />;

            case 'public_works':

        
                if (!data || data.length === 0) {
                    return <FavoriteNoResult />;
                }
                return <PublicWorkCardList
                    data={data}
                    refetch={refetch}
                />

            default:
                return <FavoriteNoResult />;
        }
    };

    return (
        <ScreenWrapper safeEdges={['top']}>
            <Header_back
                text={t('favorites.favorites')}
                onPress={() => navigation.goBack()}
                iconColor='#3B82F6'
                backgroundColor='bg-surface'
            />

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

            <ScrollView className="bg-white flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
                {renderTabContent()}
                <View className="h-32" />
            </ScrollView>
        </ScreenWrapper>
    );
};

export default FavoriteScreen;