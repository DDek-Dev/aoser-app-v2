import { View } from "react-native";
import Animated, { 
    useAnimatedStyle, 
    withRepeat, 
    withSequence, 
    withTiming,
    useSharedValue,
    cancelAnimation,
} from 'react-native-reanimated';
import { useEffect } from 'react';

const PulseView = ({ className }: { className: string }) => {
    const opacity = useSharedValue(1);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            false
        );
        return () => {
            cancelAnimation(opacity);
        };
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return <Animated.View className={className} style={animatedStyle} />;
};

export const FreelancerCardSkeleton = () => (
    <View className="w-[49.5%] bg-white rounded-xl mb-2 border border-border overflow-hidden">
        {/* Banner Skeleton */}
        <PulseView className="w-full h-48 bg-gray-300" />
        
        <View className="p-3 space-y-2">
            {/* Star and Price Row Skeleton */}
            <View className="flex-row items-center justify-between">
                <PulseView className="w-12 h-[18px] bg-gray-300 rounded" />
                <PulseView className="w-20 h-6 bg-gray-300 rounded-full" />
            </View>

            {/* Job Title Skeleton */}
            <PulseView className="w-32 h-5 my-4 bg-gray-300 rounded" />

            {/* Description Skeleton */}
            <View className="space-y-1">
                <PulseView className="w-full h-3 bg-gray-300 rounded mb-2" />
                <PulseView className="w-3/4 h-3 bg-gray-300 rounded" />
            </View>
        </View>
    </View>
);
