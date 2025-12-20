import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useAuth } from 'hooks/useAuth';
import { aoserlogo_jpg } from 'assets';
import { useTranslation } from 'react-i18next';



const FreelancerRoleGate = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { user: data } = useAuth();
  // console.log("data at role gate", JSON.stringify(data, null, 2));

  useEffect(() => {
    if (data?.businessType === 'FREELANCER' && data?.registrationStatus === 'APPROVED_COMPLETE') {
      navigation.replace('AuthFreelancerProfile', { userId: data._id });
    }
  }, []);
  const { t } = useTranslation();
  return (
    <SafeAreaView className="flex-1 bg-background justify-center px-6">


      {data?.businessType === 'FREELANCER' && data?.registrationStatus === 'PENDING' && (
        <View className="items-center">
          <Image
            source={aoserlogo_jpg}// Optional: replace with your image
            className="w-64 h-64 mb-12 rounded-tr-3xl rounded-bl-3xl"
            resizeMode="cover"
          />
          <Text className="text-heading text-text text-center mb-2">
            {t('freelancerRoleGate.becomeFreelancerTitle')}
          </Text>
          <Text className="text-body text-textSecondary text-center mb-6">
            {t('freelancerRoleGate.becomeFreelancerSubtitle')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('UpgradeToFreelancer')}
            className="bg-warning py-3 px-6 rounded-xl"
          >
            <Text className="text-white text-subheading">{t('freelancerRoleGate.getStartedButton')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {data?.registrationStatus === 'PENDING' && data?.businessType === 'CUSTOMER' && (
        <View className="items-center">
          <Image
            source={{ uri: 'https://gomycode.com/wp-content/uploads/2023/09/shift-blog-2018-12-17-freelance-platforms-1-1-1-1024x530-optimized.png' }} // Optional: add image
            className="w-40 h-40 mb-6"
            resizeMode="contain"
          />
          <Text className="text-heading text-text text-center mb-2">
            {t('freelancerRoleGate.pendingTitle')}
          </Text>
          <Text className="text-body text-textSecondary text-center mb-6">
            {t('freelancerRoleGate.pendingSubtitle')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-border py-3 px-6 rounded-xl"
          >
            <Text className="text-text text-subheading">{t('freelancerRoleGate.backToHomeButton')}</Text>
          </TouchableOpacity>
        </View>
      )}
      {data?.registrationStatus === 'REJECTED' && (
        <View className="items-center">
          <Image
            source={{ uri: 'https://gomycode.com/wp-content/uploads/2023/09/shift-blog-2018-12-17-freelance-platforms-1-1-1-1024x530-optimized.png' }} // Optional: add image
            className="w-40 h-40 mb-6"
            resizeMode="contain"
          />
          <Text className="text-heading text-text text-center mb-2">
            {t('freelancerRoleGate.pendingTitle')}
          </Text>
          <Text className="text-body text-textSecondary text-center mb-6">
            {t('freelancerRoleGate.pendingSubtitle')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-border py-3 px-6 rounded-xl"
          >
            <Text className="text-text text-subheading">{t('freelancerRoleGate.backToHomeButton')}</Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
};

export default FreelancerRoleGate;
