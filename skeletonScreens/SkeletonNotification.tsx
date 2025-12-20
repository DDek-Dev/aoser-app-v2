import ScreenWrapper from 'components/ui/ScreenWrapper';
import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Animated, Text } from 'react-native';

const SkeletonNotification = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  const SkeletonBox = ({ className }: { className: string }) => (
    <Animated.View
      style={{ opacity }}
      className={`bg-gray-300 ${className}`}
    />
  );

  return (

    <ScreenWrapper safeEdges={['top']}>


    <View className="flex-1 bg-surface  pt-5">
      {/* Header */}
      {/* <SkeletonBox className="w-48 h-9 mb-8 rounded-lg" /> */}
      <View className='px-4 flex-row justify-between items-center mb-4'>
        <View className="flex-row items-center bg-surface p-3 rounded-2xl flex-1 mr-3">
          <View className="flex-1">
            <Text className="font-semibold text-primary text-heading">Notifications</Text>
          </View>
        </View>
      </View>

    

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Render 6 notification skeleton items */}
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            className="bg-white rounded-2xl p-4 mb-3 h-28"

          >
            <View className="flex-row items-start">
              {/* Icon */}
              <SkeletonBox className="w-11 h-11 rounded-lg mr-3 mb-12" />

              {/* Text Content */}
              <View className="flex-1">
                {/* Title */}
                <SkeletonBox className="w-40 h-5 mb-2 rounded" />
                {/* Subtitle */}
                <SkeletonBox className="w-56 h-4 rounded" />
              </View>

              {/* Date on the right */}
              <SkeletonBox className="w-20 h-4 ml-2 rounded" />
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
    </ScreenWrapper>

  );
};

export default SkeletonNotification;