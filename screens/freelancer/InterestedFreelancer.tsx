import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  Animated,
  InteractionManager,
  TouchableWithoutFeedback,
  BackHandler,
  StyleSheet
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';
import { WorkById } from 'types';
import ProfileOn_InterestedMyView from 'components/profile/ProfileOn_InterestedMyView';

interface InterestedFreelancerProps {
  visible: boolean;
  onClose: () => void;
  jobs: WorkById | null;
  user?: any;
  refetch: () => void;
  onUserPress: (userId: string) => void;
}

const InterestedFreelancer = ({ visible, onClose, jobs, refetch, onUserPress }: InterestedFreelancerProps) => {
  const { t } = useTranslation();
  const job = jobs;
  const insets = useSafeAreaInsets();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const footerAnim = useRef(new Animated.Value(200)).current;

  const snapPoints = useMemo(() => ['70%', '100%'], []);

  const basePosition70 = 564;
  const basePosition100 = 164;

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

    let targetPosition;
    if (index === -1) {
      targetPosition = 100;
    } else if (index === 1) {
      targetPosition = basePosition100;
    } else {
      targetPosition = basePosition70;
    }

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

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  if (!visible || !job) return null;

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
        
        <Text className='text-body font-bold text-text mb-4'>
          {t('works.interestedFreelancers.title')}
        </Text>

        {/* Empty State */}
        {jobs?.applicant.length === 0 && (
          <View className="flex-1 items-center justify-center py-12 px-6">
            {/* Icon Container */}
            <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-4">
              <Ionicons name="people-outline" size={48} color="#3B82F6" />
            </View>

            {/* Title */}
            <Text className="text-h3 font-bold text-text text-center mb-2">
              {t('works.interestedFreelancers.empty.title')}
            </Text>

            {/* Description */}
            <Text className="text-body text-textSecondary text-center mb-6 max-w-[280px]">
              {t('works.interestedFreelancers.empty.description')}
            </Text>

            {/* Tips Section */}
            <View className="mt-2 bg-blue-50 rounded-xl p-4 w-full">
              <View className="flex-row items-start gap-3">
                <Ionicons name="bulb-outline" size={20} color="#3B82F6" />
                <View className="flex-1">
                  <Text className="text-caption font-semibold text-text mb-1">
                    {t('works.interestedFreelancers.empty.tip.title')}
                  </Text>
                  <Text className="text-caption text-textSecondary">
                    {t('works.interestedFreelancers.empty.tip.description')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Freelancers List */}
        {jobs?.applicant.length > 0 && (
          <ProfileOn_InterestedMyView
            job={jobs}
            handleUserProfileNavigation={onUserPress}
            onClose={handleDismiss}
            refetch={refetch}
          />
        )}
      </BottomSheetScrollView>
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
});

export default InterestedFreelancer;