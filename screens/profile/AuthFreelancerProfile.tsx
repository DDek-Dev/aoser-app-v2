import { useEffect, useRef } from 'react';
import { View, Animated, Pressable, Text } from 'react-native';
import Header from 'components/profile/Header';
import InfoStats from 'components/profile/InfoStats';
import Reviews from 'components/profile/Reviews';
import WhatExpect from 'components/profile/whatExpect';
import VDOPromote from 'components/profile/VDOPromote';
import TabbedProfileSection from 'components/profile/TabbedProfileSection';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { RouteProp, useNavigation, useIsFocused } from '@react-navigation/native';
import Header_back from 'components/ui/Header_back';
import { useFreelancerById, useFreelancerReviews } from 'hooks/useFreelancer';
import { FreelancerStackParamList } from 'types/navigation';
import { useAuth } from 'hooks/useAuth';
import { useTranslation } from 'react-i18next';
import FreelancerSkeleton from 'screens/freelancer/FreelancerSkeleton';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Sparkles } from 'lucide-react-native';

type AuthFreelancerProfileRouteProp = RouteProp<FreelancerStackParamList, 'AuthFreelancerProfile'>;

type Props = {
  route: AuthFreelancerProfileRouteProp;
};

export default function AuthFreelancerProfile({ route }: Props) {
  const routeParams = route.params;
  const { data: profile, isLoading } = useFreelancerById(routeParams.userId);
  const { data: reviews, isLoading: isLoadingReviews } = useFreelancerReviews(
    profile?._id ? profile._id : ''
  );
  const { user } = useAuth();
  const { t } = useTranslation();
  const isFocused = useIsFocused(); // ← stop video when navigating away

  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  // ── Scroll indicator opacity animation ───────────────────────────────────
  const opacity = useRef(new Animated.Value(0.3)).current;
  const timeoutRef = useRef<any>(null);

  // ── scrollY Animated.Value — passed to VDOPromote for visibility detection
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleScrollOpacity = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    Animated.timing(opacity, {
      toValue: 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

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

  if (isLoading) {
    return (
      <ScreenWrapper safeEdges={['top', 'bottom']}>
        <View>
          <FreelancerSkeleton />
        </View>
      </ScreenWrapper>
    );
  }

  if (!profile) return null;

  return (
    <ScreenWrapper safeEdges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 py-2 bg-surface">
        <Header_back
          text={t('profile.freelancer_profile')}
          onPress={() => navigation.popToTop()}
          iconColor="#3B82F6"
          backgroundColor="bg-surface"
        />

        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Sparkles size={24} color="#F59E0B" />
            <Text className="text-lg font-semibold text-text">
              {profile.recommendStar || 0}
            </Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('AuthFreelancerSetting')}
            className="bg-border p-3 rounded-full"
          >
            <Ionicons name="settings-outline" size={24} color="#3B82F6" />
            {profile.kycInfoStatus === '' ||  profile.kycInfoStatus === 'PENDING' &&
            
            <View className="text-cation absolute -top-1 bg-error right-1 h-2 w-2 rounded-full"/>
            }
          </Pressable>
        </View>
      </View>

      {/* ✅ Animated.ScrollView so scrollY tracks position for VDOPromote */}
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: handleScrollOpacity, // ← opacity animation piggybacks here
          }
        )}
      >
        <View className="bg-white flex-1">
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

          {/* ✅ Pass scrollY + isFocused so VDOPromote can detect visibility */}
          <VDOPromote
            video={profile.videoPromote}
            context="profile"
            scrollY={scrollY}
            isScreenFocused={isFocused}
          />

          <TabbedProfileSection profile={profile} stylepadd="" />

          <WhatExpect profile={profile} />

          <View className="h-[1px] bg-gray-200 mt-4" />

          <View className="mb-24">
            <Reviews
              reviews={reviews || []}
              totalStartRate={profile.totalStartRate || 0}
            />
          </View>
        </View>
      </Animated.ScrollView>
    </ScreenWrapper>
  );
}