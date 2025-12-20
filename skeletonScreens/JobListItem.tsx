import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';


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

const JobListItem: React.FC = () => {
  return (
    <View className="flex-1 bg-background">
      

      <ScrollView className="flex-1">
        
        

        {/* Job Listings Skeleton */}
        {[1, 2,3,4,5,6].map((index: number) => (
          <View key={index} className="bg-white rounded-2xl p-4 mb-4 border border-border">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <PulseView className="w-4/5 h-5 bg-gray-300 rounded mb-2" />
                <PulseView className="w-full h-3 bg-gray-300 rounded mb-3" />
                
                <View className="flex-row justify-between items-center">
                  <PulseView className="w-15 h-5 bg-gray-300 rounded" />
                  <PulseView className="w-20 h-3 bg-gray-300 rounded" />
                </View>
              </View>
              
              <View className="ml-4">
                <PulseView className="w-12 h-4 bg-gray-300 rounded" />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      

      
    </View>
  );
};

export default JobListItem;