import  { use, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Freelancer, UserProfile } from 'types/profile';

type TabContentProps = {
  profile: Freelancer;
};

export default function WhatExpect({ profile }: TabContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Split text into lines and check if it's longer than 5 lines
  const lines = profile.customerExpect;
  const shouldShowReadMore = lines.length > 200;
  const {t} = useTranslation();
  // Get displayed text based on expansion state
  const getDisplayedText = () => {
    if (!shouldShowReadMore || isExpanded) {
      return profile.customerExpect;
    }
    return lines.slice(0, 200);
  };

  const toggleExpansion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="px-4">
      <View className="space-y-3 mt-4 bg-white rounded-lg p-2" style={styles.shadowBottom}>
        <View>
          <Text className="text-medium font-semibold text-gray-800">{t('freelancer_profile.whatExpect')}</Text>
          <Text className="text-body text-textSecondary mt-4 mb-2">
            {getDisplayedText()}
          </Text>
        </View>

        {shouldShowReadMore && (
          <TouchableOpacity onPress={toggleExpansion} className="">
            <Text className="text-blue-600 font-medium">
              {isExpanded ? 'Show Less' : 'Read More'}
            </Text>
          </TouchableOpacity>
        )}

        <View className="flex-row justify-end items-center mt-4">
          <View className="flex-row  py-2 px-4 items-center rounded-full">
            <Text className="text-xl font-bold text-warning">{profile.hourlyRateCurrency} </Text>
            <Text className="text-xl font-bold text-primary"> { new Intl.NumberFormat().format(profile.hourlyRate)}</Text>
            <Text className="text-sm text-textSecondary"> / {t('freelancer_profile.hour')}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowBottom: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // 👈 bottom shadow
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 1, // Android support
  },
});