import { View } from 'react-native';


import Animated, { 
    useAnimatedStyle, 
    withRepeat, 
    withSequence, 
    withTiming,
    useSharedValue,
    
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
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return <Animated.View className={className} style={animatedStyle} />;
};
export const CategoryTabSkeleton = () => {
    return (
        <View
            style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 70,
                height: 70,
                marginRight: 12,
                marginBottom: 4,
                borderRadius: 16,
                backgroundColor: '#fff',
            }}
            className="border border-border"
        >
            {/* Icon Skeleton */}
            <PulseView className="w-6 h-6 bg-gray-300 rounded mb-1 " />
            
            {/* Text Skeleton */}
            <PulseView className="w-12 h-4 bg-gray-300 rounded " />
        </View>
    );
};