
import TabbedProfileSection from './TabbedProfileSection';
import { Image, Pressable, Text, View } from 'react-native';
import { Job } from 'types';
import { useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
import { useUpdateWorkById } from 'hooks/usePublicWork';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { useAuth } from 'hooks/useAuth';
import { profileImage } from 'assets';
import { useTranslation } from 'react-i18next';

// Import the correct type from your MainNavigator

const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL

type NavigationProp = NativeStackNavigationProp<FreelancerStackParamList, 'FreelancerProfile'>;

interface ProfileOn_InterestedProps {
  job: Job;
  handleUserProfileNavigation: (userId: string) => void;
  onClose?: () => void;
}

export default function ProfileOn_Interested({ job, handleUserProfileNavigation, onClose }: ProfileOn_InterestedProps) {

  const navigation = useNavigation<NavigationProp>();
  const updateWorkById = useUpdateWorkById();


  const currentLanguage = getCurrentLanguage();
  const { user } = useAuth();
  const { t } = useTranslation();
  const handleProfilePress = (userId: string) => {
    try {

      handleUserProfileNavigation(userId);
    } catch (error) {
      console.log('Navigation error:', error);
    }
  };


  const handleHire = async (workId: string) => {
    try {
      // Use the mutation properly
      await updateWorkById.mutateAsync({
        id: workId,
        data: {
          workStatus: 'ASSIGNED_WORKER',
          assignedTo: job.workApplicants[0].applicant
        }
      });

      console.log('✅ Work Hired successfully');

      // Close parent modal first, then navigate to work detail
      if (onClose) {
        onClose();
      }

      // Navigate to FreelancerWorkDetail with the workId
      setTimeout(() => {
        navigation.navigate('FreelancerWorkDetail', { workId });
      }, 300); // Small delay to allow modal to close smoothly

    } catch (error) {
      console.log('❌ Error Hiring work:', error);
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: 'Error!',
        textBody: 'Failed to hire freelancer. Please try again.',
      });
    }
  };


  if (job.workApplicants.length === 0) {
    return null
  }

  return (
    <>

     

      {job.workApplicants.map((applicant) => (
        <View key={applicant.applicantProfile._id} className="border border-gray-200 rounded-lg mt-6">
          <Pressable onPress={() => handleProfilePress(applicant.applicantProfile._id)} className='p-4'>
            <View className="flex-row items-center gap-4">
              <Image
                source={
                  applicant.applicantProfile?.userProfileImage
                    ? { uri: `${IMAGE_BASE}${applicant.applicantProfile.userProfileImage}` }
                    : profileImage
                }
                className="w-12 h-12 rounded-full"
              />
              <Text>{applicant.applicantProfile.firstName} {applicant.applicantProfile.lastName}</Text>
            </View>
          </Pressable>
          <TabbedProfileSection profile={applicant.applicantProfile as any} stylepadd={'px-4'} />
          <View className="w-full h-[1px] bg-gray-200" />

          <View className='px-4'>
            {job.createdBy._id === user?._id && (
              <Pressable
                onPress={() => handleHire(job._id)}
                className={`px-4 py-3 rounded-full mt-4 ${updateWorkById.isPending ? 'bg-gray-400' : 'bg-primary'}`}
                disabled={updateWorkById.isPending}
              >
                <Text className="text-white text-center">
                  {updateWorkById.isPending ? `${t('workDetail.hiring')}` : `${t('workDetail.hire')}`}
                </Text>
              </Pressable>
            )}
            <Text className="text-gray-400 text-caption py-2 px-4">
              {formatRelativeTime(applicant.updatedAt as string, currentLanguage)}
            </Text>
          </View>
        </View>
      ))}
    </>

  );
}