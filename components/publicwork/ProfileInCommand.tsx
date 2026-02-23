import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  ActivityIndicator,
  Dimensions,
  BackHandler,
  Pressable,
} from 'react-native';
import TabbedProfileSection from 'components/profile/TabbedProfileSection';
import {  useMyProfile } from 'hooks/useFreelancer';
import { Ionicons } from '@expo/vector-icons';
import { useFreelancerApplyWork } from 'hooks/usePublicWork';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { useTranslation } from 'react-i18next';

type Props = {
  visible: boolean;
  onClose: () => void;
  jobId: string
  refetch: () => void
};


const ProfileInCommand = ({ visible, onClose, jobId, refetch }: Props) => {

  // const { data, isLoading, error } = useFreelancerById(userId);
  const [isApplyLoading, setIsApplyLoading] = useState(false);

  const applyWorkMutation = useFreelancerApplyWork();
  const { data, isLoading,  error } = useMyProfile();


  const fadeAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;


  // console.log('data: 555 ', data);
  const IMAGE_BASE = process.env.EXPO_PUBLIC_IMAGES_URL
  const { t } = useTranslation();
  const handleApply = async () => {
    try {
      setIsApplyLoading(true);

      // Apply for the work
      const result = await applyWorkMutation.mutateAsync({
        workId: jobId
      });
      console.log('✓ Apply result: ', result);

      // Refetch the job data to show updated applicants list
      await refetch();

      // Close the modal first
      onClose();

      // Show success message after closing
      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: t('common.success') || 'Success',
        textBody: t('profile_in_command.apply_success') || "You have successfully applied for this work",
      });

      setIsApplyLoading(false);
    } catch (error: any) {
      setIsApplyLoading(false);
      console.log('✗ Error applying for work:', error);

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('common.failed') || 'Failed',
        textBody: error?.message || t('profile_in_command.apply_failed') || "Failed to apply for this work. Please try again.",
      });
    }
  }

  // Handle fade animation
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // 🔙 Back button close (Android)
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

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          maxHeight: screenHeight * 0.8,
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 164,
        }}
      >
        <Text className="text-lg font-bold mb-3">{t('profile.profile')}</Text>

        <View className="bg-gray-100 rounded-xl border border-gray-200">
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
            )
            }
            {/* <Image
              source={{ uri: data.profileImage }}
              className="w-12 h-12 rounded-full mr-3"
            /> */}
            <Text className="text-base font-semibold">{data.firstName}</Text>
          </View>

          <View style={{ height: 220 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TabbedProfileSection profile={data as any} stylepadd="px-4" />
            </ScrollView>
          </View>
        </View>

        <View className="flex-row justify-between mt-6 px-2">
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
  );
};

export default ProfileInCommand;
