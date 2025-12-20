// components/MessageListSkeleton.tsx
import React from 'react';
import { View, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { FreelancerStackParamList } from 'types/navigation';

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: true, // Reanimated runs in strict mode by default
});
export default function MessageListSkeleton() {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const skeletonMessages = Array.from({ length: 7 });

  
  const renderMessage = (_: any, index: number) => {
    const isUser = index % 2 === 0;
    const hasImage = index % 7 === 0; 

    return (
      <View
        key={index}
        className={`w-full px-4 my-3 flex-row ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        <View
          className={`max-w-[75%] rounded-2xl px-3 py-2 ${
            isUser
              ? 'bg-gray-200 rounded-br-none'
              : 'bg-gray-200 rounded-bl-none'
          } animate-pulse`}
        >
          {/* Simulate text message */}
          <View className="space-y-2 mb-2">
            <View className="h-6 w-64 bg-gray-300 rounded-lg" />
            {/* <View className="h-4 w-1/2 bg-gray-300 rounded-lg" /> */}
          </View>

          {/* Optional image bubble */}
          {hasImage && (
            <View className="mt-2 w-64 h-40 bg-gray-300 rounded-xl" />
          )}

          {/* Simulate small timestamp */}
          <View
            className={`self-end mt-2 h-3 w-10 bg-gray-300 rounded-lg ${
              isUser ? 'opacity-70' : 'opacity-60'
            }`}
          />
        </View>
      </View>
    );
  };

  return (
    <ScreenWrapper safeEdges={['top', 'bottom']}>
      <View className="flex-1 bg-surface">
        {/* Header Skeleton */}
        <View className="flex-row items-center px-4 py-3 gap-3 border-b border-border bg-surface">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
            <Ionicons name="arrow-back" size={24} color="#2b82F6" />
          </TouchableOpacity>

          <View className="w-10 h-10 bg-gray-300 rounded-full animate-pulse" />
          <View className="flex-1 space-y-4">
            <View className="w-2/3 h-4 bg-gray-300 rounded-lg mb-2 animate-pulse" />
            <View className="w-1/3 h-3 bg-gray-200 rounded-lg animate-pulse" />
          </View>
        </View>

        {/* Message Bubble Skeletons */}
        <FlatList
          data={skeletonMessages}
          renderItem={({ index }) => renderMessage(null, index)}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingVertical: 12 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenWrapper>
  );
}
