import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Job, Message } from 'types';
import { FreelancerStackParamList } from 'types/navigation';
// import { publicWorkKeys, usePublicWorkById } from 'hooks/usePublicWork';
import { Ionicons } from '@expo/vector-icons';
import { formatDate, formatDisplayDateTime, getCurrentLanguage } from 'utils/dateFormatter';
import { useTranslation } from 'react-i18next';
// import { get } from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import * as Icons from 'lucide-react-native';

interface ProjectMessageItemProps {
  // projects can be a work id string
  projects: Message;
  // or optionally pass the WorkApplies object
}


const ProjectMessageItem: React.FC<ProjectMessageItemProps> = ({ projects }) => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  // Determine work id: prefer explicit projects prop (string), otherwise derive from work prop

  const currentLanguage = getCurrentLanguage();
  const { t } = useTranslation();
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

  const convertToPascalCase = (str: string): string => {
    return str
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  };
  const getIcon = (iconName?: string) => {
    if (!iconName) return Icons.Code;

    const pascalName = convertToPascalCase(iconName);
    const IconComponent = (Icons as any)[pascalName];

    return IconComponent || Icons.Code;
  };


  if (!projects.work) {
    return null;
  }

  const workData = projects.work as Job;
  const workAddress = workData.address;

  const IconComponent = getIcon(workData?.serviceType?.icon);
  return (
    <View className="space-y-3 w-[18rem]">

      {/* Header Badge */}
      <View className="bg-primary px-4 py-2.5 rounded-tl-xl rounded-tr-xl">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="bg-blue-400 rounded-full p-1.5 mr-2">
              <Ionicons name="document-text" size={16} color="white" />
            </View>
            <Text className="text-white font-bold text-sm">
              {t('chat.chatroom.task') || 'Task'}
            </Text>
          </View>

        </View>
      </View>
      <Pressable
        onPress={() => navigation.navigate('FreelancerWorkDetail', { workId: projects?.work?._id as string })}
        className="bg-surface rounded-2xl px-4 py-4 mb-2"
      >

        {/* profile of create by1 */}

        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3 ">
            <Text className="text-body font-semibold text-gray-900" numberOfLines={2}>
              {workData.workTitle}
            </Text>

          </View>
          <View className="w-6 mr-3 ">
            {/* <Text className="text-body font-semibold text-gray-900" numberOfLines={2}>
                    ICON
                  </Text> */}

            <IconComponent
              size={24}
              color={workData?.serviceType?.color || 'blue'}
              strokeWidth={2}
            />

          </View>

        </View>

        <Text className="text-body text-gray-500 mb-3" numberOfLines={3}>
          {workData.description}
        </Text>



        <View className='bg-background px-2 rounded-2xl p-2 overflow-hidden'>


          <View className=" flex-row items-center  ">

            <Text >{t('postWork.work_type')} : </Text>
            <Text className="text-caption text-text bg-surface p-2 rounded-full  ">
              {workData.kindOfWork === 'ONLINE' ? t('editWork.workType.online') : t('editWork.workType.offline')}
            </Text>
          </View>
          {workData.budgetType === 'OFFERING' ? (
            <View className=''>
              <Text className="text-body text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
            </View>
          ) : (

            <View className="flex-row items-center">
              <Text>{t('postWork.budget')} : </Text>
              <Text className="font-bold text-body text-primary">
                {new Intl.NumberFormat().format(workData.budget)}
              </Text>
              <Text className="font-bold text-body text-warning ml-2">{workData.currency} </Text>
            </View>

          )}



          <View className="flex-row mt-3 items-center">
            <Text>{currentLanguage === 'la' ? 'ເລີ່ມ' : 'Start'} : </Text>

            <View className="flex-row gap-2 items-center">
              <Ionicons name="time-outline" size={18} color="#F59E0B" />
              <Text className="text-sm text-textSecondary">
                {/* {formatDate(item.deadLine as string, currentLanguage)} */}
                {formatDisplayDateTime(workData.startDate as string)}
              </Text>
            </View>
          </View>
          <View className="flex-row mt-3 items-center">
            {/* <Text>{t('workDetail.deadline')} : </Text> */}
            <Text>{currentLanguage === 'la' ? 'ຫາ ' : 'End'} : </Text>

            <View className="flex-row gap-2 items-center">
              <Ionicons name="time-outline" size={18} color="#F59E0B" />

              <Text className="text-sm text-textSecondary">
                {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                {formatDisplayDateTime(workData.deadLine as string)}
              </Text>
            </View>
          </View>

          {workAddress &&


            <View className="flex-row mt-3 items-center">

              <View className="flex-row gap-2 items-start">
                <Ionicons name="location-outline" size={18} color="#F59E0B" />



                <View>


                  {workData.address.village !== '' &&
                    workData.address.district !== '' &&
                    workData.address.province !== '' &&


                    <Text className="text-sm text-textSecondary" numberOfLines={1}>
                      {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                      {workAddress.village}, {workAddress.district}, {workAddress.province}.
                    </Text>
                  }

                  {workData.place && (


                    <Text className="text-sm text-textSecondary">
                      {workData.place}
                    </Text>


                  )}
                </View>
              </View>
            </View>
          }




        </View>
      </Pressable>
    </View>
  );
};

export default ProjectMessageItem;
