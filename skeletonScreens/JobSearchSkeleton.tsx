import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { CategoryTabSkeleton } from './CategoryTabSkeleton';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

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

const JobSearchSkeleton: React.FC = () => {
  const {t} = useTranslation();
  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#3B82F6" />
      
      {/* Header Section */}
      <View className="bg-primary pb-8 px-4 rounded-b-3xl">
        <View className="flex-row justify-between items-center mb-8">
          <View className="flex-row items-center gap-2">
            <PulseView className="w-5 h-5 bg-white/30 rounded" />
            <PulseView className="w-5 h-5 bg-white/30 rounded" />
            <PulseView className="w-15 h-5 bg-white/30 rounded" />
          </View>
        </View>

        <Text className="text-white text-3xl font-bold mb-2">{t('works.lets_find_work')}{'\n'} {t('works.work')}</Text>
        {/* <Text className="text-white text-3xl font-bold mb-4">Work</Text> */}

        {/* Search Bar Skeleton */}
        <View className="bg-white rounded-full px-4 py-4 flex-row items-center mb-4">
          {/* <PulseView className="w-5 h-5 bg-gray-300 rounded mr-3" />
          <PulseView className="w-24 h-4 bg-gray-300 rounded" /> */}
              <Ionicons name="search-outline" size={20} color="#333" />
              <Text className="ml-2 text-gray-500">{t('works.search_work')}</Text>

        </View>
      </View>

      <ScrollView className="flex-1 px-1">
        {/* Category Tabs Skeleton */}
        <View className="flex-row flex-wrap justify-between my-6 px-2">
          {[1, 2, 3, 4, ].map((index: number) => (
            <CategoryTabSkeleton key={index} />
          ))}
        </View>

        {/* Start Public Work Card Skeleton */}
        <View className="bg-primary rounded-2xl p-6 mb-6">
          <View className="flex-row items-center mb-3">
            <PulseView className="w-6 h-6 bg-white/30 rounded mr-2" />
            <PulseView className="w-40 h-5 bg-white/30 rounded" />
          </View>
          
          <PulseView className="w-full h-4 bg-white/30 rounded mb-2" />
          <PulseView className="w-3/5 h-4 bg-white/30 rounded mb-5" />
          
          <View className="bg-white rounded-full px-6 py-3 self-start">
            <PulseView className="w-20 h-4 bg-gray-300 rounded" />
          </View>
        </View>

        {/* Job Listings Skeleton */}
        {[1, 2,3].map((index: number) => (
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

export default JobSearchSkeleton;