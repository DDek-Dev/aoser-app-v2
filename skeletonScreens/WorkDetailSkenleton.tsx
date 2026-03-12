import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Animated, TouchableOpacity, Text } from 'react-native';
import { FreelancerStackParamList } from 'types/navigation';

const WorkDetailSkenleton = () => {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const { t } = useTranslation();

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.3,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <View className="flex-1 bg-white">
            {/* Custom Header Placeholder */}
            <View className="bg-primary px-4 pt-12 flex-row items-end pb-4">

                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className='mr-4'>
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-white font-semibold text-subheading">{t('workDetail.work_detail')}</Text>
                        <Text className="text-white text-caption opacity-80">{t('workDetail.look_all_details')}</Text>
                    </View>
                </View>
                
            </View>

            
            <View className="p-4">
                {/* Main Card */}
                <View className="border border-gray-100 rounded-3xl p-5 bg-white shadow-sm">
                    {/* Header of Card: Dot and Tag */}
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="flex-row items-center">
                            <Animated.View style={{ opacity: pulseAnim }} className="w-3 h-3 bg-blue-300 rounded-full mr-2" />
                            <Animated.View style={{ opacity: pulseAnim }} className="h-4 w-16 bg-gray-200 rounded" />
                        </View>
                        <Animated.View style={{ opacity: pulseAnim }} className="h-8 w-20 bg-blue-100 rounded-full" />
                    </View>

                    {/* Title Placeholder */}
                    <Animated.View style={{ opacity: pulseAnim }} className="h-6 w-1/2 bg-gray-300 rounded mb-6" />

                    {/* Section: Description */}
                    <Animated.View style={{ opacity: pulseAnim }} className="h-4 w-24 bg-gray-300 rounded mb-2" />
                    <Animated.View style={{ opacity: pulseAnim }} className="h-12 w-full bg-gray-100 rounded-xl mb-6" />

                    {/* Price Card Placeholder */}
                    <View className="border border-warning bg-yellow-50/30 rounded-2xl p-4 flex-row items-center justify-between mb-6">
                        <View className="flex-row items-center">
                            <Animated.View style={{ opacity: pulseAnim }} className="w-10 h-10 bg-yellow-200 rounded-lg mr-3" />
                            <View>
                                <Animated.View style={{ opacity: pulseAnim }} className="h-3 w-16 bg-gray-200 rounded mb-1" />
                                <Animated.View style={{ opacity: pulseAnim }} className="h-5 w-24 bg-gray-300 rounded" />
                            </View>
                        </View>
                        <Animated.View style={{ opacity: pulseAnim }} className="w-8 h-8 bg-gray-200 rounded-full" />
                    </View>

                    {/* Date/Time Section */}
                    <Animated.View style={{ opacity: pulseAnim }} className="h-5 w-32 bg-gray-300 rounded mb-4" />

                    {/* Start Date */}
                    <View className="flex-row items-center mb-4">
                        <Animated.View style={{ opacity: pulseAnim }} className="w-10 h-10 bg-green-100 rounded-full mr-3" />
                        <View>
                            <Animated.View style={{ opacity: pulseAnim }} className="h-3 w-12 bg-gray-200 rounded mb-1" />
                            <Animated.View style={{ opacity: pulseAnim }} className="h-4 w-40 bg-gray-300 rounded" />
                        </View>
                    </View>

                    {/* End Date */}
                    <View className="flex-row items-center">
                        <Animated.View style={{ opacity: pulseAnim }} className="w-10 h-10 bg-red-100 rounded-full mr-3" />
                        <View>
                            <Animated.View style={{ opacity: pulseAnim }} className="h-3 w-12 bg-gray-200 rounded mb-1" />
                            <Animated.View style={{ opacity: pulseAnim }} className="h-4 w-32 bg-gray-300 rounded" />
                        </View>
                    </View>
                </View>
            </View>

            {/* Fixed Bottom Button Placeholder */}
            <View className="absolute bottom-3 left-0 right-0 px-4 flex-row items-center gap-4">
                <Animated.View style={{ opacity: pulseAnim }} className="w-14 h-14 bg-gray-200 rounded-2xl" />
                <Animated.View style={{ opacity: pulseAnim }} className="flex-1 h-14 bg-blue-300 rounded-full" />
            </View>
        </View>
    );
};

export default WorkDetailSkenleton;