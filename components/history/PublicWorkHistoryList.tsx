import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatusDisplay from 'components/ui/StatusDisplay';

import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Job } from 'types';
import { FreelancerStackParamList } from 'types/navigation';
import { formatDate, formatDisplayDateTime, formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
import { HistoryNoResult } from './HistoryNoResult';
import { useTranslation } from 'react-i18next';
import { profileImage } from 'assets';

const BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

type Props = {
  data: Job[];
  onViewPress?: (job: Job) => void;
};

const PublicWorkHistoryList = ({ data, onViewPress }: Props) => {
  const navigator = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const currentLanguage = getCurrentLanguage();

  const { t } = useTranslation();
  if (data.length === 0) {
    return (
      <HistoryNoResult />
    );
  }
  return (
    <View className="space-y-3">
      {data.map((item) => {
        const assignedProfile = item.assignedTo && typeof item.assignedTo === 'object'
          ? item.assignedTo
          : undefined;
        const displayProfile = assignedProfile || item.createdBy;
        const displayName = `${displayProfile?.firstName || ''} ${displayProfile?.lastName || ''}`.trim() || 'Unknown user';
        const displayImage = displayProfile?.userProfileImage
          ? { uri: BASE_URL + displayProfile.userProfileImage }
          : profileImage;

        return (
          <TouchableOpacity
            key={item._id}
            activeOpacity={0.9}
            // onPress={() => onViewPress?.(item)}
            onPress={() => navigator.navigate('FreelancerWorkDetail', { workId: item._id })}
            className="bg-surface rounded-2xl border border-border px-4 py-4 mb-2"
          >



            {/* profile of create by1 */}
            <View className=''>

              <View className='flex-row justify-between px-1'>

                <View>
                  <View className="flex-row gap-2 items-center">
                    <Image
                      source={displayImage}
                      className="w-10 h-10 rounded-full"
                    />
                    <Text>{displayName}</Text>

                  </View>
                  <Text className="text-caption mt-1 text-center text-textSecondary">
                   {t('works.post_on')} {formatRelativeTime(item.createdAt, currentLanguage)}
                  </Text>
                </View>
                <View >

                  <StatusDisplay status={item.workStatus} />

                </View>


              </View>

              <View className='h-[1px] bg-border my-2' />
            </View>
            {/* Title + time + status label */}
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-1 pr-2">
                <Text className="text-body font-semibold text-text" numberOfLines={1}>{item.workTitle}</Text>
                {/* <Text className="text-caption text-textSecondary">{formatRelativeTime(item.createdAt as string, language)}</Text> */}
              </View>
            </View>


            <Text className="text-body text-gray-500 mb-3" numberOfLines={3}>
              {item.description}
            </Text>



            <View className='bg-background px-2 rounded-2xl p-2'>


              <View className=" flex-row items-center  ">

                <Text >{t('postWork.work_type')} : </Text>
                <Text className="text-caption text-text bg-surface p-2 rounded-full  ">
                  {item.kindOfWork === "ONLINE" ? "Online" : "Offline"}
                </Text>
              </View>
              {item.budgetType === 'OFFERING' ? (
                <View className=''>
                  <Text className="text-lg text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
                </View>
              ) : (

                <View className="flex-row items-center">
                  <Text>{t('postWork.budget')} : </Text>
                  <Text className="font-bold text-body text-primary">
                    {new Intl.NumberFormat().format(item.budget)}
                  </Text>
                  <Text className="font-bold text-body text-warning ml-2">{item.currency} </Text>
                </View>

              )}


              {item.startDate !== undefined &&

                <View className="flex-row mt-3 items-center">
                  <Text>{currentLanguage === 'la' ? 'ເລີ່ມ' : 'Start'} : </Text>

                  <View className="flex-row gap-2 items-center">
                    <Ionicons name="time-outline" size={18} color="#F59E0B" />
                    <Text className="text-sm text-textSecondary">
                      {/* {formatDate(item.deadLine as string, currentLanguage)} */}
                      {formatDisplayDateTime(item.startDate as string)}
                    </Text>
                  </View>
                </View>
              }

              {item.deadLine !== undefined &&
                <View className="flex-row mt-3 items-center">
                  {/* <Text>{t('workDetail.deadline')} : </Text> */}
                  <Text>{currentLanguage === 'la' ? 'ຫາ' : 'To'} : </Text>

                  <View className="flex-row gap-2 items-center">
                    <Ionicons name="time-outline" size={18} color="#F59E0B" />

                    <Text className="text-sm text-textSecondary">
                      {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                      {formatDisplayDateTime(item.deadLine as string)}
                    </Text>
                  </View>
                </View>

              }

              {item.address.village !== '' && item.address.district !== '' && item.address.province !== '' &&

                <View className="flex-row mt-3 items-center">
                  {/* <Text>{t('workDetail.deadline')} : </Text> */}
                  <Text>{t('payment_success.address')}:  </Text>

                  <View className="flex-row gap-2 items-center">
                    <Ionicons name="location-outline" size={18} color="#F59E0B" />

                    <Text className="text-sm text-textSecondary">
                      {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                      {item.address.village}, {item.address.district}, {item.address.province}
                    </Text>
                  </View>
                </View>
              }

            </View>

          </TouchableOpacity>
        );
      })}


    </View>
  );
};

export default PublicWorkHistoryList;
