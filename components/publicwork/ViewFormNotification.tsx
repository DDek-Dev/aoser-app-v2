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

} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import ProfileOn_Interested from 'components/profile/ProfileOn_Interested';
import { RouteProp, useNavigation } from '@react-navigation/native';
import ProfileInCommand from './ProfileInCommand';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';

import { Job, Favorite } from 'types';
import { formatDate, getCurrentLanguage } from 'utils/dateFormatter';
import { useCreateFavorite, useDeleteFavorite, useMyProfile } from 'hooks/useFreelancer';
import { usePublicWorkById } from 'hooks/usePublicWork';
import { useTranslation } from 'react-i18next';



type AuthFreelancerProfileRouteProp = RouteProp<FreelancerStackParamList, 'FreelancerWorkDetail'>;


interface JobDetailModalProps {
  visible: boolean;
  onClose: () => void;
  workId: string

}


const ViewFormNotification = ({ workId, visible, onClose }: JobDetailModalProps) => {
  console.log("job id: ", workId);
  const { data: dataWork, refetch } = usePublicWorkById(workId);

  const job = dataWork?.work;
  console.log("job: ", job);

  const navigator = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const animationTimeoutRef = useRef<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>();

  const [isProcessing, setIsProcessing] = useState(false);
  // Add debounce ref to prevent rapid clicks
  const debounceRef = useRef<any>(null);
  const isFirstLoad = useRef(true);
  const [totalLikes, setTotalLikes] = useState(job?.totalLikes || 0);


  const { data, isLoading, isError, error } = useMyProfile();

  const [favoriteId, setFavoriteId] = useState<string | null>(
    job?._id || null
  );
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
  useEffect(() => {
    if (job) {
      if (isFirstLoad.current ||
        isFavorite !== (job?.isLiked || false) ||
        favoriteId !== (job?.myLike?.[0]?._id || null) ||
        totalLikes !== (job?.totalLikes || 0)) {

        setIsFavorite(job?.isLiked || false);
        setFavoriteId(job?.myLike?.[0]?._id || null);
        setTotalLikes(job?.totalLikes || 0);
        isFirstLoad.current = false;
      }
    }
  }, [job?._id, job?.isLiked, job?.myLike?.[0]?._id, job?.totalLikes]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);




  const handleCreateFavorite = useCallback(async () => {
    if (!job?._id || isProcessing) {
      console.log("Job ID is required or already processing");
      return;
    }
    console.log("Creating favorite for job ID:");

    setIsProcessing(true);


    // Optimistic updates
    setIsFavorite(true);
    setTotalLikes(prev => prev + 1);

    try {
      const formData: Favorite = {
        likedItem: job._id,
        likedItemType: "Work",
      };

      const res = await creatFavorite.mutateAsync(formData);

      if (res && (res._id || res.id)) {
        setFavoriteId(res._id || res.id || null);
        // Optionally refetch for server sync
        await refetch();
      } else {
        throw new Error('Invalid response from server');
      }

      console.log("✅ Favorite created:", res);
    } catch (error) {
      // Revert optimistic updates on error
      setIsFavorite(false);
      console.log("❌ Error creating favorite:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [job?._id, isProcessing, totalLikes, isFavorite, creatFavorite, refetch]);


  // Fixed delete favorite handler
  const handleDeleteFavorite = useCallback(async (likeId: string) => {
    if (!likeId || isProcessing) {
      console.log("Favorite ID is required for deletion or already processing");
      return;
    }
    setIsProcessing(true);
    setIsFavorite(false);
    setTotalLikes(prev => Math.max(0, prev - 1));
    setFavoriteId(null);

    try {
      await deleteFavorite.mutateAsync(likeId);
      await refetch();
    } catch (error) {
      setIsFavorite(true);
      console.log("❌ Error deleting favorite:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, totalLikes, isFavorite, favoriteId, deleteFavorite, refetch]);



  // Main toggle handler with debounce protection
  const handleFavoriteToggle = useCallback(() => {
    // Prevent rapid clicking
    if (isProcessing) {
      return;
    }

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Add debounce to prevent multiple rapid clicks
    debounceRef.current = setTimeout(() => {
      const likeId = job?.myLike?.[0]?._id || favoriteId;

      if (isFavorite && likeId) {
        handleDeleteFavorite(likeId);
      } else if (!isFavorite) {
        handleCreateFavorite();
      }
    }, 100); // 100ms debounce
  }, [isFavorite, favoriteId, job?.myLike?.[0]?._id, handleCreateFavorite, handleDeleteFavorite, isProcessing]);

  // Loading state
  const isLoadingFavorite = creatFavorite.isPending || deleteFavorite.isPending || isProcessing;

  if (!visible || !job) return null;

  // Safe property access with fallbacks
  const jobBudget = job?.budget || 0;
  const jobType = job?.kindOfWork || 'Unknown Type';
  const jobDeadline = job?.deadLine || ' Unknown Deadline';
  const jobDescription = job?.description || 'No description available';
  const subwork = job?.subWorkDetails || [];
  const currentLanguage = getCurrentLanguage();

  const { t } = useTranslation();



  // console.log(data.businessType);
  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error fetching freelancee </Text>;


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
      {/* Header */}
      <View
        className="flex-row items-center justify-center py-10 px-4 bg-background  border-b border-border"
        style={{ paddingTop: Platform.OS === 'android' ? 10 : 5 }}
      >
        <View className='items-center flex-row gap-4 absolute right-4'>
          <TouchableOpacity
            onPress={handleFavoriteToggle}
            disabled={isLoadingFavorite}
            className='mr-2'
          >
            <View className="flex-row items-center gap-2">
              {isFavorite ? (
                <Ionicons name="heart" size={28} color="#EF4444" />
              ) : (
                <Ionicons name="heart-outline" size={28} color="#3b82f6" />
              )}

            </View>
          </TouchableOpacity>

        </View>
      </View>

      {/* Content */}


      <BottomSheetScrollView
        className="flex-1 px-4 bg-surface"
        showsVerticalScrollIndicator={false}
        bounces={true}
        contentContainerStyle={{ paddingBottom: 200 }}
      >
        <Text className="text-body font-bold text-text my-3">
          I'm finding for a {job?.workTitle}
        </Text>

        <View className="flex-row items-center mb-4 gap-2">
          <View>
            {job?.budgetType === "FIXED_PRICE" ? (
              <MaterialIcons name="attach-money" size={24} color="gray" />
            ) : (
              <Text className='font-bold text-textSecondary text-lg'>₭</Text>
            )}
          </View>
          <Text className="text-subheading font-bold text-primary">
            {new Intl.NumberFormat().format(jobBudget)}
          </Text>
        </View>

        <View className="flex-row items-center mb-4 gap-2">
          <MaterialIcons name="donut-small" size={24} color="gray" />
          <View className="bg-blue-50 px-3 py-1 rounded-full">
            <Text className="text-primary text-body">{jobType === 'ONLINE' ? t('editWork.workType.online') : t('editWork.workType.offline')}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4 gap-2">
          <MaterialIcons name="alarm" size={24} color="gray" />
          <View className="bg-blue-50 px-3 py-1 rounded-full">
            <Text className="text-primary text-body">{formatDate(jobDeadline, currentLanguage)}</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-4 gap-2">
          <MaterialIcons name="person" size={24} color="gray" />
          <View className="px-3 py-1 rounded-full">
            <Text className="text-primary text-body">
              {job?.totalLikes || 0} Interested
            </Text>
          </View>
        </View>

        <View className='flex-row items-center gap-2 mb-4'>
          <Text className='text-body font-bold text-text'>Detail work</Text>
          <View className='bg-gray-200 flex-1 h-[1px]' />
        </View>

        <View className='bg-blue-100 p-4 rounded-2xl mb-4'>


          <View className="bg-background p-4 rounded-2xl mb-6">
            <Text className="text-textSecondary leading-6">
              {jobDescription}
            </Text>
          </View>

          {subwork.map((section, sectionIndex) => (
            <View key={sectionIndex} className="mb-4 p-3 bg-blue-50 rounded-xl border border-border">
              {/* Section Header */}
              <Text className="text-body font-semibold text-primary mb-2">
                {section.sectionTitle}
              </Text>

              {/* Subtasks */}
              {section.subTask.map((task, taskIndex) => (
                <View key={taskIndex} className="flex-row items-center mb-1 ml-4">
                  <Text className="text-caption mr-1">•</Text>
                  <Text className="flex-1 text-body text-text">
                    {task.title}
                  </Text>
                  <View className={`px-2 py-1 rounded-full ${task.subWorkStatus === 'TODO' ? 'bg-gray-200' :
                    task.subWorkStatus === 'DOING' ? 'bg-blue-200' :
                      task.subWorkStatus === 'DONE' ? 'bg-green-200' :
                        task.subWorkStatus === 'DELAY' ? 'bg-yellow-200' :
                          'bg-red-200'
                    }`}>
                    <Text className="text-caption text-text">
                      {task.subWorkStatus}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>



        <View className='bg-gray-200 w-full h-[1px] mb-4' />
        <Text className='text-body font-bold text-text'>Interested Freelancers</Text>
        {/* {job?.workApplicants?.length > 0 && (
          <ProfileOn_Interested 
            job={job} 
            handleUserProfileNavigation={onUserPress}
            onClose={handleDismiss}
          />
        )} */}
      </BottomSheetScrollView>

      {job?.workApplicants && !job.workApplicants.some(app => app.applicant === data?._id) && (


        <Animated.View
          className="absolute bottom-64 left-4 right-4 rounded-2xl items-center "
        // style={{
        //   transform: [{ translateY: footerAnim }],
        //   zIndex: 5,
        // }}
        >
          {data?.businessType === "FREELANCER" && data?._id !== job.createdBy._id && (
            <TouchableOpacity
              onPress={() => setShowProfile(true)}
              className="bg-primary p-6 rounded-full shadow-md -rotate-45"
              style={styles.blueShadow}
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          )}

          {data?.businessType !== "FREELANCER" && data?._id !== job.createdBy._id && (
            <View className="bg-surface p-4 rounded-2xl items-center shadow-lg" style={styles.blueShadow}>
              <View className="bg-blue-100 p-3 rounded-full mb-3">
                <Ionicons name="rocket-outline" size={28} color="#2563eb" />
              </View>
              <Text className="text-body font-bold text-primary mb-1 text-center">
                Become a Freelancer on Aoser
              </Text>
              <Text className="text-caption text-textSecondary text-center mb-3">
                Set up your freelancer profile and receive job offers.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  handleDismiss();
                  navigator.navigate('FreelancerRoleGate');
                }}
                className="bg-primary px-6 py-3 rounded-xl flex-row items-center space-x-2"

              >
                <Text className="text-surface font-bold text-caption">Start Freelancer Role</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}


      {showProfile && (
        <ProfileInCommand
          jobId={job._id}
          visible={showProfile}
          onClose={() => setShowProfile(false)}
          refetch={refetch}
        />
      )}
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

export default ViewFormNotification;