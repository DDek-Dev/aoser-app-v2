// ProfileOn_Interested.tsx - FIXED VERSION
import TabbedProfileSection from './TabbedProfileSection';
import { Image, Pressable, Text, View } from 'react-native';
import { WorkById } from 'types';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';

import { useUpdateWorkById } from 'hooks/usePublicWork';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';

import { profileImage } from 'assets';
import { useTranslation } from 'react-i18next';


// Import the correct type from your MainNavigator

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL

type NavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'FreelancerProfile'>;

interface ProfileOn_InterestedMyView {
  job: WorkById;
  handleUserProfileNavigation: (userId: string) => void;
  onClose?: () => void;
  refetch?: () => void;
  isFreelancer: boolean;
}

export default function ProfileOn_InterestedMyView({ job, handleUserProfileNavigation, onClose, refetch, isFreelancer }: ProfileOn_InterestedMyView) {

  const navigation = useNavigation<NavigationProp>();
  const updateWorkById = useUpdateWorkById();
  const { t } = useTranslation();
  //   const userIds = useMemo(() => job.applicant.likes, [job.likes]);
  const currentLanguage = getCurrentLanguage();

  console.log('Job data in ProfileOn_InterestedMyView:', JSON.stringify(job, null, 2));
  const handleProfilePress = (userId: string) => {
    try {
      handleUserProfileNavigation(userId);
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };


  const handleHire = async (workId: string, applicantId: string, offerID: string, budget: number) => {
    try {
      // Step 1: Update the work assignment on backend
      await updateWorkById.mutateAsync({
        id: workId,
        data: {
         
          assignedTo: applicantId,
          budget: budget, // Use the updated budget
          requestStatus: "CONFIRM",
          offeringId: offerID
        },

      });

      if (refetch) {
        await refetch();
        console.log('✅ Work data refetched');
      }
       // Step 3: Close the modal
      if (onClose) {
        onClose();
      }

      navigation.navigate('PaymentScreen', {
        workId: workId,
        budget: budget,
        currency: job.work.currency,
        terminalid: job.work.workCode,
        workCode: job.work.workCode,
        invoiceType: "WORK",
      });

      console.log('✅ Work Hired successfully - Assignment created');

      // Step 2: Refetch the work data to get fresh applicants list and assignment
      

     

      // Step 4: Navigate to work detail (with a small delay to allow modal to close smoothly)
      // setTimeout(() => {
      //   console.log('🔄 Navigating to FreelancerWorkDetail');
      //   navigation.navigate('FreelancerWorkDetail', { workId });
      // }, 300);

    } catch (error) {
      console.log('❌ Error Hiring work:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error!',
        textBody: 'Failed to hire freelancer. Please try again.',
      });
    }
  };


  return (
    <>

      {job.applicant.map((item) => (


        <View key={item._id} className="border border-border rounded-lg  mt-4">
          <Pressable onPress={() => handleProfilePress(item.applicant._id)} className='p-4'>
            <View className="flex-row items-center gap-4">
              <Image
                source={
                  item?.applicant.userProfileImage
                    ? { uri: `${IMAGE_BASE}${item.applicant.userProfileImage}` }
                    : profileImage
                }
                className="w-12 h-12 rounded-full"
              />
              <Text>{item.applicant.firstName} {item.applicant.lastName} </Text>
            </View>
          </Pressable>





          <TabbedProfileSection profile={item.applicant as any} stylepadd={'px-4'} />
          {item?.offeringUpdate._id && (
            <>

              <View className="flex-row items-center gap-3 mb-4">
                <View className="flex-1 h-px bg-gray-300" />

                <Text className="text-lg font-bold text-text">
                  {t('workDetail.freelancer_offering')}
                </Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>
              <View className='px-2'>


                <View className="flex-row items-center mb-2">
                  <Text className='font-bold text-body text-text'>{t('postWork.budget')} : </Text>
                  <Text className="font-bold text-body text-warning ml-2">{item?.offeringUpdate?.updateData?.currency} </Text>
                  <Text className="font-bold text-body text-primary">
                    {new Intl.NumberFormat().format(item?.offeringUpdate?.updateData?.budget)}
                  </Text>
                </View>
                <Text className='py-4 font-bold text-body text-text'>{t('workDetail.freelancer_offering_reason')}</Text>
                <View className='bg-blue-50 rounded-2xl px-2 py-6 mb-4'>

                  <Text>{item?.offeringUpdate?.reason}</Text>
                </View>
              </View>
            </>

          )}
          <View className="w-full h-[1px] bg-gray-200" />



          <View className='px-4'>
            {!isFreelancer &&

              <Pressable
                onPress={() => handleHire(job.work._id, item.applicant._id, item?.offeringUpdate?._id, item?.offeringUpdate?.updateData?.budget)}
                className={`px-4 py-3 rounded-full mt-4 ${updateWorkById.isPending ? 'bg-gray-400' : 'bg-primary'}`}
                disabled={updateWorkById.isPending}
              >
                <Text className="text-white text-center">
                  {updateWorkById.isPending ? t('workDetail.hiring') : t('workDetail.hire')}
                </Text>
              </Pressable>
            }
            <Text className="text-gray-400 text-caption py-2 px-4 ">{formatRelativeTime(item.createdAt as string, currentLanguage)}</Text>
          </View>
        </View>

      ))}


    </>

  );
}