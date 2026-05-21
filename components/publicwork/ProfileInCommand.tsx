import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  Dimensions,
  BackHandler,
  Pressable,
  PanResponder,
} from 'react-native';
import TabbedProfileSection from 'components/profile/TabbedProfileSection';
import { useMyProfile } from 'hooks/useFreelancer';
import { Ionicons } from '@expo/vector-icons';
import { useFreelancerApplyWork } from 'hooks/usePublicWork';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { useTranslation } from 'react-i18next';

type Props = {
  visible: boolean;
  onClose: () => void;
  jobId: string;
  refetch: () => void;
};

const ProfileInCommand = ({ visible, onClose, jobId, refetch }: Props) => {
  const [isApplyLoading, setIsApplyLoading] = useState(false);
  const applyWorkMutation = useFreelancerApplyWork();
  const { data, isLoading, error } = useMyProfile();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const scrollYRef = useRef(0);
  const screenHeight = Dimensions.get('window').height;
  const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL;
  const { t } = useTranslation();
  const CLOSE_THRESHOLD = 120;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        scrollYRef.current <= 0 &&
        gestureState.dy > 8 &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldClose = gestureState.dy > CLOSE_THRESHOLD || gestureState.vy > 1.2;
        if (shouldClose) {
          Animated.timing(sheetTranslateY, {
            toValue: screenHeight,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            sheetTranslateY.setValue(0);
            onClose();
          });
          return;
        }

        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 90,
          friction: 12,
        }).start();
      },
    })
  ).current;
  const handleApply = async () => {
    try {
      setIsApplyLoading(true);
      await applyWorkMutation.mutateAsync({
        workId: jobId,
      });
      await refetch();
      onClose();

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

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  useEffect(() => {
    if (!visible) {
      sheetTranslateY.setValue(0);
      scrollYRef.current = 0;
    }
  }, [visible, sheetTranslateY]);

  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      onClose();
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;
  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>{t('postWork.freelancer_no_found')}</Text>;
  if (!data) return <Text>{t('postWork.freelancer_no_found')}</Text>;

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { backgroundColor: 'rgba(0,0,0,0.5)', opacity: fadeAnim, zIndex: 999 },
      ]}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          height: screenHeight * 0.8,
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingInline:4,
          paddingTop: 16,
          paddingBottom: 16,
          transform: [{ translateY: sheetTranslateY }],
        }}
      >
        <View className='flex-row justify-between px-4'>
          <Text className="text-lg font-bold mb-3">{t('profile.profile')}</Text>

          <Pressable onPress={onClose}>

            <Ionicons name='close-outline' size={24} />
          </Pressable>
        </View>

        <View className="bg-gray-100 rounded-xl border border-gray-200 flex-1">
          <View className="flex-row items-center my-4 px-4">
            {data.userProfileImage ? (
              <Image
                source={{ uri: IMAGE_BASE + data.userProfileImage }}
                className="w-12 h-12 rounded-full mr-3"
              />
            ) : (
              <Ionicons
                name="person-circle-outline"
                size={40}
                color="#6B7280"
                style={{ marginRight: 8 }}
              />
            )}
            <Text className="text-base font-semibold">{data.firstName}</Text>
          </View>

          <View className="flex-1 mb-1 bg-surface">
            <ScrollView
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                scrollYRef.current = event.nativeEvent.contentOffset.y;
              }}
            >
              <TabbedProfileSection profile={data as any} stylepadd="px-4" />
            </ScrollView>
          </View>
          <View className="flex-row justify-between mb-[8rem] px-2">
            <Pressable
              onPress={onClose}
              className="border border-warning rounded-full px-12 py-2"
            >
              <Text className="text-warning font-semibold">{t('profile_in_command.cancel')}</Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              className="bg-blue-600 rounded-full px-24 py-2"
            >
              {isApplyLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold">{t('profile_in_command.apply')}</Text>
              )}
            </Pressable>
          </View>
        </View>

      </Animated.View>
    </Animated.View>
  );
};

export default ProfileInCommand;
