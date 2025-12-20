import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatusDisplay from 'components/ui/StatusDisplay';

import { View, Text, TouchableOpacity } from 'react-native';
import { Job } from 'types';
import { FreelancerStackParamList } from 'types/navigation';
import { formatDate, formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
import { HistoryNoResult } from './HistoryNoResult';
import { useTranslation } from 'react-i18next';


type Props = {
  data: Job[];
  onViewPress?: (job: Job) => void;
};

const statusColors: Record<string, string> = {
  Done: 'bg-success text-white',
  Public: 'bg-primary text-white',
  Doing: 'bg-warning text-white',
  Delay: 'bg-error text-white',
};


const PublicWorkHistoryList = ({ data, onViewPress }: Props) => {
  const navigator = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const language = getCurrentLanguage();

  const { t } = useTranslation();
  if (data.length === 0) {
    return (
      <HistoryNoResult />
    );
  }
  return (
    <View className="space-y-3">
      {data.map((item) => {

        return (
          <TouchableOpacity
            key={item._id}
            activeOpacity={0.9}
            // onPress={() => onViewPress?.(item)}
            onPress={() => navigator.navigate('FreelancerWorkDetail', { workId: item._id })}
            className="bg-surface rounded-2xl border border-border px-4 py-4 mb-2"
          >
            {/* Title + time + status label */}
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-1 pr-2">
                <Text className="text-body font-semibold text-text" numberOfLines={1}>{item.workTitle}</Text>
                {/* <Text className="text-caption text-textSecondary">{formatRelativeTime(item.createdAt as string, language)}</Text> */}
              </View>
              <View className={`px-3 py-1 `}>
                <Text className="text-caption text-surface font-medium capitalize">{StatusDisplay(item.workStatus)}</Text>
              </View>
            </View>




            {/* Description */}
            <Text numberOfLines={2} className="text-body mb-2 text-textSecondary">
              {item.description}
            </Text>


            {/* Budget + Deadline */}
            <View className="">
              <View className='flex-row '>
                <Text className='font-bold text-warning ml-2'>{item.currency} </Text>
                <Text className='font-bold text-primary '>{new Intl.NumberFormat().format(item.budget)}</Text>
              </View>
            </View>
            <View className='flex-row justify-between'>
              <View>
                <Text className='mt-3 mb-1'>{t('works.post_on')}</Text>
                <Text className="text-caption  text-textSecondary">{formatRelativeTime(item.createdAt, language)}</Text>
              </View>
              <View className='flex-row gap-2 items-center'>
                <Ionicons name="time-outline" size={18} color="#F59E0B" />
                <Text className="text-sm text-textSecondary">{formatDate(item.deadLine as string, language)}</Text>
              </View>

            </View>


          </TouchableOpacity>
        );
      })}


    </View>
  );
};

export default PublicWorkHistoryList;
