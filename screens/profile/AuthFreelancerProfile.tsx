import { useEffect, useRef } from 'react';
import { View,  Animated, ScrollView as RNScrollView } from 'react-native';
import Header from 'components/profile/Header';
import InfoStats from 'components/profile/InfoStats';
import Reviews from 'components/profile/Reviews';
import WhatExpect from 'components/profile/whatExpect';
import VDOPromote from 'components/profile/VDOPromote';
import TabbedProfileSection from 'components/profile/TabbedProfileSection';
import ResumeImage from 'components/profile/ResumeImage';

import LoadingScreen from 'screens/Loading/LoadingScreen';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { RouteProp, useNavigation } from '@react-navigation/native';
import Header_back from 'components/ui/Header_back';
import { useFreelancerById, useFreelancerReviews } from 'hooks/useFreelancer';
import { FreelancerStackParamList } from 'types/navigation';
import { useAuth } from 'hooks/useAuth';
import { useTranslation } from 'react-i18next';

type AuthFreelancerProfileRouteProp = RouteProp<FreelancerStackParamList, 'AuthFreelancerProfile'>;

type Props = {
  route: AuthFreelancerProfileRouteProp;
};
export default function AuthFreelancerProfile({ route }: Props) {

  const routeParams = route.params;
  const { data: profile, isLoading } = useFreelancerById(routeParams.userId);


  const { data: reviews, isLoading: isLoadingReviews } = useFreelancerReviews(profile?._id ? profile._id : '');
 const {user } = useAuth();
    const {t}= useTranslation()

  const navigation = useNavigation();
  const opacity = useRef(new Animated.Value(0.3)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  
  const handleScroll = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Increase opacity instantly on scroll
    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    // Wait 1 second, then fade out to 0.3 slowly
    timeoutRef.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0.3,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  const isOwnProfile = user?._id === profile?._id;
  if (isLoading) return <LoadingScreen />;
  if (!profile) return null;

  return (
    <ScreenWrapper safeEdges={['top', 'bottom']} >


      <Header_back
        text={t('profile.freelancer_profile')}
        // textStyle='text-primary'
        onPress={() => navigation.goBack()}
        iconColor='#3B82F6'
        backgroundColor='bg-surface w-full'

      />
      {/* <View style={{ height: insets.top }} className="bg-white" /> */}

      {/* ✅ Fixed Back Button with Animated Opacity */}


      <RNScrollView
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={handleScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        <View className="bg-white flex-1 " >
          <Header
            userId={profile._id || ''}
            backgroundImage={profile.bannerImage || ''}
            profileImage={profile.userProfileImage || ''}
            name={profile.firstName + ' ' + profile.lastName}
            job={profile.jobTitle || ''}
            rating={profile.starRating || 0}
            status={profile.workerStatus || ''}
           
            ishidden={true}
            isme={isOwnProfile}
          />
          <InfoStats
            success={profile.totalCompletedWork}
            jobs={profile.totalWorks}
            rewards={profile.totalDoingWork}

          />
          <VDOPromote video={profile.videoPromote} context="profile" />

          <TabbedProfileSection profile={profile} stylepadd="" />
          {profile.resumeImage &&
          <ResumeImage resumeImage={profile.resumeImage} />
          }
          <WhatExpect profile={profile} />
          <View className="h-[1px] bg-gray-200 mt-4" />
          <View className='mb-24'>

            <Reviews reviews={reviews || []} />

          </View>

        </View>
      </RNScrollView>
    </ScreenWrapper>
  );
}
