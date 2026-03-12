

import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useRecommendedFreelancers } from 'hooks/useFreelancer';
import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { FreelancerCardSkeleton } from 'skeletonScreens/FreelancerCardSkelenton';
import { NoResults } from 'components/NoResults';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from 'hooks/useAuth';
import { useTranslation } from 'react-i18next';

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;

type TopFreelancersProps = {
    serviceType?: string | null;
    title?: string;
    scrollY?: any;
};



export default function FamiliarFreelancers({ title, serviceType, scrollY }: TopFreelancersProps) {
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const containerRef = useRef<View>(null);
    const hasTriggeredLoad = useRef(false);

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useRecommendedFreelancers(serviceType ? serviceType : '');
    const { user, isAuthenticated } = useAuth();

    // Flatten all pages into a single array
    const allFreelancers = data?.pages.flat();

    const { t } = useTranslation();
    // Listen to scroll position and trigger load more
    useEffect(() => {
        if (!scrollY || !containerRef.current) return;

        const listener = scrollY.addListener(({ value }: { value: number }) => {
            // Measure the container position
            containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
                // Calculate if we're near the bottom of this component
                const threshold = 200;
                const isNearBottom = value > (pageY + height - threshold);

                if (isNearBottom && hasNextPage && !isFetchingNextPage && !hasTriggeredLoad.current) {
                    hasTriggeredLoad.current = true;
                    fetchNextPage().finally(() => {
                        // Reset after a delay to prevent rapid triggers
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

    // Loading state
    if (isLoading || !data || error) {
        return (
            <View className="mt-6 px-4 mb-24">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-body font-bold mb-2">{title}</Text>
                </View>
                {/* <View className="flex-row flex-wrap justify-between">
                    {[1, 2, 3, 4, 5].map((_, index) => (
                        <FreelancerCardSkeleton key={index} />
                    ))}
                </View> */}
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

    // No results state - FIXED: Added proper return
    // if (allFreelancers?.length === 0) {
    //     return <NoResults title={`${t('freelancer_profile.no_freelancer_fimiliar')}`} subtitle={`${t('freelancer_profile.no_freelancer_fimiliar_dec')}`} />;
    // }

    const handleNavigate = (item_id: string) => {
        if (isAuthenticated && user?._id === item_id) {
            console.log("user in logged in", item_id)

            navigation.replace('AuthFreelancerProfile', { userId: item_id })

        } else {
            console.log("user not logged in", item_id)

            navigation.replace('FreelancerProfile', { userId: item_id })


        }
    }
    // Main render with data
    return (

        <View >

            <View ref={containerRef} className="mt-6 px-1 ">
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-body font-bold mb-2">{title}</Text>
                </View>

                <View className="flex-row flex-wrap justify-between">
                    {allFreelancers?.map((item, index) => (
                        <Pressable
                            // onPress={() => navigation.navigate('FreelancerProfile', { userId: item._id })}
                            onPress={() => handleNavigate(item._id)}

                            key={`${item._id}-${index}`}
                            className="w-[49.5%] bg-white rounded-xl mb-1 border border-border overflow-hidden"
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

                {/* Show loading indicator at the bottom when fetching next page */}
                {isFetchingNextPage && (
                    <View className="py-4 items-center">
                        <ActivityIndicator size="small" color="#3B82F6" />
                        <Text className="text-caption text-textSecondary mt-2">{t('home.loading_more')}</Text>
                    </View>
                )}

                {/* Show message when there's no more data */}
                {!hasNextPage && allFreelancers && allFreelancers.length > 0 && (
                    <View className="py-4 items-center">
                        <Text className="text-caption text-textSecondary">{t('home.nomore_freelancers')}</Text>
                    </View>
                )}
            </View>

        </View>
    );
}