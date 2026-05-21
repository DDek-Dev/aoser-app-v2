import { useNavigation } from '@react-navigation/native';
import Header_back from 'components/ui/Header_back';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Animated } from 'react-native';

const CustomerProfileSkelenton = () => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
const navigation = useNavigation();
    const { t } = useTranslation();

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
    <View className="flex-1 bg-white">
        <View
                className="flex-row items-center justify-between bg-surface border-b border-border"

            >
                <Header_back text={t('customerProfile.title')} iconColor='#3B82F6' onPress={() => navigation.goBack()} />

            </View>
      {/* Blue Header Section */}
      <View className="bg-blue-600 h-48 w-full flex-row items-center px-6">
        {/* Profile Image Circle Placeholder */}
        <Animated.View 
          style={{ opacity: pulseAnim }}
          className="w-24 h-24 rounded-full border-4 border-white/30 bg-blue-400" 
        />
        
        {/* ID Badge Placeholder */}
        <View className="ml-4 flex-1">
          <Animated.View 
            style={{ opacity: pulseAnim }}
            className="h-12 w-32 border border-white rounded-xl bg-blue-400/50 flex-row items-center justify-center"
          />
        </View>
      </View>

      {/* Content Area - Pulling up with negative margin to overlap */}
      <View className="flex-1 px-4 -mt-8">
        
        {/* Contact Info Card */}
        <View className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm mb-4">
          <Animated.View style={{ opacity: pulseAnim }} className="h-4 w-24 bg-gray-200 rounded mb-4" />
          
          {/* Name Row */}
          <View className="flex-row items-center mb-6">
            <Animated.View style={{ opacity: pulseAnim }} className="w-12 h-12 bg-blue-100 rounded-2xl mr-4" />
            <View className="flex-1">
              <Animated.View style={{ opacity: pulseAnim }} className="h-3 w-24 bg-gray-200 rounded mb-2" />
              <Animated.View style={{ opacity: pulseAnim }} className="h-5 w-32 bg-gray-300 rounded" />
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-100 w-full mb-6" />

          {/* Phone Row */}
          <View className="flex-row items-center">
            <Animated.View style={{ opacity: pulseAnim }} className="w-12 h-12 bg-blue-100 rounded-2xl mr-4" />
            <View className="flex-1">
              <Animated.View style={{ opacity: pulseAnim }} className="h-3 w-20 bg-gray-200 rounded mb-2" />
              <Animated.View style={{ opacity: pulseAnim }} className="h-5 w-40 bg-gray-300 rounded" />
            </View>
          </View>
        </View>

        {/* Location Card */}
        <View className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
          <Animated.View style={{ opacity: pulseAnim }} className="h-4 w-20 bg-gray-200 rounded mb-4" />
          
          <View className="flex-row items-center">
            <Animated.View style={{ opacity: pulseAnim }} className="w-12 h-12 bg-blue-100 rounded-2xl mr-4" />
            <View className="flex-1">
              <Animated.View style={{ opacity: pulseAnim }} className="h-3 w-10 bg-gray-200 rounded mb-2" />
              <Animated.View style={{ opacity: pulseAnim }} className="h-5 w-56 bg-gray-300 rounded" />
            </View>
          </View>
        </View>

      </View>
    </View>
  );
};

export default CustomerProfileSkelenton;