// components/ChatItemSkeleton.tsx
import React from 'react';
import { View } from 'react-native';

export default function ChatItemSkeleton() {
  return (
    <View className="flex-row items-center justify-between px-4 py-4 bg-surface">
      <View className="flex-row items-center space-x-3 gap-2">
        <View className="w-14 h-14 rounded-full bg-gray-300 animate-pulse" />
        <View>
          <View className="w-32 h-4 bg-gray-300 rounded-md mb-2 animate-pulse" />
          <View className="w-24 h-3 bg-gray-200 rounded-md animate-pulse" />
        </View>
      </View>
      <View className="items-end">
        <View className="w-10 h-3 bg-gray-200 rounded-md mb-2 animate-pulse" />
        <View className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
      </View>
    </View>
  );
}
