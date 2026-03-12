import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Animated, Share, Text, TouchableOpacity, View, ActivityIndicator, Platform } from 'react-native';
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
import TabbedProfileSection from 'components/profile/TabbedProfileSection';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import Header_back from 'components/ui/Header_back';

// Types
import { FreelancerStackParamList } from 'types/navigation';
import { Favorite } from 'types';
import { useAuth } from 'hooks/useAuth';
import FamiliarFreelancers from './FamiliarFreelancer';
import { useTranslation } from 'react-i18next';
import FreelancerSkeleton from 'screens/freelancer/FreelancerSkeleton';

// Constants
const DEBOUNCE_DELAY = 100;
const REFETCH_DELAY = 300; // Delay before refetching to ensure backend updates



export default function FreelancerProfile() {
  // Navigation & Route
  const route = useRoute<RouteProp<FreelancerStackParamList, 'FreelancerProfile'>>();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { userId } = route.params;

  // Hooks
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  // Data fetching hooks
  const { data: profile, isLoading: isLoadingProfile, refetch, error: profileError } = useFreelancerById(userId);
  const { data: reviews, isLoading: isLoadingReviews } = useFreelancerReviews(profile?._id as string);

  // Mutation hooks
  const createFavorite = useCreateFavorite();
  const deleteFavorite = useDeleteFavorite();

  // Local state
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  // Refs
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoad = useRef(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const isFocused = useIsFocused();

  // Derived state
  const isOwnProfile = user?._id === profile?._id;
  const isLoadingFavorite = createFavorite.isPending || deleteFavorite.isPending;

  /**
   * Sync favorite state with profile data on initial load
   * This ensures the UI reflects the server state
   */
  useEffect(() => {
    if (!profile) return;

    if (isFirstLoad.current) {
      setIsFavorite(profile.isLiked ?? false);
      isFirstLoad.current = false;
    }
  }, [profile?.isLiked]);

  /**
   * Cleanup debounce timer on unmount to prevent memory leaks
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
   * 
   * Flow:
   * 1. Optimistically update UI (heart icon fills immediately)
   * 2. Send request to backend
   * 3. Wait for backend to process
   * 4. Refetch to sync with server state
   * 5. Revert on error
   */
  const handleCreateFavorite = useCallback(async () => {
    if (!profile?._id) {
      console.warn('[Favorite] Cannot create: Profile ID missing');
      return;
    }

    // Optimistic update - instant UI feedback
    setIsFavorite(true);

    try {
      const formData: Favorite = {
        likedItem: profile._id,
        likedItemType: 'UserProfile',
      };

      console.log('[Favorite] Creating favorite for:', profile._id);
      const response = await createFavorite.mutateAsync(formData);

      // Wait for backend to process the like
      await new Promise(resolve => setTimeout(resolve, REFETCH_DELAY));

      // Refetch to ensure UI matches server state
      await refetch();
      
      console.log('[Favorite] ✅ Successfully created:', response);
    } catch (error) {
      // Revert optimistic update on error
      setIsFavorite(false);
      console.log('[Favorite] ❌ Error creating:', error);
    }
  }, [profile?._id, createFavorite, refetch]);

  /**
   * Delete favorite with optimistic update
   * 
   * @param likeId - The ID of the like record to delete (from profile.likes array)
   */
  const handleDeleteFavorite = useCallback(
    async (likeId: string) => {
      if (!likeId) {
        console.warn('[Favorite] Cannot delete: Like ID missing');
        return;
      }

      

      console.log('[Favorite] Deleting favorite with ID:', likeId);

      // Optimistic update - instant UI feedback
      setIsFavorite(false);

      try {
        await deleteFavorite.mutateAsync(likeId);

        // Wait for backend to process the unlike
        await new Promise(resolve => setTimeout(resolve, REFETCH_DELAY));

        // Refetch to ensure UI matches server state
        await refetch();
        
        console.log('[Favorite] ✅ Successfully deleted');
      } catch (error) {
        // Revert optimistic update on error
        setIsFavorite(true);
        console.log('[Favorite] ❌ Error deleting:', error);
      }
    },
    [deleteFavorite, refetch]
  );

  /**
   * Toggle favorite with debounce protection
   * 
   * Prevents rapid clicking by debouncing the action.
   * Finds the correct like ID from the profile.likes array.
   */
  const handleFavoriteToggle = useCallback(() => {
  // Clear existing debounce timer
  if (debounceRef.current) {
    clearTimeout(debounceRef.current);
  }

  // Debounce to prevent rapid clicks (spam protection)
  debounceRef.current = setTimeout(() => {
    // Find the like ID where the current user (createdBy) has liked this profile (likedItem)
    const likeId = profile?.likes?.find(
      like => like.createdBy === user?._id 
    )?._id;

    console.log('[Favorite] Toggle action:', { isFavorite, likeId });

    if (isFavorite && likeId) {
      // Unlike: we have the like ID from the server
      handleDeleteFavorite(likeId);
    } else if (!isFavorite) {
      // Like: create new favorite
      handleCreateFavorite();
    }
  }, DEBOUNCE_DELAY);
}, [
  isFavorite,
  profile?._id,
  profile?.likes,
  handleCreateFavorite,
  handleDeleteFavorite,
]);
  /**
   * Navigate to chat room with the freelancer
   */
  const handleNavigateToChat = useCallback(() => {
    console.log('[Navigation] Opening chat with user:', userId);
    navigation.navigate('RoomChat', { userId });
  }, [navigation, userId]);

  /**
   * Navigate back to previous screen
   */
  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  /**
   * Share profile functionality
   * Compatible with both iOS and Android
   */
  const handleShare = useCallback(async () => {
    try {
      const shareUrl = `https://aoser.app/freelancer/${userId}`;
      const shareMessage = t(
        'freelancer_profile.share_message',
        `Check out this freelancer profile on Aoser: ${shareUrl}`
      );

      const result = await Share.share(
        {
          message: Platform.OS === 'ios' ? shareMessage : shareMessage,
          url: Platform.OS === 'ios' ? shareUrl : undefined,
          title: t('freelancer_profile.share_title', 'Freelancer Profile'),
        },
        {
          // iOS only - specify the dialog title
          dialogTitle: t('freelancer_profile.share_dialog', 'Share Profile'),
        }
      );

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('[Share] Shared via:', result.activityType);
        } else {
          console.log('[Share] ✅ Successfully shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('[Share] Dismissed by user');
      }
    } catch (error) {
      console.log('[Share] ❌ Error:', error);
    }
  }, [userId, t]);

  // =================================================================
  // LOADING STATE
  // =================================================================
  if (isLoadingProfile || isLoadingReviews) {
    return (
      <ScreenWrapper safeEdges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'white' }}>
         <FreelancerSkeleton/>
      </ScreenWrapper>
    );
  }

  // =================================================================
  // ERROR STATE - No Profile Found
  // =================================================================
  if (!profile) {
    return (
      <ScreenWrapper safeEdges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'white' }}>
        <View className="flex-1 justify-center items-center px-6 bg-white">
          {/* Icon */}
          <View className="mb-6 bg-blue-50 p-6 rounded-full">
            <Ionicons name="person-outline" size={64} color="#3B82F6" />
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
            {t('freelancer_profile.no_profile_title')}
          </Text>

          {/* Description */}
          <Text className="text-base text-gray-600 text-center mb-8 leading-6">
            {t('freelancer_profile.no_profile_description'
            )}
          </Text>

          {/* Retry Button */}
          <TouchableOpacity
            onPress={() => refetch()}
            disabled={isLoadingProfile}
            className="bg-blue-500 px-8 py-4 rounded-lg flex-row items-center gap-2"
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text className="text-white font-semibold text-base">
              {isLoadingProfile
                ? t('freelancer_profile.loading')
                : t('freelancer_profile.retry')
              }
            </Text>
          </TouchableOpacity>

          {/* Go Back Button */}
          <TouchableOpacity
            onPress={handleGoBack}
            className="mt-4 px-6 py-3"
            activeOpacity={0.7}
          >
            <Text className="text-blue-500 font-medium text-base">
              {t('freelancer_profile.go_back')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }


  // =================================================================
  // MAIN RENDER - Profile Content
  // =================================================================
  return (
    <ScreenWrapper safeEdges={['top', 'bottom']} style={{ flex: 1, backgroundColor: 'white' }}>
        <View className="bg-surface flex-row items-center justify-between w-full">
          <Header_back
            text={t('freelancer_profile.header_back_text', 'Profile')}
            onPress={handleGoBack}
            iconColor="#3B82F6"
            backgroundColor="bg-surface"
          />

          {/* Favorite Button - Only shown to authenticated users */}
          {isAuthenticated && !isOwnProfile && (
            <View className="flex-row mr-8 items-center gap-8 ">
              <TouchableOpacity
                onPress={handleFavoriteToggle}
                disabled={isLoadingFavorite}
                className="mr-2 p-2" // Added padding for better touch target
                activeOpacity={0.7}
                accessibilityLabel={isFavorite ? 'Unlike profile' : 'Like profile'}
                accessibilityRole="button"
                
              >
                {isLoadingFavorite ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : isFavorite ? (
                  <Ionicons name="heart" size={28} color="#EF4444" />
                ) : (
                  <Ionicons name="heart-outline" size={28} color="#3b82f6" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      <Animated.ScrollView
        className="bg-white flex-1"
        showsVerticalScrollIndicator={false}
        // stickyHeaderIndices={[0]}
        bounces={true} // iOS bounce effect
        scrollEventThrottle={16} // Smooth scrolling
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* ===== STICKY HEADER ===== */}

        {/* ===== PROFILE HEADER ===== */}
        <Header
          userId={profile._id}
          backgroundImage={profile.bannerImage}
          profileImage={profile.userProfileImage}
          name={`${profile.firstName} ${profile.lastName}`}
          job={profile.jobTitle || ''}
          rating={profile.starRating || 0}
          status={profile.workerStatus}
          isme={isOwnProfile}
        />

        {/* ===== ACTION BUTTONS ===== */}
        {!isOwnProfile && <Hire_Chat_Button userId={userId} />}

        {/* ===== STATISTICS ===== */}
        <InfoStats
          success={profile.totalCompletedWork || 0}
          jobs={profile.totalWorks || 0}
          rewards={profile.totalDoingWork || 0}
        />

        {/* ===== VIDEO PROMOTION ===== */}
   
        {profile.videoPromote && <VDOPromote video={profile.videoPromote} context="profile" scrollY={scrollY} isScreenFocused={isFocused} />}

        {/* ===== TABBED PROFILE SECTION ===== */}
        <TabbedProfileSection profile={profile} stylepadd="" />

        

        {/* ===== WHAT TO EXPECT ===== */}
        <WhatExpected profile={profile} />

        {/* ===== REVIEWS SECTION ===== */}
        <View className="mb-24">
          <Reviews reviews={reviews || []} />
        </View>

        {/* ===== SIMILAR FREELANCERS ===== */}
        <FamiliarFreelancers title={t('freelancer_profile.similar_Freelancer')} scrollY={scrollY} />

        {/* Bottom Spacing for Floating Buttons */}
        <View className="mb-32" />
      </Animated.ScrollView>

      {/* ===== FLOATING ACTION BUTTONS ===== */}
      {/* {!isOwnProfile && (
        <FloatingProfileButtons
          onShare={handleShare}
          onMessage={handleNavigateToChat}
        />
      )} */}
    </ScreenWrapper>
  );
}