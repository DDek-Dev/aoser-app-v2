import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';

const AuthFreelancerSetting = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
   
      <View className=" mt-12 px-4 py-4 border-b border-border bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2 flex-row items-center gap-2">
          <Ionicons name="arrow-back" size={20} color="#3B82F6" />
        <Text className="text-text font-semibold text-[16px]">Settings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-4 pt-6">
        {/* Account setting */}
        <Text className="text-textSecondary text-[12px] font-medium mb-2">Let's our help recommend you</Text>

        <TouchableOpacity onPress={() => navigation.navigate('RecommendUser')}  className="bg-white border border-warning rounded-2xl px-4 py-4 flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-2">
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text className="text-text font-medium text-[14px]">Buy star</Text>
          </View>
          {/* <Ionicons name="star" size={20} color="#9CA3AF" /> */}
        </TouchableOpacity>
        <Text className="text-textSecondary text-[12px] font-medium mb-2">Account setting</Text>

        <TouchableOpacity onPress={() => navigation.navigate('EditAoserProfile')}  className="bg-white border border-border rounded-xl px-4 py-4 flex-row items-center justify-between mb-6">
          <View className="flex-row items-center gap-2">
            <Ionicons name="person-outline" size={20} color="#3B82F6" />
            <Text className="text-text font-medium text-[14px]">Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Edit personal data */}
        <Text className="text-textSecondary text-[12px] font-medium mb-2">Edit freelancer data</Text>

        {/* Job Section */}
        <TouchableOpacity onPress={() => navigation.navigate('EditFreelancerJobsection')} className="bg-white border border-border rounded-xl px-4 py-4 flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Entypo name="list" size={20} color="#3B82F6" />
            <Text className="text-text font-medium text-[14px]">Job section</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* About Section */}
        <TouchableOpacity onPress={() => navigation.navigate('EditFreelancerAboutMe')} className="bg-white border border-border rounded-xl px-4 py-4 flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <MaterialCommunityIcons name="filter-outline" size={20} color="#3B82F6" />
            <Text className="text-text font-medium text-[14px]">About section</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Offer Section */}
        <TouchableOpacity onPress={() => navigation.navigate('EditFreelancerOffer')} className="bg-white border border-border rounded-xl px-4 py-4 flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="pricetag-outline" size={20} color="#3B82F6" />
            <Text className="text-text font-medium text-[14px]">Offer section</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default AuthFreelancerSetting;
