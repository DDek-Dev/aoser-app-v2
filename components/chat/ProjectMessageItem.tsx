import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {  Job, Message } from 'types';
import { FreelancerStackParamList } from 'types/navigation';
// import { publicWorkKeys, usePublicWorkById } from 'hooks/usePublicWork';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, getCurrentLanguage } from 'utils/dateFormatter';
// import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

interface ProjectMessageItemProps {
  // projects can be a work id string
  projects: Message;
  // or optionally pass the WorkApplies object
}


const ProjectMessageItem: React.FC<ProjectMessageItemProps> = ({ projects }) => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  // Determine work id: prefer explicit projects prop (string), otherwise derive from work prop

  const currentLanguage = getCurrentLanguage();

  // if (isLoading) {
  //   return (
  //     <View className="flex-row items-center justify-between px-4 py-4 bg-surface">
  //       <View className="flex-row items-center space-x-3 gap-2">
  //         <View className="w-14 h-14 rounded-full bg-gray-300 animate-pulse" />
  //         <View>
  //           <View className="w-32 h-4 bg-gray-300 rounded-md mb-2 animate-pulse" />
  //           <View className="w-24 h-3 bg-gray-200 rounded-md animate-pulse" />
  //         </View>
  //       </View>
  //       <View className="items-end">
  //         <View className="w-10 h-3 bg-gray-200 rounded-md mb-2 animate-pulse" />
  //         <View className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
  //       </View>
  //     </View>
  //   )
  // }

  // Error state
  // if (isError || !workData) {
  //   return (
  //     <View className="bg-surface rounded-2xl border border-border px-4 py-4 mb-2">
  //       <View className="flex-row items-center">
  //         <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
  //         <Text className="text-textSecondary ml-2">Unable to load project</Text>
  //       </View>
  //       {error && (
  //         <Text className="text-xs text-textSecondary mt-1">
  //           {error instanceof Error ? error.message : 'Unknown error'}
  //         </Text>
  //       )}
  //     </View>
  //   );
  // }
if(!projects.work){
  return null;
}
  const workData = projects.work as Job;

  return (
    <View className="space-y-3 ">
    

      <TouchableOpacity

        activeOpacity={0.9}
        onPress={() => navigation.navigate('FreelancerWorkDetail', { workId: projects?.work?._id as string })}
        className="bg-surface rounded-2xl border border-border px-4 py-4 mb-2"
      >

        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-1 pr-2">
            <Text className="text-body font-semibold text-text" numberOfLines={1}>{workData.workTitle}</Text>
          </View>
        </View>


        <Text numberOfLines={2} className="text-body mb-2 text-textSecondary">
          {workData.description}
        </Text>


        <View className='flex-row justify-between'>
          <View className='flex-row '>
            <Text className='font-bold text-warning ml-2'>{workData.currency} </Text>
            <Text className='font-bold text-primary '>{new Intl.NumberFormat().format(workData.budget)}</Text>
          </View>

          <View className='flex-row gap-2 items-center'>
            <Ionicons name="time-outline" size={18} color="#F59E0B" />
            <Text className="text-sm text-textSecondary">{formatDate(workData.deadLine as string, currentLanguage)}</Text>
          </View>

        </View>
      </TouchableOpacity>


    </View>
  );
};

export default ProjectMessageItem;