import { useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { aoserlogo_jpg } from 'assets';
import { useTranslation } from 'react-i18next';
import { useMyProfile } from 'hooks/useFreelancer';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';



const FreelancerRoleGate = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { data, refetch, isLoading } = useMyProfile();


   // Refetch profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
 // Check if user is already approved and redirect
  useEffect(() => {
    if (data?.businessType === 'FREELANCER' && data?.registrationStatus === 'APPROVED_COMPLETE') {
      navigation.replace('AuthFreelancerProfile', { userId: data._id });
    }
  }, [data, navigation]);
  const { t } = useTranslation();

  const isPendingRegistration =
    (data?.businessType === 'CUSTOMER' || data?.businessType === 'FREELANCER') &&
    data?.registrationStatus === 'PENDING';
  const isRejectedRegistration =
    (data?.businessType === 'CUSTOMER' || data?.businessType === 'FREELANCER') &&
    data?.registrationStatus === 'REJECTED';
  const canStartRegistration =
    data?.businessType === 'CUSTOMER' && data?.registrationStatus === "";

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-background justify-center px-6">

      {isPendingRegistration && (

        <View className="flex-1 items-center justify-center px-6">
          {/* Animated Status Icon */}
          <View className="bg-warning/10 w-32 h-32 rounded-full items-center justify-center mb-6">
            <View className="bg-warning/20 w-24 h-24 rounded-full items-center justify-center">
              <Ionicons name="time-outline" size={48} color="#F59E0B" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-heading text-text text-center mb-3">
            {t('freelancerRoleGate.pendingTitle')}
          </Text>

          {/* Subtitle */}
          <Text className="text-body text-textSecondary text-center mb-8 max-w-sm">
            {t('freelancerRoleGate.pendingSubtitle')}
          </Text>

          {/* Info Card */}
          <View className="bg-blue-50 border border-primary/20 rounded-xl p-4 mb-8 w-full">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="flex-1">
                <Text className="text-body text-primary font-semibold mb-1">
                  {t('freelancerRoleGate.whatHappensNext')}
                </Text>
                <Text className="text-caption text-primary/80">
                  {t('freelancerRoleGate.reviewProcess')}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="w-full gap-3">
            {/* <TouchableOpacity
        // onPress={() => navigation.navigate('SupportScreen')} // Optional: add support screen
        className="bg-primary py-4 px-6 rounded-xl items-center"
      >
        <Text className="text-surface text-body font-semibold">
          {t('freelancerRoleGate.contactSupport')}
        </Text>
      </TouchableOpacity> */}

            <TouchableOpacity
              onPress={() => navigation.popToTop()}
              className="bg-primary flex-row gap-2 justify-center border border-border py-4 px-6 rounded-xl items-center"
            >
              <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
              <Text className="text-surface text-body font-semibold">
                {t('freelancerRoleGate.backToHomeButton')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Additional Help Text */}
          <Text className="text-caption text-textSecondary text-center mt-6">
            {t('freelancerRoleGate.estimatedTime')}
          </Text>
        </View>
      )}




      {isRejectedRegistration && (
        <View className="flex-1 items-center justify-center px-6">
          {/* Error Icon */}
          <View className="bg-error/10 w-32 h-32 rounded-full items-center justify-center mb-6">
            <View className="bg-error/20 w-24 h-24 rounded-full items-center justify-center">
              <Ionicons name="close-circle-outline" size={48} color="#EF4444" />
            </View>
          </View>

          {/* Title */}
          <Text className="text-heading text-text text-center mb-3">
            {t('freelancerRoleGate.rejectedTitle')}
          </Text>

          {/* Subtitle */}
          <Text className="text-body text-textSecondary text-center mb-8 max-w-sm">
            {t('freelancerRoleGate.rejectedSubtitle')}
          </Text>

          {/* Reason Card */}
          <View className="bg-red-50 border border-error/20 rounded-xl p-4 mb-8 w-full">
            <View className="flex-row items-start gap-3">
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <View className="flex-1">
                <Text className="text-body text-error font-semibold mb-1">
                  {t('freelancerRoleGate.rejectionReason')}
                </Text>
                <Text className="text-caption text-error/80">
                  {t('freelancerRoleGate.defaultRejectionReason')}
                </Text>
              </View>
            </View>
          </View>

          {/* Help Section */}
          <View className="bg-blue-50 border border-primary/20 rounded-xl p-4 mb-8 w-full">
            <View className="flex-row items-start gap-3">
              <Ionicons name="bulb-outline" size={20} color="#3B82F6" />
              <View className="flex-1">
                <Text className="text-body text-primary font-semibold mb-1">
                  {t('freelancerRoleGate.nextSteps')}
                </Text>
                <Text className="text-caption text-primary/80">
                  {t('freelancerRoleGate.nextStepsDescription')}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="w-full gap-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('UpgradeToFreelancer')}
              className="bg-primary py-4 px-6 rounded-xl items-center"
            >
              <Text className="text-surface text-body font-semibold">
                {t('freelancerRoleGate.reapplyButton')}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
        onPress={() => navigation.navigate('SupportScreen')}
        className="bg-background border border-border py-4 px-6 rounded-xl items-center"
      >
        <Text className="text-text text-body font-semibold">
          {t('freelancerRoleGate.contactSupport')}
        </Text>
      </TouchableOpacity> */}

            <TouchableOpacity
              onPress={() => navigation.popToTop()}
              className="py-3 items-center"
            >
              <Text className="text-textSecondary text-body">
                {t('freelancerRoleGate.backToHomeButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {canStartRegistration && (
        <View className="flex-1 items-center justify-center px-6">
          {/* Hero Image with Gradient Background */}
          <View className="mb-8">
            <View className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl p-6">
              <Image
                source={aoserlogo_jpg}
                className="w-56 h-56 rounded-2xl"
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Title */}
          <Text className="text-heading text-text text-center mb-3">
            {t('freelancerRoleGate.becomeFreelancerTitle')}
          </Text>

          {/* Subtitle */}
          <Text className="text-body text-textSecondary text-center mb-8 max-w-md leading-6">
            {t('freelancerRoleGate.becomeFreelancerSubtitle')}
          </Text>

          {/* Benefits Cards */}
          <View className="w-full gap-3 mb-8">
            <View className="bg-surface  rounded-xl p-4 flex-row items-center gap-3">
              <View className="bg-success/10 w-12 h-12 rounded-full items-center justify-center">
                <Ionicons name="cash-outline" size={24} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-body text-text font-semibold">
                  {t('freelancerRoleGate.benefit1Title')}
                </Text>
                <Text className="text-caption text-textSecondary">
                  {t('freelancerRoleGate.benefit1Description')}
                </Text>
              </View>
            </View>

            <View className="bg-surface  rounded-xl p-4 flex-row items-center gap-3">
              <View className="bg-primary/10 w-12 h-12 rounded-full items-center justify-center">
                <Ionicons name="people-outline" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-body text-text font-semibold">
                  {t('freelancerRoleGate.benefit2Title')}
                </Text>
                <Text className="text-caption text-textSecondary">
                  {t('freelancerRoleGate.benefit2Description')}
                </Text>
              </View>
            </View>

            <View className="bg-surface  rounded-xl p-4 flex-row items-center gap-3">
              <View className="bg-secondary/10 w-12 h-12 rounded-full items-center justify-center">
                <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-body text-text font-semibold">
                  {t('freelancerRoleGate.benefit3Title')}
                </Text>
                <Text className="text-caption text-textSecondary">
                  {t('freelancerRoleGate.benefit3Description')}
                </Text>
              </View>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate('UpgradeToFreelancer')}
            className="w-full bg-primary py-4 rounded-xl items-center mb-3"
          >
            <Text className="text-surface text-body font-semibold">
              {t('freelancerRoleGate.getStartedButton')}
            </Text>
          </TouchableOpacity>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.popToTop()}
            className="py-3"
          >
            <Text className="text-textSecondary text-body">
              {t('freelancerRoleGate.backToHomeButton')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isPendingRegistration && !isRejectedRegistration && !canStartRegistration && (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-body text-textSecondary text-center mb-6">
            {t('freelancerRoleGate.pendingSubtitle')}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-primary flex-row gap-2 justify-center border border-border py-4 px-6 rounded-xl items-center"
          >
            <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
            <Text className="text-surface text-body font-semibold">
              {t('freelancerRoleGate.backToHomeButton')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
};

export default FreelancerRoleGate;
