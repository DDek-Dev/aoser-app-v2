import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GetFavorite, Job } from 'types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { formatDate, formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
import { useDeleteFavorite } from 'hooks/useFreelancer';
import { useTranslation } from 'react-i18next';
import JobDetailBottomSheet from 'components/publicwork/JobDetailModal';
import { FavoriteNoResult } from './FavoriteNoResult';
import { profileImage } from 'assets';

type Props = {
  data: GetFavorite[];
  // onViewPress?: (job: Job) => void;
  refetch: () => void;
};

const BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;


const PublicWorkCardList = ({ data, refetch }: Props) => {

  const [jobDetailVisible, setJobDetailVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | {}>({});
  const [shouldRestorePopup, setShouldRestorePopup] = useState(false);
  const navigations = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  const deleteFavorite = useDeleteFavorite();

  // console.log('PublicWorkCardList data: ', JSON.stringify(d, null, 2));
  const { t } = useTranslation();
  // console.log("PublicWorkCardList data: ", JSON.stringify(data, null, 2));  

  const handleDeleteFavorite = useCallback(async (likeId: string) => {

    try {
      await deleteFavorite.mutateAsync(likeId);

      await refetch();

    } catch (error) {

      console.log("❌ Error deleting favorite:", error);
    }
  }, [deleteFavorite, refetch]);


  const currentLanguage = getCurrentLanguage();
  const handleCloseJobDetail = useCallback(() => {
    setJobDetailVisible(false);
    setSelectedJob({}); // Clear the job data
    setShouldRestorePopup(false);
  }, []);

  const handleUserProfileNavigation = useCallback((userId: string) => {
    setJobDetailVisible(false);
    setShouldRestorePopup(true);
    navigations.navigate('FreelancerProfile', { userId });
  }, [navigations]);

  const handleJobPress = (job: Job) => {

    console.log("job: ", JSON.stringify(job, null, 2));
    setSelectedJob(job);
    setJobDetailVisible(true);
    // Show modal
    // setTimeout(() => {
    //   bottomSheetRef.current?.present();
    // }, 50);
  };
  const workItems = data.filter((items) => items.likedItemType === "Work");

  if (data.length === 0 || !data || workItems.length === 0) {
    return (
      <View className="flex-1 justify-center items-center  px-6">
        <View className="w-48 h-48 bg-background rounded-full justify-center items-center mb-6">
          <Ionicons name="heart-outline" size={64} color="#E5E7EB" />
        </View>
        <Text className="text-xl font-semibold text-textSecondary  mb-2">
          {t('favorites.work.no_favorite')}
        </Text>
        <Text className="text-gray-500 text-center mb-8">
          {t('favorites.work.items_will_appear_here')}
        </Text>

      </View>
    );
  }

  // console.log("selected data: ", JSON.stringify(selectedJob, null, 2));

  return (
    <View className="space-y-3 ">
      {data.filter((items) => items.likedItemType === "Work").map((item) => {

        // console.log('id 1: ', JSON.stringify(item, null, 2));
        // return (
        //   <TouchableOpacity
        //     key={item._id}
        //     activeOpacity={0.9}
        //     onPress={() => handleJobPress(item.likedItem!)}
        //     className="bg-white rounded-2xl border border-gray-200 px-4 py-4 mb-2"
        //   >
        //     {/* Top row: title + time + heart */}
        //     <View className="flex-row justify-between items-start mb-2">
        //       <View className="flex-1 pr-2">
        //         <Text className="font-semibold text-text" numberOfLines={1}>{item.likedItem?.workTitle} </Text>
        //       </View>
        //       <TouchableOpacity onPress={() => handleDeleteFavorite(item._id)}>
        //         <Ionicons name='trash' size={20} color={'#EF4444'} />
        //       </TouchableOpacity>
        //     </View>




        //     {/* Description */}
        //     <Text
        //       numberOfLines={2}
        //       className="text-body mb-3 text-textSecondary"
        //     >
        //       {item.likedItem?.description}
        //     </Text>


        //     {/* Budget + Deadline */}
        //     <View className="">
        //       <View className='flex-row '>
        //         <Text className='font-bold text-warning ml-2'>{item.likedItem?.currency} </Text>
        //         <Text className='font-bold text-primary '>{new Intl.NumberFormat().format(item.likedItem?.budget)}</Text>
        //       </View>
        //     </View>
        //     <View className='flex-row justify-between'>
        //       <View>
        //         <Text className='mt-3 mb-1'>{t('works.post_on')} </Text>
        //         <Text className="text-caption  text-textSecondary">{formatRelativeTime(item.createdAt, currentLanguage)}</Text>
        //       </View>
        //       <View className='flex-row gap-2 items-center'>
        //         <Ionicons name="time-outline" size={18} color="#F59E0B" />
        //         <Text className="text-sm text-textSecondary">{formatDate(item.likedItem?.deadLine as string, currentLanguage)}</Text>
        //       </View>

        //     </View>

        //   </TouchableOpacity>
        // );

        if(item.likedItem === undefined){
          return null
        }

        return (
          <Pressable
            onPress={() => handleJobPress(item.likedItem)}
            className="bg-white rounded-2xl border border-gray-200 px-4 py-4 mb-1"
            // activeOpacity={0.7}
            key={item._id}
          >

            {/* profile of create by1 */}
            <View className=''>

              <View className='flex-row justify-between px-1'>

                <View className="flex-row gap-2 items-center">
                  <Image
                        source={item.likedItem.createdBy.userProfileImage? { uri: BASE_URL + item.likedItem.createdBy.userProfileImage} : profileImage}
                        className="w-10 h-10 rounded-full"
                      />
                  <Text>{item.likedItem.createdBy.firstName} {item.likedItem.createdBy.lastName}</Text>
                </View>
                <View>
                  {/* <Text className="mb-1">{t('works.post_on')}</Text> */}
                  {/* <Text className="text-caption text-textSecondary">
                        {formatRelativeTime(item.likedItem?.createdAt, currentLanguage)}
                      </Text> */}

                  <TouchableOpacity onPress={() => handleDeleteFavorite(item._id)}>
                    <Ionicons name='trash' size={20} color={'#EF4444'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View className='h-[1px] bg-border my-2' />
            </View>
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1 mr-3">
                <Text className="text-body font-semibold text-gray-900" numberOfLines={2}>
                  {item.likedItem?.workTitle}
                </Text>
              </View>

            </View>

            <Text className="text-body text-gray-500 mb-3" numberOfLines={3}>
              {item.likedItem?.description}
            </Text>



            <View className='bg-background px-2 rounded-2xl p-2'>


              <View className=" flex-row items-center  ">

                <Text >{t('postWork.work_type')} : </Text>
                <Text className="text-caption text-text bg-surface p-2 rounded-full  ">
                  {item.likedItem?.kindOfWork === "ONLINE" ? "Online" : "Offline"}
                </Text>
              </View>
              {item.likedItem?.budgetType === 'OFFERING' ? (
                <View className=''>
                  <Text className="text-lg text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
                </View>
              ) : (

                <View className="flex-row items-center">
                  <Text>{t('postWork.budget')} : </Text>
                  <Text className="font-bold text-body text-primary">
                    {new Intl.NumberFormat().format(item.likedItem?.budget)}
                  </Text>
                  <Text className="font-bold text-body text-warning ml-2">{item.likedItem?.currency} </Text>
                </View>

              )}

              <View className="flex-row mt-3 items-center">
                <Text>{t('workDetail.deadline')} : </Text>

                <View className="flex-row gap-2 items-center">
                  <Ionicons name="time-outline" size={18} color="#F59E0B" />
                  <Text className="text-sm text-textSecondary">
                    {formatDate(item.likedItem?.deadLine as string, currentLanguage)}
                  </Text>
                </View>
              </View>
            </View>


          </Pressable>
        )
      })}



      {selectedJob && jobDetailVisible && (
        // <FreelancerJobDetail
        //   visible={jobDetailVisible}
        //   onClose={handleCloseJobDetail}
        //   job={selectedJob as Job || {}}
        //   refetch={refetch}
        //   onUserPress={handleUserProfileNavigation}
        // />

        <JobDetailBottomSheet

          visible={jobDetailVisible}
          // onClose={() => {
          //   setJobDetailVisible(false);
          //   setSelectedJob(null);
          // }}
          onClose={handleCloseJobDetail}
          job={selectedJob as Job}
          refetch={refetch}
          onUserPress={handleUserProfileNavigation}
        />
      )}
    </View>
  );
};

export default PublicWorkCardList;
