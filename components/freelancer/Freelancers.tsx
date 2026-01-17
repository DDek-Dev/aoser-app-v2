import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { FreelancerCardSkeleton } from 'skeletonScreens/FreelancerCardSkelenton';
import { NoResults } from 'components/NoResults';
import { useAuth } from 'hooks/useAuth';
import { useTranslation } from 'react-i18next';

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;

type FreelancersProps = {
    title?: string;
    freelancers: any[]; // Pass filtered data from parent
    isLoading: boolean;
    hasNextPage?: boolean;
    isFetchingNextPage?: boolean;
    fetchNextPage?: () =>  Promise<any>;
    scrollY?: any;
};

export default function Freelancers({ 
    title, 
    freelancers,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    scrollY 
}: FreelancersProps) {
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const containerRef = useRef<View>(null);
    const hasTriggeredLoad = useRef(false);
    const { user, isAuthenticated } = useAuth();
    const { t } = useTranslation();

    // Auto-load more when scrolling near bottom
    useEffect(() => {
        if (!scrollY || !containerRef.current || !fetchNextPage) return;

        const listener = scrollY.addListener(({ value }: { value: number }) => {
            containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
                const threshold = 200;
                const isNearBottom = value > (pageY + height - threshold);

                if (isNearBottom && hasNextPage && !isFetchingNextPage && !hasTriggeredLoad.current) {
                    hasTriggeredLoad.current = true;
                    fetchNextPage().finally(() => {
                        setTimeout(() => {
                            hasTriggeredLoad.current = false;
                        }, 1000);
                    });
                }
            });
        });

        return () => {
            scrollY.removeListener(listener);
        };
    }, [scrollY, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleNavigate = (item_id: string) => {
        if (isAuthenticated && user?._id === item_id) {
            navigation.navigate('AuthFreelancerProfile', { userId: item_id });
        } else {
            navigation.navigate('FreelancerProfile', { userId: item_id });
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <View className="mt-6 px-4 mb-24">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-body font-bold mb-2">{title}</Text>
                </View>
                <View className='flex-row gap-4'>
                    <FreelancerCardSkeleton />
                    <FreelancerCardSkeleton />
                </View>
                <View className='flex-row gap-4'>
                    <FreelancerCardSkeleton />
                </View>
            </View>
        );
    }

    // No results state
    if (freelancers.length === 0) {
        return <NoResults title={t('freelancer_profile.no_freelancer_found')} subtitle={t('freelancer_profile.search_another_key')} />;
    }

    // Main render
    return (
        <View ref={containerRef} className="mt-6 px-4">
            <View className="flex-row justify-between items-center mb-2">
                <Text className="text-body font-bold mb-2">{title}</Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
                {freelancers.map((item, index) => (
                    <Pressable
                        onPress={() => handleNavigate(item._id)}
                        key={`${item._id}-${index}`}
                        className="w-[48%] bg-white rounded-2xl mb-3 border border-border overflow-hidden"
                    >
                        {item.videoPromote !== null ? (
                            <VDOPromote_free_profile video={item.videoPromote} />
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

                            <Text className="text-caption text-textSecondary" numberOfLines={2}>
                                {item.customerExpect}
                            </Text>
                        </View>
                    </Pressable>
                ))}
            </View>

            {/* Loading more indicator */}
            {isFetchingNextPage && (
                <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text className="text-caption text-textSecondary mt-2">Loading more...</Text>
                </View>
            )}

            {/* No more data message */}
            {!hasNextPage && freelancers.length > 0 && (
                <View className="py-4 items-center">
                    <Text className="text-caption text-textSecondary">{t('home.nomore_freelancers')}</Text>
                </View>
            )}
        </View>
    );
}