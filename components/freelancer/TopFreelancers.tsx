import React from 'react';
import { View, Text, Image, ScrollView, Pressable } from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons'; // for star icon
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useNavigation } from '@react-navigation/native';
import { useGetTopfreelancers } from 'hooks/useFreelancer';
import { useAuth } from 'hooks/useAuth';

import VDOPromote_free_profile from 'components/profile/VDOPromote-free-profile';
import { TopFreelancerSkelenton } from 'skeletonScreens/TopFreelancerSkelenton';
import { useTranslation } from 'react-i18next';


const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL

type Props = {
    scrollY?: any;
}

export default function TopFreelancers({ scrollY }: Props) {


    type SearchBarNavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'FreelancerProfile'>;
    const navigation = useNavigation<SearchBarNavigationProp>();


    const { data: freelancers, isLoading, error } = useGetTopfreelancers();
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    if (isLoading || !freelancers) return (

        <View>
            <View className="flex-row justify-between items-center px-1 mb-2">
                <Text className="text-body font-bold mb-2 px-2">{t('home.top_freelancers')}</Text>
            </View>


            <View className='flex-row pl-4'>
                <TopFreelancerSkelenton />
                <TopFreelancerSkelenton />
            </View>

        </View>
    );
    // if (error) return <Text>Error: {error.message}</Text>;

    const handleNavigate = (item_id: string) => {
        if (isAuthenticated && user?._id === item_id) {
            console.log("user in logged in")

            navigation.navigate('AuthFreelancerProfile', { userId: item_id })

        } else {
            console.log("user not logged in")

            navigation.navigate('FreelancerProfile', { userId: item_id })


        }
    }
    return (
        <View className="mt-2">
            <View className="flex-row justify-between items-center px-1 mb-2">
                <Text className="text-body font-bold mb-2 px-2">{t('home.top_freelancers')}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-1">
                {freelancers?.map((item, index) => (

                    <Pressable
                        key={index}
                        onPress={() => handleNavigate(item._id)}
                    >

                        <View
                            key={index}
                            className="w-64 mr-1 bg-white rounded-xl overflow-hidden border border-border"
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
                                            <Text className="ml-1 text-caption font-medium text-yellow-500">{item.starRating}</Text>
                                        </View>

                                    </View>
                                    <View className='p-1 bg-blue-50 rounded-full flex-row'>
                                        <Text className="text-caption text-warning">{item.hourlyRateCurrency}</Text>
                                        <Text className="text-caption font-semibold text-primary ml-2">{item.hourlyRate}</Text>
                                        <Text className="text-caption text-primary">/ {t('freelancer_profile.hour') || 'hour'}</Text>
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
                                            <Text className="text-sm text-textSecondary" numberOfLines={1}>
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
        </View>
    );
}
