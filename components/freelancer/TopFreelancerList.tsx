import  { useCallback, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Pressable,
    FlatList,
    Image,
    Animated,
    RefreshControl,
} from 'react-native';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
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
import { FreelancerCardSkeleton } from 'skeletonScreens/FreelancerCardSkelenton';

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;

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
            return sorted.sort((a, b) => (getDistanceScore(a) ?? Number.MAX_SAFE_INTEGER) - (getDistanceScore(b) ?? Number.MAX_SAFE_INTEGER));
        case 'distance_far_near':
            return sorted.sort((a, b) => (getDistanceScore(b) ?? -1) - (getDistanceScore(a) ?? -1));
        case 'all':
        default:
            return sorted.sort((a, b) => {
                const starDiff = (b.recommendStar || b.starRating || 0) - (a.recommendStar || a.starRating || 0);
                if (starDiff !== 0) return starDiff;
                return (b.starRating || 0) - (a.starRating || 0);
            });
    }
};

export default function TopFreelancerList() {
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();

    const [isSortVisible, setIsSortVisible] = useState(false);
    const [selectedSort, setSelectedSort] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const {
        data: topFreelancers = [],
        isLoading,
        isFetching,
        refetch,
    } = useGetTopfreelancers();

    const scrollY = useRef(new Animated.Value(0)).current;

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

    const handleProfilePress = useCallback((userId: string) => {
        if (isAuthenticated && user?._id === userId) {
            navigation.navigate('AuthFreelancerProfile', { userId });
            return;
        }
        navigation.navigate('FreelancerProfile', { userId });
    }, [isAuthenticated, navigation, user?._id]);

    const renderFreelancerCard = useCallback(({ item }: { item: Freelancer }) => (
        <Pressable
            onPress={() => handleProfilePress(item._id)}
            className="w-[49.5%] mt-1 bg-white rounded-lg m-[1px] border border-border overflow-hidden"
        >
            {item.videoPromote ? (
                <VDOPromote_free_profile video={item.videoPromote} context="home" scrollY={scrollY} />
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
                            {item.starRating || 0}
                        </Text>
                    </View>
                    <View className="p-1 bg-blue-50 rounded-full flex-row">
                        <Text className="text-caption text-warning">{item.hourlyRateCurrency}</Text>
                        <Text className="text-caption font-semibold text-primary ml-2">
                            {new Intl.NumberFormat().format(item.hourlyRate || 0)}
                        </Text>
                        <Text className="text-caption text-primary">/ {t('freelancer_profile.hour') || 'hour'}</Text>
                    </View>
                </View>

                <Text className="text-body font-semibold text-text" numberOfLines={1}>
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
    ), [handleProfilePress, scrollY, t]);


    return (
        <ScreenWrapper safeEdges={['top']} style={{ flex: 1 }}>
            <View className="flex-1 bg-white">
                <View className="bg-surface px-4 py-2 flex-row items-center justify-between border-b border-border">
                    <View className="flex-row items-center gap-2">
                        <Header_back text={t('home.top_freelancers')} iconColor="#3B82F6" onPress={() => navigation.popToTop()} />
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
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            paddingHorizontal: 2,
                            paddingBottom: 64,
                            flexGrow: 1,
                            marginTop: 8,
                        }}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: false }
                        )}
                        scrollEventThrottle={16}
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
