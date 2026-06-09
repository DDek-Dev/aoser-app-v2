import React from 'react';
import { View, Text, Image, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons'; // for star icon
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from 'hooks/useAuth';
import { Freelancer } from 'types/profile';

import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { useTranslation } from 'react-i18next';
import { FreelancerCardSkeleton } from 'skeletonScreens/FreelancerCardSkelenton';
import {formatTotalRate} from '../../utils/dateFormatter';


const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL

type Props = {
    scrollY?: any;
    freelancers: Freelancer[];
    isLoading: boolean;
    isFetching?: boolean;
    onReported?: (userId: string) => void;

}

export default function TopFreelancers({
    scrollY,
    freelancers,
    isLoading,
    isFetching,
    onReported,

}: Props) {


    type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'FreelancerProfile'>;
    const navigation = useNavigation<SearchBarNavigationProp>();
    const { width } = useWindowDimensions();
    const HORIZONTAL_PADDING = 0;
    const GAP = 4;
    const cardWidth = (width - HORIZONTAL_PADDING * 2 - GAP) / 2.04


    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    if (isLoading && freelancers.length === 0) {
        return (
            <View className="mt-2">
                <View className="flex-row justify-between items-center px-1 mb-2">
                    <Text className="text-body font-bold mb-2 px-2">{t('home.top_freelancers')}</Text>
                </View>
                <View className='flex-row pl-2 gap-1'>
                    <FreelancerCardSkeleton />
                    <FreelancerCardSkeleton />

                </View>
            </View>
        );
    }



    // if (error) return <Text>Error: {error.message}</Text>;

    const handleNavigate = (item_id: string) => {
        if (isAuthenticated && user?._id === item_id) {
            console.log("user in logged in")

            navigation.navigate('AuthFreelancerProfile', { userId: item_id })

        } else {
            console.log("user not logged in")

            navigation.navigate('FreelancerProfile', { userId: item_id, onReported })
        }
    }
    return (
        <View className="mt-2">
            <View className="flex-row justify-between items-center px-1 mb-2">
                <Text className="text-body font-bold mb-2 px-2">{t('home.top_freelancers')}</Text>
                <Pressable onPress={() => navigation.navigate('TopFreelancerList')}>
                    <Text className="text-body  px-2 text-primary underline">{t("home.see_all")}</Text>
                </Pressable>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-1" contentContainerStyle={{ paddingHorizontal: HORIZONTAL_PADDING, gap: GAP }}>
                {freelancers.map((item) => (

                    <Pressable
                        key={item._id}
                        onPress={() => handleNavigate(item._id)}
                    >

                        <View
                            className="bg-white rounded-xl overflow-hidden  border border-border"
                            style={{ width: cardWidth }}
                        >
                            {item.videoPromote !== null ?
                                <VDOPromote_free_profile video={item.videoPromote} context="home" scrollY={scrollY} />
                                :
                                <Image source={{ uri: IMAGE_BASE + item.bannerImage }} className="w-full h-28" resizeMode="cover" />}
                            <View className="p-2 space-y-1">
                                <View className='flex-row justify-between'>
                                    <View className='flex-row gap-2'>

                                        <View className="flex-row items-center ">
                                            <FontAwesome name="star" size={14} color="#facc15" />
                                            <Text className="ml-1 text-caption font-medium text-warning">{item.totalStartRate || 0}</Text>
                                            
                                        </View>

                                    </View>
                                    <View className='p-1 bg-blue-50 rounded-full flex-row'>
                                        <Text className="text-caption text-warning">{item.hourlyRateCurrency}</Text>
                                        <Text className="text-caption font-semibold text-primary ml-2">{new Intl.NumberFormat().format(item.hourlyRate)}</Text>
                                        <Text className="text-caption text-primary" numberOfLines={1}>/
                                            {item?.rateType === 'PER_HOUR' && t('kyc.step3.rateType.perHour')}
                                            {item?.rateType === 'PER_DAY' && t('kyc.step3.rateType.perDay')}
                                            {item?.rateType === 'PER_JOB' && t('kyc.step3.rateType.perJob')}
                                        </Text>
                                    </View>
                                </View>
                                <Text className="text-body font-semibold" numberOfLines={1}>{item.jobTitle}</Text>

                                {/* <Text className="text-caption text-gray-600" numberOfLines={2}>
                                    {item.customerExpect}
                                </Text> */}
                                {item.address &&
                                    <View className="flex-row items-end">
                                        {/* <Text>{t('workDetail.deadline')} : </Text> */}
                                        {/* <Text>{t('payment_success.address')}:  </Text> */}
                                        <Ionicons name="location-outline" size={18} color="#6B7280" />

                                        <View className="">
                                            <Text className="text-[12px] text-textSecondary" numberOfLines={1}>
                                                {item.address.village}, {item.address.district}, {item.address.province}
                                            </Text>
                                        </View>
                                    </View>
                                }
                            </View>
                        </View>
                    </Pressable>
                ))}


            </ScrollView>
            {/* {isFetching && (
                <View className="px-3 pt-1 pb-2">
                    <Text className="text-caption text-textSecondary">
                        {t('home.refreshing') || 'Refreshing...'}
                    </Text>
                </View>
            )} */}
        </View>
    );
}
