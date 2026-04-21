import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  BackHandler,
  KeyboardAvoidingView,

} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
// import ProfileOn_Interested from 'components/profile/ProfileOn_Interested';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';

import { Job, Favorite } from 'types';
import { formatDisplayDateTime } from 'utils/dateFormatter';
import { useCreateFavorite, useDeleteFavorite, useMyProfile } from 'hooks/useFreelancer';
import { useTranslation } from 'react-i18next';
import { useAuth } from 'hooks/useAuth';
import BudgetInput from 'components/ui/BudgetInput';
import TextArea from 'components/ui/TextArea';
import { useFreelancerApplyWork, useFreeLRequestUpdateW } from 'hooks/usePublicWork';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';



interface JobDetailModalProps {
  visible: boolean;
  onClose: () => void;
  job: Job | null;
  user?: any;
  refetch: () => void;
  onUserPress?: (userId: string) => void;
}


const JobDetailModal = ({ visible, onClose, job, refetch, onUserPress }: JobDetailModalProps) => {
  const navigator = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  // const [showProfile, setShowProfile] = useState(false);
  const [isFavorite, setIsFavorite] = useState<boolean>();
  const [close, setClose] = useState<boolean>(true);
  const [favoriteId, setFavoriteId] = useState<string | null>(
    job?._id || null
  );
  // form reason 
  const [isApplyLoading, setIsApplyLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [budget_offer, setBudget_offer] = useState(0);
  const [budgetCurrency, setBudgetCurrency] = useState<'LAK' | 'USD'>('LAK');
  const [error_offer, serError_offer] = useState({
    reason: false,
    budget: false,
  })
  const freeLRequestUpdateWMutation = useFreeLRequestUpdateW();
  const applyWorkMutation = useFreelancerApplyWork();
  // process
  const [isProcessing, setIsProcessing] = useState(false);
  // Add debounce ref to prevent rapid clicks
  const debounceRef = useRef<any>(null);
  const isFirstLoad = useRef(true);
  const [totalLikes, setTotalLikes] = useState(job?.totalLikes || 0);
  const { data, isLoading, isError, error } = useMyProfile();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const isOwner = !!(data?._id && job?.createdBy?._id && data._id === job.createdBy._id);
  const hasApplied = !!job?.workApplicants?.some(app => app.applicant === data?._id);
  const canApply =
    !!job &&
    data?.businessType === 'FREELANCER' &&
    data?.registrationStatus === 'APPROVED_COMPLETE' &&
    !isOwner;

  // Single animation value for both show/hide and position adjustment
  const footerAnim = useRef(new Animated.Value(200)).current;

  const snapPoints = useMemo(() => ['100%'], []);
  const scrollViewRef = useRef(null);
  // Calculate base positions
  const basePosition70 = 564
  const basePosition100 = 164

  const creatFavorite = useCreateFavorite();
  const deleteFavorite = useDeleteFavorite();
  // Reset state when modal closes
  // useEffect(() => {
  //   if (!visible) {
  //     setShowProfile(false);
  //   }
  // }, [visible]);


  // Show/hide bottom sheet quickly (avoid extra delays)
  useEffect(() => {
    if (!visible) {
      bottomSheetModalRef.current?.dismiss();
      return;
    }

    const raf = requestAnimationFrame(() => {
      bottomSheetModalRef.current?.present();
    });

    return () => cancelAnimationFrame(raf);
  }, [visible]);

  // Reset offering inputs when opening a new job
  useEffect(() => {
    if (!visible || !job) return;
    setReason('');
    setBudget_offer(0);
    setBudgetCurrency(job.currency || 'LAK');
    serError_offer({ reason: false, budget: false });
  }, [visible, job?._id]);

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        handleDismiss();
        return true; // true = we handled it, prevents default back navigation
      }
      return false; // false = let the system handle it
    });

    return () => subscription.remove();
  }, [visible]);

  // Handle Android back button


  const handleSheetChanges = (index: number) => {


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
      return;
    }
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

  // Safe property access with fallbacks
  const jobBudget = job?.budget || 0;
  const jobType = job?.kindOfWork || 'Unknown Type';
  const jobDescription = job?.description || 'No description available';
  const subwork = job?.subWorkDetails || [];
  const handleApply = async () => {
    if (!job?._id) return;
    const trimmedReason = reason.trim();
    const hasReason = trimmedReason.length > 0;
    const hasBudget = (budget_offer || 0) > 0;

    // Validation: both empty is OK (no offering). If one is provided, require both.
    if ((hasReason && !hasBudget) || (!hasReason && hasBudget)) {
      serError_offer({
        reason: !hasReason,
        budget: !hasBudget,
      });
      return;
    }

    serError_offer({ reason: false, budget: false });

    try {
      setIsApplyLoading(true);


      // Only send offering when both values are provided
      if (hasReason && hasBudget) {
        const updateDatas = {
          reason: trimmedReason,
          updateData: {

            budget: budget_offer,
            currency: budgetCurrency,
          }

        };
        await freeLRequestUpdateWMutation.mutateAsync({
          id: job._id,
          data: updateDatas
        });
      }
      await applyWorkMutation.mutateAsync({
        workId: job._id,
      });
      await refetch();
      // onClose();

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t('common.success') || 'Success',
      });
    } catch (applyError: any) {
      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('common.error') || 'Failed',
        textBody:

          t('profile_in_command.apply_failed') ||
          'Failed to apply for this work. Please try again.',
      });
    } finally {
      setIsApplyLoading(false);
    }
  };
  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPoints}
      // onChange={handleSheetChanges}
      onDismiss={handleDismiss}
      enablePanDownToClose={true}
      // backgroundStyle={styles.modalBackground}
      // handleIndicatorStyle={styles.handleIndicator}
      topInset={insets.top}
      android_keyboardInputMode="adjustResize"

      // backdropComponent={({ style }) => (
      //   <TouchableWithoutFeedback onPress={handleDismiss}>
      //     <View style={[style, styles.backdrop]} />
      //   </TouchableWithoutFeedback>
      // )}
      keyboardBehavior="interactive"        // ← add this
      keyboardBlurBehavior="restore"
      enableDynamicSizing={false}

    >
      {/* Header */}

      {isAuthenticated && (

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
      )}

      {/* Content */}



      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      >
        <BottomSheetScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={{
            paddingBottom: canApply && !hasApplied
              ? insets.bottom + 100
              : insets.bottom + 24,
          }}
        >



          <View className="px-2">


            {/* Job Title */}
            <Text className="text-xl font-bold text-text my-6 ">
              {job?.workTitle}
            </Text>

            {/* Key Info Cards */}
            <View className=" rounded-2xl p-4 mb-6">
              {/* Budget - Most Important Info First */}
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-border">
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-2 rounded-lg">
                    <MaterialIcons name="wallet" size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-body text-text">{t('postWork.budget')}</Text>
                </View>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-2xl font-bold text-primary">
                    {new Intl.NumberFormat().format(jobBudget)}
                  </Text>
                  <Text className="text-body font-semibold text-warning">{job?.currency}</Text>
                </View>
              </View>

              {/* Work Type */}
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-border">
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-2 rounded-lg">
                    <MaterialIcons name="donut-small" size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-body text-text">{t('workDetail.kind_of_work')}</Text>
                </View>
                <View className={`px-4 py-2 rounded-full bg-primary`}>
                  <Text className={`text-sm font-semibold text-surface`}>
                    {jobType === "ONLINE" ? t('editWork.workType.online') : t('editWork.workType.offline')}
                  </Text>
                </View>
              </View>

              {/* Deadline */}
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-border">
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-2 rounded-lg">
                    <MaterialIcons name="date-range" size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-body text-text">{t('postWork.from')}</Text>
                </View>
                <Text className="text-sm font-semibold text-text">
                  {formatDisplayDateTime(job?.startDate as string)}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-border">
                <View className="flex-row items-center gap-3">
                  <View className="bg-primary/10 p-2 rounded-lg">
                    <MaterialIcons name="date-range" size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-body text-text">{t('postWork.to')}</Text>
                </View>
                <Text className="text-sm font-semibold text-text">
                  {formatDisplayDateTime(job?.deadLine as string)}
                </Text>
              </View>

              {/* Interested Freelancers */}
              {/* <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-border">
            <View className="flex-row items-center gap-3">
              <View className="bg-primary/10 p-2 rounded-lg">
                <MaterialIcons name="person" size={24} color="#3b82f6" />
              </View>
              <Text className="text-body text-text">
                {t('workDetail.interested_freelancers')}
              </Text>
            </View>
            <View className="bg-primary/20 px-3 py-1.5 rounded-full">
              <Text className="text-sm font-bold text-primary">
                {job?.workApplicants?.length || 0}
              </Text>
            </View>
          </View> */}

              {job?.address &&
                job?.address.village !== '' &&
                job?.address.district !== '' &&
                job?.address.province !== '' &&
                <View className="flex-row mt-3 items-center  pb-4 border-b border-border">
                  <View className="flex-row items-center">
                    <View className="p-2 rounded-xl bg-error/10 items-center justify-center mr-3">
                      <Ionicons name="location-outline" size={24} color="#F59E0B" />
                    </View>

                    <View className="flex-1">
                      {/* <Text className="text-caption text-textSecondary mb-0.5">{t('payment_success.address')}  </Text> */}

                      <Text className="text-body text-text ">
                        {job.address.village}, {job.address.district}, {job.address.province}

                      </Text>
                    </View>


                  </View>
                </View>
              }

              {job?.place && (



                <View className="flex-row mt-3 items-center  pb-4 border-b border-border">
                  <View className="flex-row items-center">
                    <View className="p-2 rounded-xl bg-error/10 items-center justify-center mr-3">
                      <Ionicons name="location-outline" size={24} color="#F59E0B" />
                    </View>

                    <View className="flex-1">
                      {/* <Text className="text-caption text-textSecondary mb-0.5">{t('payment_success.address')}  </Text> */}

                      <Text className="text-body text-text ">
                        {job?.place}

                      </Text>
                    </View>


                  </View>
                </View>

              )}
            </View>

            {/* Work Detail Section Header */}
            <View className="flex-row items-center gap-3 mb-4">

              <Text className="text-lg font-bold text-text">
                {t('postWork.work_description')}
              </Text>
              <View className="flex-1 h-px bg-gray-300" />
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


            {canApply && (
              <>
                {/* Offering form */}
                <View className="flex-row items-center gap-3 mb-4">
                  <View className="flex-1 h-px bg-gray-300" />

                  <Text className="text-lg font-bold text-text">
                    {t('chat.offer.your_offering')}
                  </Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View>

                {!hasApplied ? (
                  <View>
                    <BudgetInput
                      label={t('postWork.budget')}
                      value={budget_offer}
                      onChange={(value) => {
                        setBudget_offer(value);
                        serError_offer(prev => ({ ...prev, budget: false }));
                      }}
                      currency={budgetCurrency}
                      onCurrencyChange={setBudgetCurrency}
                      error={error_offer.budget}
                      isValidate={error_offer.budget ? t('postWork.budget_required') : ''}
                    />

                    <View className="mt-2">
                      <TextArea
                        label={t('postWork.work_description_reason')}
                        placeholder={t('postWork.work_description_placeholder_reason')}
                        value={reason}
                        onChangeText={(text) => {
                          setReason(text);
                          serError_offer(prev => ({ ...prev, reason: false }));
                        }}
                        inputClassName={`${error_offer.reason ? 'border-error' : 'border-border'}`}
                        isValidate={`${error_offer.reason ? `${t('postWork.work_description_required')}` : ''}`}
                      />
                    </View>
                  </View>
                ) : (
                  <View className="bg-blue-50 border border-primary rounded-xl p-4 mb-2">
                    <Text className="text-body text-text">
                      {t('workDetail.already_applied') || 'You already applied for this job.'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
          {/* {isOwner && job?.workApplicants?.length > 0 && (
          <>
            <ProfileOn_Interested
              job={job}
              handleUserProfileNavigation={onUserPress}
              onClose={handleDismiss}
            />
          </>
        )} */}






        </BottomSheetScrollView>

        {canApply && !hasApplied && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: insets.bottom + 24,
              backgroundColor: 'transparent',
            }}
          >
            <TouchableOpacity
              onPress={handleApply}
              disabled={isApplyLoading}
              className={`bg-primary p-4 mx-4 rounded-full shadow-md ${isApplyLoading ? 'opacity-60' : ''}`}
            // style={styles.blueShadow}
            // style={{ marginBottom: insets.bottom}}
            >
              {isApplyLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <View className='flex-row gap-2 items-center justify-center'>
                  <Text className='text-surface'>{t('workDetail.apply_now')}</Text>

                  {/* <Ionicons name="send" size={24} color="white" className='-rotate-45' /> */}
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>


      {job?.workApplicants && !hasApplied && (

        <>
          <Animated.View
            pointerEvents="box-none"
            className="absolute bottom-[10rem] left-4 right-4 rounded-2xl items-center "
          >

            {data?.businessType !== "FREELANCER" && data?.registrationStatus !== 'APPROVED_COMPLETE' && data?._id !== job?.createdBy?._id && (
              <View
                pointerEvents="box-none"
                className="bg-surface p-4 rounded-2xl items-center shadow-lg w-[100%]"
                style={styles.blueShadow}
              >
                <View className="bg-blue-100 p-3 rounded-full mb-3">
                  <Ionicons name="rocket-outline" size={28} color="#2563eb" />
                </View>
                <Text className="text-body font-bold text-primary mb-1 text-center">
                  {t('workDetail.become_freelancer_role')}
                </Text>
                <Text className="text-caption text-textSecondary text-center mb-3">
                  {t('workDetail.set_up_freelancer_role')}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handleDismiss();
                    navigator.navigate('FreelancerRoleGate');
                  }}
                  className="bg-primary px-6 py-3 rounded-xl flex-row items-center space-x-2"

                >
                  <Text className="text-surface font-bold text-caption">{t('workDetail.start_freelancer_role')}</Text>
                  <Ionicons name="arrow-forward" size={18} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {data?.businessType === 'FREELANCER' && data?.registrationStatus === 'REJECTED' && close && (

              <View pointerEvents="box-none" className="flex-1 items-center justify-center p-4 bg-primary rounded-2xl">

                <Pressable
                  onPress={() => setClose(false)}
                  className='self-end bg-border rounded-full'>
                  <Ionicons name='close-outline' size={28} color="#EF4444" />
                </Pressable>

                {/* Title */}
                <Text className="text-heading text-surface text-center mb-3">
                  {t('freelancerRoleGate.rejectedTitle')}
                </Text>

                {/* Subtitle */}
                <Text className="text-body text-surface text-center mb-8 max-w-sm">
                  {t('freelancerRoleGate.rejectedSubtitle')}
                </Text>


                {/* Action Buttons */}
                <View className="w-full gap-3">
                  <TouchableOpacity
                    onPress={() => {
                      onClose()
                      navigator.navigate('UpgradeToFreelancer')
                    }}
                    className="bg-surface py-4 px-6 rounded-xl items-center"
                  >
                    <Text className="text-primary text-body font-semibold">
                      {t('freelancerRoleGate.reapplyButton')}
                    </Text>
                  </TouchableOpacity>



                  <TouchableOpacity
                    onPress={() => {
                      onClose()
                    }}
                    className="py-3 items-center"
                  >
                    <Text className="text-surface text-body">
                      {t('freelancerRoleGate.backToHomeButton')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </Animated.View>
        </>
      )}


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

export default JobDetailModal;
