import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Share, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Hooks
import {
  useCreateFavorite,
  useDeleteFavorite,
  useFreelancerById,
  useFreelancerReviews,
} from 'hooks/useFreelancer';

// Components
import Header from 'components/profile/Header';
import InfoStats from 'components/profile/InfoStats';
import Reviews from 'components/profile/Reviews';
import Hire_Chat_Button from './Hire_Chat_Button';
import WhatExpected from 'components/profile/whatExpect';
import VDOPromote from 'components/profile/VDOPromote';
// import Freelancers from './Freelancers';
import TabbedProfileSection from 'components/profile/TabbedProfileSection';
import ResumeImage from 'components/profile/ResumeImage';
import FloatingProfileButtons from 'components/profile/FloatingProfileButtons';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';

// Types
import { FreelancerStackParamList } from 'types/navigation';
import { Favorite } from 'types';
import { useAuth } from 'hooks/useAuth';
import FamiliarFreelancers from './FamiliarFreelancer';
import { useTranslation } from 'react-i18next';


const DEBOUNCE_DELAY = 100;

export default function FreelancerProfile() {
  const route = useRoute<RouteProp<FreelancerStackParamList, 'FreelancerProfile'>>();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { userId } = route.params;

  // Data fetching hooks
  const { data: profile, isLoading: isLoadingProfile, refetch } = useFreelancerById(userId);
  const { data: reviews, isLoading: isLoadingReviews } = useFreelancerReviews(profile?._id as string);
const {user , isAuthenticated} = useAuth();
  // Mutation hooks
  const createFavorite = useCreateFavorite();
  const deleteFavorite = useDeleteFavorite();

  // State management
  const [favoriteState, setFavoriteState] = useState({
    isFavorite: false,
    favoriteId: userId,
    totalLikes: 0,
    isProcessing: false,
  });

  // Refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoad = useRef(true);

  // Derived state
  const isOwnProfile = user?._id === profile?._id;
  const isLoadingFavorite = createFavorite.isPending || deleteFavorite.isPending || favoriteState.isProcessing;


  const {t} = useTranslation();
  /**
   * Sync favorite state with profile data
   */
  useEffect(() => {
    if (!profile) return;

    const shouldUpdate =
      isFirstLoad.current ||
      favoriteState.isFavorite !== (profile.isLiked || false) ||
      favoriteState.favoriteId !== (profile._id || null) ||
      favoriteState.totalLikes !== (profile.totalLikes || 0);

    if (shouldUpdate) {
      setFavoriteState({
        isFavorite: profile.isLiked || false,
        favoriteId: profile._id || '',
        totalLikes: profile.totalLikes || 0,
        isProcessing: false,
      });
      isFirstLoad.current = false;
    }
  }, [profile?._id, profile?.isLiked, profile?.totalLikes]);

  /**
   * Cleanup debounce timer on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  /**
   * Create favorite with optimistic update
   */
  const handleCreateFavorite = useCallback(async () => {
    if (!profile?._id || favoriteState.isProcessing) {
      console.log('Profile ID required or already processing');
      return;
    }

    // Optimistic update
    setFavoriteState((prev) => ({
      ...prev,
      isFavorite: true,
      totalLikes: prev.totalLikes + 1,
      isProcessing: true,
    }));

    try {
      const formData: Favorite = {
        likedItem: profile._id,
        likedItemType: 'UserProfile',
      };

      const response = await createFavorite.mutateAsync(formData);

      if (response?._id || response?.id) {
        setFavoriteState((prev) => ({
          ...prev,
          favoriteId: response._id || response.id || null,
          isProcessing: false,
        }));
        await refetch();
        console.log('✅ Favorite created:', response);
      } else {
        throw new Error('Invalid server response');
      }
    } catch (error) {
      // Revert optimistic update
      setFavoriteState((prev) => ({
        ...prev,
        isFavorite: false,
        totalLikes: Math.max(0, prev.totalLikes - 1),
        isProcessing: false,
      }));
      console.log('❌ Error creating favorite:', error);
    }
  }, [profile?._id, favoriteState.isProcessing, createFavorite, refetch]);

  /**
   * Delete favorite with optimistic update
   */
  const handleDeleteFavorite = useCallback(
    async (likeId: string) => {
      if (!likeId || favoriteState.isProcessing) {
        console.log('Favorite ID required or already processing');
        return;
      }

      // Optimistic update
      setFavoriteState((prev) => ({
        ...prev,
        isFavorite: false,
        totalLikes: Math.max(0, prev.totalLikes - 1),
        favoriteId: null,
        isProcessing: true,
      } as any));

      try {
        await deleteFavorite.mutateAsync(likeId);
        await refetch();
        setFavoriteState((prev) => ({ ...prev, isProcessing: false }));
        console.log('✅ Favorite deleted');
      } catch (error) {
        // Revert optimistic update
        setFavoriteState((prev) => ({
          ...prev,
          isFavorite: true,
          totalLikes: prev.totalLikes + 1,
          favoriteId: likeId,
          isProcessing: false,
        }));
        console.log('❌ Error deleting favorite:', error);
      }
    },
    [favoriteState.isProcessing, deleteFavorite, refetch]
  );

  /**
   * Toggle favorite with debounce protection
   */
  const handleFavoriteToggle = useCallback(() => {
    if (favoriteState.isProcessing) return;

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce to prevent rapid clicks
    debounceRef.current = setTimeout(() => {
      const likeId = profile?._id || favoriteState.favoriteId;

      if (favoriteState.isFavorite && likeId) {
        handleDeleteFavorite(likeId);
      } else if (!favoriteState.isFavorite) {
        handleCreateFavorite();
      }
    }, DEBOUNCE_DELAY);
  }, [
    favoriteState.isFavorite,
    favoriteState.favoriteId,
    favoriteState.isProcessing,
    profile?._id,
    handleCreateFavorite,
    handleDeleteFavorite,
  ]);

  /**
   * Navigate to chat room
   */
  const handleNavigateToChat = useCallback(() => {
    console.log("hshs")
    navigation.navigate('RoomChat', { userId });
  }, [navigation, userId]);

  /**
   * Navigate back
   */
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // Loading state
  if (!profile || isLoadingProfile || isLoadingReviews) {
    return null;
  }

  const handleShare = async () => {
  try {
    const result = await Share.share({
      message: `Check out this freelancer profile on Aoser: https://aoser.app/freelancer/${userId}`,
      title: 'Freelancer Profile',
      url: `https://aoser.app/freelancer/${userId}`, // optional
    });

    if (result.action === Share.sharedAction) {
      if (result.activityType) {
        console.log('Shared with activity type:', result.activityType);
      } else {
        console.log('Shared successfully!');
      }
    } else if (result.action === Share.dismissedAction) {
      console.log('Share dismissed');
    }
  } catch (error) {
    console.log('Error sharing:', error);
    // Alert.alert('Error', 'Unable to share this profile.');
  }
};

  return (
    <ScreenWrapper safeEdges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView
        className="bg-white flex-1"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* Header Section */}
        <View className="bg-white z-10 flex-row items-center justify-between w-full">
          <Header_back
            text={t('freelancer_profile.header_back_text')}
            onPress={handleGoBack}
            iconColor="#3B82F6"
            backgroundColor="bg-surface"
          />
          
          {/* Favorite Button */}
          {isAuthenticated && (

          <View className="flex-row mr-8 items-center gap-8">
            <View className="items-center flex-row gap-4 absolute right-4">
              <TouchableOpacity
                onPress={handleFavoriteToggle}
                disabled={isLoadingFavorite}
                className="mr-2"
                activeOpacity={0.7}
              >
                <Ionicons
                  name={favoriteState.isFavorite ? 'heart' : 'heart-outline'}
                  size={28}
                  color={favoriteState.isFavorite ? '#EF4444' : '#3b82f6'}
                />
              </TouchableOpacity>
            </View>
          </View>
          )}
        </View>

        {/* Profile Header */}
        <Header
          userId={profile._id}
          backgroundImage={profile.bannerImage}
          profileImage={profile.userProfileImage}
          name={`${profile.firstName} ${profile.lastName}`}
          job={profile.jobTitle || ''}
          rating={profile.starRating || 0}
          status={profile.workerStatus}
          isme={isOwnProfile || false}
        />

        {/* Action Buttons */}
        <Hire_Chat_Button userId={userId} />

        {/* Statistics */}
        <InfoStats
          success={profile.totalCompletedWork}
          jobs={profile.totalWorks}
          rewards={profile.totalDoingWork}
        />

        {/* Video Promotion */}
        <VDOPromote video={profile.videoPromote} />

        {/* Tabbed Profile Section */}
        <TabbedProfileSection profile={profile} stylepadd="" />

        {/* Resume Image */}
        <ResumeImage resumeImage={profile.resumeImage} />

        {/* What to Expect */}
        <WhatExpected profile={profile} />

        {/* Reviews Section */}
        <View className="mb-24">
          <Reviews reviews={reviews || []} />
        </View>

        {/* Similar Freelancers */}
        <FamiliarFreelancers title={t('freelancer_profile.similar_Freelancer')}/>

        {/* Bottom Spacing */}
        <View className="mb-64" />
      </ScrollView>

      {/* Floating Action Buttons */}
      <FloatingProfileButtons
        onShare={() => {handleShare()}}
        onMessage={handleNavigateToChat}
      />
    </ScreenWrapper>
  );
}