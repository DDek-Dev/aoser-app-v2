import React, { useEffect, useRef, useState, useMemo, use, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  InteractionManager,
  TouchableWithoutFeedback,
  BackHandler,
  StyleSheet,
  ActivityIndicator,
  Pressable,

} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import ProfileOn_Interested from 'components/profile/ProfileOn_Interested';
import { useNavigation } from '@react-navigation/native';
import ProfileInCommand from 'components/publicwork/ProfileInCommand';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';

import { Job, Favorite, WorkById } from 'types';
import { formatDate, getCurrentLanguage } from 'utils/dateFormatter';
import { useCreateFavorite, useDeleteFavorite, useMyProfile } from 'hooks/useFreelancer';
import ProfileOn_InterestedMyView from 'components/profile/ProfileOn_InterestedMyView';
import ScreenWrapper from 'components/ui/ScreenWrapper';


interface InterestedFreelancerProps {
  visible: boolean;
  onClose: () => void;
  jobs: WorkById | null;
  user?: any;
  refetch: () => void;
  onUserPress: (userId: string) => void;
}


const InterestedFreelancer = ({ visible, onClose, jobs, refetch, onUserPress }: InterestedFreelancerProps) => {
  const job = jobs;
  const navigator = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>();
  // const [favoriteId, setFavoriteId] = useState<string | null>(
  //   job?._id || null
  // );
  const [isProcessing, setIsProcessing] = useState(false);
  // Add debounce ref to prevent rapid clicks
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoad = useRef(true);
  // const [totalLikes, setTotalLikes] = useState(job?.totalLikes || 0);
  const { data, isLoading, isError, error } = useMyProfile();

  // Single animation value for both show/hide and position adjustment
  const footerAnim = useRef(new Animated.Value(200)).current;

  const snapPoints = useMemo(() => ['70%', '100%'], []);
  
  // Calculate base positions
  const basePosition70 = 564
  const basePosition100 = 164

  const creatFavorite = useCreateFavorite();
  const deleteFavorite = useDeleteFavorite();
  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setShowProfile(false);
    }
  }, [visible]);

  // Show/hide modal with proper timing
  useEffect(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }


    animationTimeoutRef.current = setTimeout(() => {
      InteractionManager.runAfterInteractions(() => {
        if (visible && job) {
          bottomSheetModalRef.current?.present();
        } else {
          bottomSheetModalRef.current?.dismiss();
        }
      });
    }, 50);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [visible, job]);

  // Handle Android back button
  useEffect(() => {
    const onBackPress = () => {
      if (currentIndex >= 0) {
        bottomSheetModalRef.current?.dismiss();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [currentIndex]);



  const handleSheetChanges = (index: number) => {
    setCurrentIndex(index);

    // Calculate target position based on snap point
    let targetPosition;
    if (index === -1) {
      targetPosition = 100; // Hide completely
    } else if (index === 1) {
      targetPosition = basePosition100; // At bottom-3 for 100%
    } else {
      targetPosition = basePosition70; // At bottom-24 for 70%
    }

    // Animate footer position
    Animated.timing(footerAnim, {
      toValue: targetPosition,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleDismiss = () => {
    setCurrentIndex(-1);
    Animated.timing(footerAnim, {
      toValue: 100,
      duration: 200,
      useNativeDriver: true,
    }).start();
    onClose();
  };

  // Favorite useeffect

  // Fixed useEffect - sync with job data
  // useEffect(() => {
  //   if (job) {
  //     if (isFirstLoad.current ||
  //       isFavorite !== (job?.isLiked || false) ||
  //       favoriteId !== (job?.myLike?.[0]?._id || null) ||
  //       totalLikes !== (job?.totalLikes || 0)) {

  //       setIsFavorite(job?.isLiked || false);
  //       setFavoriteId(job?.myLike?.[0]?._id || null);
  //       setTotalLikes(job?.totalLikes || 0);
  //       isFirstLoad.current = false;
  //     }
  //   }
  // }, [job?._id, job?.isLiked, job?.myLike?.[0]?._id, job?.totalLikes]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);



  if (!visible || !job) return null;


  // console.log(data.businessType);
  if (isLoading || error) return <ActivityIndicator />;
  if (error) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center p-6 bg-background">
          {/* Icon Container */}
          <View className="w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6">

            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>

          {/* Error Title */}
          <Text className="text-body font-bold text-text mb-2">
            Oops! Something went wrong
          </Text>

          {/* Error Message */}
          <Text className="text-caption text-textSecondary text-center mb-2 px-4">
            We couldn't load the job detail right now
          </Text>

          {/* Technical Error (Optional) */}
          <Text className="text-cation text-gray-400 text-center mb-8 px-4">
            { 'Please try again'}
          </Text>

          {/* Retry Button */}
          <Pressable
            onPress={() => refetch()}
            className="bg-primary px-8 py-4 rounded-xl flex-row items-center active:opacity-80"
          >
            <Text className="text-white font-semibold text-body">Try Again</Text>
          </Pressable>

          {/* Optional: Help Text */}
          <Text className="text-caption text-textSecondary text-center mt-6 px-8">
            If the problem persists, please check your internet connection
          </Text>
        </View>
      </ScreenWrapper>
    );
  }
  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose={true}
      backgroundStyle={styles.modalBackground}
      handleIndicatorStyle={styles.handleIndicator}
      topInset={insets.top}
      android_keyboardInputMode="adjustResize"
      backdropComponent={({ style }) => (
        <TouchableWithoutFeedback onPress={handleDismiss}>
          <View style={[style, styles.backdrop]} />
        </TouchableWithoutFeedback>
      )}
    >


      <BottomSheetScrollView
        className="flex-1 px-4 bg-surface"
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={{ paddingBottom: 200 }}
      >


        <View className='bg-gray-200 w-full h-[1px] mb-4' />
        <Text className='text-body font-bold text-text'>Interested Freelancers</Text>
        {jobs?.applicant.length > 0 && (
          <ProfileOn_InterestedMyView
            job={jobs}
            handleUserProfileNavigation={onUserPress}
            onClose={handleDismiss}
            refetch={refetch}
          />
        )}
      </BottomSheetScrollView>




      {/* {showProfile && (
        <ProfileInCommand
          jobId={job._id}
          visible={showProfile}
          onClose={() => setShowProfile(false)}
          refetch={refetch}
        />
      )} */}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: '#9CA3AF',
    width: 40,
    height: 4,
  },
  backdrop: {
    backgroundColor: '#0000006f',
  },
  blueShadow: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
});

export default InterestedFreelancer;