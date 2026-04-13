import { StyleSheet, Text, View } from 'react-native';
import Header from 'components/profile/Header';
import Reviews from 'components/profile/Reviews';
import VDOPromote from 'components/profile/VDOPromote';
import TabbedProfileSection from 'components/profile/TabbedProfileSection';
import { useUpgradeToFreelancerReview } from 'hooks/useFreelancerKYC';
import { useFreelancerById, useMyProfile } from 'hooks/useFreelancer';
import LoadingScreen from 'screens/Loading/LoadingScreen';

import InfoStats from 'components/profile/InfoStats';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import VideoPlaceholder from 'components/ui/VideoPlaceholder';
import WhatExpect from 'components/profile/whatExpect';

export default function UpgradeToFreelancerReview() {

  const { data: localProfile, isLoading: isLoadingLocal } = useUpgradeToFreelancerReview();
  const { data: myProfile, isLoading: isLoadingMyProfile } = useMyProfile();
  const currentUserId = myProfile?._id || '';
  const { data: dbProfile, isLoading: isLoadingDb } = useFreelancerById(currentUserId);
  const isLocalDraft = !!localProfile;

  // Merge local draft on top of DB, but keep DB optional media if the draft never touched it.
  const profile = (() => {
    if (!localProfile) return dbProfile;
    if (!dbProfile) return localProfile;

    const promoTouched = (localProfile as any).promoVideoTouched === true;
    const certsTouched = (localProfile as any).certificatesTouched === true;

    const mergedVideoPromote = promoTouched
      ? localProfile.videoPromote
      : (localProfile.videoPromote || dbProfile.videoPromote);

    const mergedCertificates = certsTouched
      ? localProfile.certificates
      : ((localProfile.certificates && localProfile.certificates.length > 0) ? localProfile.certificates : dbProfile.certificates);

    return {
      ...dbProfile,
      ...localProfile,
      videoPromote: mergedVideoPromote,
      certificates: mergedCertificates,
    };
  })();
  const isLoading = isLoadingLocal || (!localProfile && (isLoadingMyProfile || (!!currentUserId && isLoadingDb)));

  console.log("profile", profile.videoPromote);
  const { t } = useTranslation();
  if (isLoading) return <LoadingScreen />;
  if (!profile) return null;

  return (
    <View className="bg-white" >
      <Header
        userId={profile._id || ''}
        backgroundImage={profile.bannerImage || ''}
        profileImage={profile.userProfileImage || ""}
        userfileImage={myProfile?.userProfileImage || ""}
        name={profile.firstName + ' ' + profile.lastName}
        job={profile.jobTitle || ''}
        rating={profile.starRating || 0}
        status={(profile.workerStatus || 'ACTIVE') as "ACTIVE" | "INACTIVE" | "SUSPENDED"}
        // busyUntil={profile.busyUntil}
        ishidden={true}
        isReview={isLocalDraft}
      />
      {/* <Hire_Chat_Button userId={''} /> */}
      <View className="flex-row justify-center  items-center px-4 gap-2 w-full selection:mt-4" >
        <View

          className="bg-primary w-[80%] px-6 py-4 rounded-full">
          <Text className="text-white font-semibold text-center">{t('freelancer_profile.hire')}</Text>
        </View>
        <View

          className=" px-4 py-4 rounded-full bg-border">
          <Ionicons name="chatbubble-ellipses" size={28} color="#3b82f6" />
        </View>

      </View>
      <InfoStats
        success={0}
        jobs={0}
        rewards={0}
      />
      {profile.videoPromote ?
        <VDOPromote
          video={profile.videoPromote}
          // isReview={isLocalDraft}
          isReview={false}
          context="profile"
          isScreenFocused={true}
        />
        :
        <VideoPlaceholder />
      }


      <TabbedProfileSection profile={profile} stylepadd="" isReview={isLocalDraft} />
      <WhatExpect profile={profile} />


      <View className="h-[1px] bg-gray-200 mt-4" />


      <View className='mb-24'>

        <Reviews reviews={[]} />

      </View>


    </View>


  );
}



const styles = StyleSheet.create({
  container: {
    width: '100%',        // Changed from 90% to fill card width
    height: 192,
    marginTop: 18,          // h-28 (7 * 16 = 112) to match Image height
    marginBottom: 18,          // h-28 (7 * 16 = 112) to match Image height
    borderRadius: 0,      // Removed border radius since parent handles it
    overflow: 'hidden',
    marginVertical: 0,    // Removed margin to align with card design
    pointerEvents: 'none',  // Changed to allow parent Pressable to receive touches
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
