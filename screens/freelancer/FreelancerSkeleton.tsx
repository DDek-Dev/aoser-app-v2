import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Header_back from 'components/ui/Header_back';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Animated } from 'react-native';
import { FreelancerStackParamList } from 'types/navigation';

const FreelancerSkeleton = () => {
    const pulseAnim = useRef(new Animated.Value(0.3)).current;
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

    const { t } = useTranslation()
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
        <View >
            <Header_back
                text={t('freelancer_profile.header_back_text', 'Profile')}
                onPress={() => navigation.goBack()}
                iconColor="#3B82F6"
                backgroundColor="bg-surface"
            />


            {/* Header Image Area */}
            <Animated.View
                style={{ opacity: pulseAnim }}
                className="w-full h-48 bg-gray-300 "
            />


            <View className="px-4 -mt-8" >
                {/* Profile Image Circle */}
                <View
                    // style={{ opacity: pulseAnim }}
                    className="w-24 h-24  rounded-full  border-4 border-white bg-gray-300"
                />
                {/* Name and Tagline */}
                <Animated.View
                    style={{ opacity: pulseAnim }}
                    className="mt-4 h-6 w-32 bg-gray-300 rounded"
                />
                <Animated.View
                    style={{ opacity: pulseAnim }}
                    className="mt-2 h-4 w-48 bg-gray-200 rounded"
                />

                {/* Rating Row */}
                <Animated.View
                    style={{ opacity: pulseAnim }}
                    className="mt-2 h-4 w-24 bg-gray-200 rounded"
                />

                {/* Action Buttons Row */}
                <View className="flex-row items-center mt-6 space-x-3">
                    <Animated.View
                        style={{ opacity: pulseAnim }}
                        className="flex-1 h-14 bg-gray-300 rounded-full"
                    />
                    <Animated.View
                        style={{ opacity: pulseAnim }}
                        className="w-14 h-14 bg-gray-300 rounded-full"
                    />
                </View>

                {/* Stats Section (Three Columns) */}
                <View className="flex-row mt-8 border-t border-b border-gray-100 py-4">
                    {[1, 2, 3].map((item) => (
                        <View key={item} className="flex-1 items-center border-r border-gray-100 last:border-r-0">
                            <Animated.View style={{ opacity: pulseAnim }} className="h-5 w-5 bg-gray-300 rounded mb-2" />
                            <Animated.View style={{ opacity: pulseAnim }} className="h-4 w-10 bg-gray-200 rounded mb-1" />
                            <Animated.View style={{ opacity: pulseAnim }} className="h-3 w-16 bg-gray-100 rounded" />
                        </View>
                    ))}
                </View>

                {/* Content/Video Area */}
                <Animated.View
                    style={{ opacity: pulseAnim }}
                    className="mt-4 w-full h-64 bg-gray-200 rounded-xl"
                />
            </View>
        </View>
    );
};

export default FreelancerSkeleton;