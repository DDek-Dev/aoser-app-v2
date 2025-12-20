import { View } from "react-native";

// Skeleton Components
export const SkeletonItem = () => (
  <View className="h-12 bg-gray-200 rounded-lg mb-2 animate-pulse" />
);

export const SkeletonLoader = () => (
  <View className="space-y-4 px-4">
    <View>
      <View className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
      <SkeletonItem />
    </View>
    <View>
      <View className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
      <SkeletonItem />
    </View>
    <View>
      <View className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse" />
      <SkeletonItem />
    </View>
  </View>
);
