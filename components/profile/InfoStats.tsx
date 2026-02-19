import { View, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

type InfoStatsType = {
   success?: number;
  jobs?: number;
  rewards?: number;

};
export default function InfoStats({ success, jobs, rewards }: InfoStatsType) {
  const {t} = useTranslation();
  return (
    <>
      <View className="flex-row justify-between w-[80%] my-6 self-center">
        <View className="items-center">
          <MaterialIcons name="verified" size={20} color="#3b82f6" />
          <Text className="text-sm mt-1 text-gray-600">{success}</Text>
          <Text className="text-xs text-gray-400">{t('freelancer_profile.infoStats.work_completed')}</Text>
        </View>
        <View className='w-[1px] h-full bg-gray-800'/>
        <View className="items-center">
          <MaterialIcons name="shopping-cart" size={20} color="#3b82f6" />
          <Text className="text-sm mt-1 text-gray-600">{jobs}</Text>
          <Text className="text-xs text-gray-400">{t('freelancer_profile.infoStats.total_work')}</Text>
        </View>
         <View className='w-[1px] h-full bg-gray-800'/>
        <View className="items-center">
          <MaterialIcons name="cached" size={20} color="#3b82f6" />
          <Text className="text-sm mt-1 text-gray-600">{rewards}</Text>
          <Text className="text-xs text-gray-400">{t('freelancer_profile.infoStats.doing')}</Text>
        </View>
      </View>

      

    </>
  );
}
