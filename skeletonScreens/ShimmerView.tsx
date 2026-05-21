import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';

// Shimmer animation component
export const ShimmerView = ({ width = '100%', height = 20, borderRadius = 8, style = {} }: any) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#E5E7EB',
          opacity,
        },
        style,
      ]}
    />
  );
};

// SearchBar Skeleton
export const SearchBarSkeleton = () => {
  return (
    <View className="flex-1 bg-white pt-12 px-4">
      {/* Search Header Skeleton */}
      <View className="flex-row items-center mb-4">
        <ShimmerView width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
        <ShimmerView width="85%" height={56} borderRadius={28} />
      </View>

      {/* Fast Search Title */}
      <ShimmerView width={120} height={16} borderRadius={4} style={{ marginBottom: 12 }} />

      {/* Service Type Tags Skeleton */}
      <View className="flex-row flex-wrap mb-6">
        {[80, 100, 90, 110, 95, 85].map((width, index) => (
          <ShimmerView
            key={index}
            width={width}
            height={36}
            borderRadius={18}
            style={{ marginRight: 8, marginBottom: 8 }}
          />
        ))}
      </View>

      {/* History Title */}
      <View className="flex-row justify-between items-center px-2 mb-3 mt-2">
        <ShimmerView width={120} height={16} borderRadius={4} />
        <ShimmerView width={60} height={16} borderRadius={4} />
      </View>

      {/* History Items Skeleton */}
      <View className="flex-col">
        {[1, 2, 3, 4, 5].map((_, index) => (
          <View
            key={index}
            className="flex-row justify-between items-center px-4 py-3 mb-1 border-b border-gray-100"
          >
            <View className="flex-row items-center flex-1">
              <ShimmerView width={18} height={18} borderRadius={9} style={{ marginRight: 12 }} />
              <ShimmerView width="70%" height={14} borderRadius={4} />
            </View>
            <ShimmerView width={18} height={18} borderRadius={9} />
          </View>
        ))}
      </View>
    </View>
  );
};

// SearchView Skeleton
export const SearchViewSkeleton = () => {
  return (
    <View className="flex-1 bg-white">
      {/* Header Skeleton */}
      <View className="bg-primary pt-12 pb-4 rounded-b-2xl">
        <View className="flex-row items-center px-4 mb-3">
          <ShimmerView width={32} height={32} borderRadius={16} style={{ marginRight: 12 }} />
          <ShimmerView width="80%" height={48} borderRadius={24} />
        </View>

        {/* Service Type Tags Skeleton */}
        <View className="flex-row px-4">
          {[80, 90, 85, 95].map((width, index) => (
            <ShimmerView
              key={index}
              width={width}
              height={32}
              borderRadius={16}
              style={{ marginRight: 8 }}
            />
          ))}
        </View>
      </View>

      {/* Sort Bar Skeleton */}
      <View className="px-4 py-3 border-b border-gray-100">
        <ShimmerView width="100%" height={40} borderRadius={20} />
      </View>

      {/* Results Skeleton */}
      <View className="px-4 pt-2">
        {/* Results count */}
        <ShimmerView width={150} height={14} borderRadius={4} style={{ marginVertical: 8 }} />

        {/* Freelancer Cards Skeleton */}
        {[1, 2, 3, 4].map((_, index) => (
          <View
            key={index}
            className="flex-row items-start mt-3 bg-white rounded-2xl overflow-hidden border border-gray-200"
          >
            <ShimmerView width="40%" height={176} borderRadius={0} />
            <View className="flex-1 p-3 space-y-2">
              {/* Rating and Price Row */}
              <View className="flex-row justify-between items-center">
                <ShimmerView width={50} height={20} borderRadius={4} />
                <ShimmerView width={80} height={24} borderRadius={12} />
              </View>

              {/* Job Title */}
              <ShimmerView width="90%" height={16} borderRadius={4} />

              {/* Service Type Badge */}
              <ShimmerView width={70} height={24} borderRadius={6} />

              {/* Description */}
              <View className="space-y-1">
                <ShimmerView width="100%" height={12} borderRadius={4} />
                <ShimmerView width="95%" height={12} borderRadius={4} />
                <ShimmerView width="85%" height={12} borderRadius={4} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

// Search Result Card Skeleton (for reuse)
export const SearchResultCardSkeleton = () => {
  return (
    <View className="flex-row items-start mt-3 bg-white rounded-2xl overflow-hidden border border-gray-200">
      <ShimmerView width="40%" height={176} borderRadius={0} />
      <View className="flex-1 p-3 space-y-2">
        <View className="flex-row justify-between items-center">
          <ShimmerView width={50} height={20} borderRadius={4} />
          <ShimmerView width={80} height={24} borderRadius={12} />
        </View>
        <ShimmerView width="90%" height={16} borderRadius={4} />
        <ShimmerView width={70} height={24} borderRadius={6} />
        <View className="space-y-1">
          <ShimmerView width="100%" height={12} borderRadius={4} />
          <ShimmerView width="95%" height={12} borderRadius={4} />
          <ShimmerView width="85%" height={12} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};