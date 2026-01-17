import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Entypo, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useTranslation } from 'react-i18next';
import ScreenWrapper from 'components/ui/ScreenWrapper';
const AuthFreelancerSetting = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { t } = useTranslation();
  return (

    <ScreenWrapper safeEdges={['top']}>


    <View className="flex-1 bg-background">
      {/* Header */}

      <View className=" px-4 py-4 border-b border-border bg-white">
        <Pressable onPress={() => navigation.goBack()} className="mr-2 flex-row items-center gap-2">
          <MaterialIcons name="chevron-left" size={32} color="#3B82F6" />
          <Text className="text-text font-semibold text-subheading">{t('profile.freelancerSetting.title')}</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* Account setting */}
        <Text className="text-textSecondary text-[12px] font-medium mb-2"> {t('profile.freelancerSetting.recommend_section_label')}</Text>

        <Pressable onPress={() => navigation.navigate('RecommendUser')} className="bg-white border border-warning rounded-2xl px-4 py-4 flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-2">
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text className="text-text font-medium text-[14px]">{t('profile.freelancerSetting.buy_star')}</Text>
          </View>
          {/* <Ionicons name="star" size={20} color="#9CA3AF" /> */}
        </Pressable>
        <Text className="text-textSecondary text-[12px] font-medium mb-2">{t('profile.freelancerSetting.account_setting_label')}</Text>

        <Pressable onPress={() => navigation.navigate('EditAoserProfile')} className="bg-white border border-border rounded-xl px-4 py-4 flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-2">
            <Ionicons name="person-outline" size={20} color="#3B82F6" />
            <Text className="text-text font-medium text-[14px]">{t('profile.freelancerSetting.edit_profile')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Edit personal data */}
        <Text className="text-textSecondary text-[12px] font-medium mb-2">{t('profile.freelancerSetting.edit_freelancer_data_label')}</Text>

        {/* Job Section */}
        <Pressable onPress={() => navigation.navigate('EditFreelancerJobsection')} className="bg-white border border-border rounded-xl px-4 py-4 flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Entypo name="list" size={20} color="#3B82F6" />
            <Text className="text-text font-medium text-[14px]"> {t('profile.freelancerSetting.job_section')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* About Section */}
        <Pressable onPress={() => navigation.navigate('EditFreelancerAboutMe')} className="bg-white border border-border rounded-xl px-4 py-4 flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="filter-outline" size={20} color="#3B82F6" />
            <Text className="text-text font-medium text-[14px]"> {t('profile.freelancerSetting.about_section')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>

        {/* Offer Section */}
        <Pressable onPress={() => navigation.navigate('EditFreelancerOffer')} className="bg-white border border-border rounded-xl px-4 py-4 flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="pricetag-outline" size={20} color="#3B82F6" />
            <Text className="text-text font-medium text-[14px]">{t('profile.freelancerSetting.offer_section')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </Pressable>
     
      </ScrollView>
    </View>
    </ScreenWrapper>
  );
};

export default AuthFreelancerSetting;
