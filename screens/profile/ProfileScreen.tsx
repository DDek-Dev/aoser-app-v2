import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useAuth } from 'hooks/useAuth';
import { useMyProfile } from 'hooks/useFreelancer';
import { UserProfile } from 'types/profile';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import LogoutModal from 'components/ui/LogoutModal';
import Constants from 'expo-constants';

const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;

const ProfileScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const { loading, logout, isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useMyProfile();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Configuration arrays
  const settings = [
    { label: t('profile.edit_profile'), icon: 'person-outline', route: 'EditAoserProfile' },
    { label: t('profile.language'), icon: 'globe-outline', route: "LanguageSelectScreen" },
    { label: t('profile.change_password'), icon: 'lock-closed-outline', route: 'ChangePasswordScreen' },
    { label: t('profile.help_support'), icon: 'help-circle-outline', route: { 'RoomChat': { userId: '686250a8a971bfa8a145e85e' } } },
  ];

  const policy = [
    { label: t('profile.privacy_policy'), icon: 'document-text-outline', route: 'PrivacyPolicyScreen' },
  ];

  // Handlers
  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleNavigate = (route: any) => {
    try {
      if (!route) return;

      if (typeof route === 'string') {
        navigation.navigate(route as any);
        return;
      }

      if (typeof route === 'object' && 'name' in route) {
        navigation.navigate((route as any).name, (route as any).params);
        return;
      }

      if (typeof route === 'object') {
        const entries = Object.entries(route);
        if (entries.length > 0) {
          const [name, params] = entries[0];
          navigation.navigate(name as any, params as any);
        }
      }
    } catch (err) {
      console.warn('Navigation error', err);
    }
  };

  // Component sections
  const ProfileHeader = () => (
    <View className="bg-primary px-4 pt-12 pb-6 rounded-b-3xl">
      <View className="flex-row justify-between items-center mt-4">
        <Text className="text-heading font-bold text-white">{t('profile.profile')}</Text>
      </View>
    </View>
  );

  const ProfileLoadingSkeleton = () => (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <View className="w-14 h-14 rounded-full bg-gray-300" />
        <View>
          <View className="w-32 h-4 bg-gray-300 rounded-md mb-2" />
          <View className="w-24 h-3 bg-gray-200 rounded-md" />
        </View>
      </View>
    </View>
  );

  const AuthenticatedProfile = () => (
    <TouchableOpacity onPress={() => navigation.navigate('UserIdScreen', { userId: data as UserProfile })}>
      <View className="flex-row items-center">
        <Image
          source={{ uri: BASE_IMAGE + data?.userProfileImage }}
          className="w-14 h-14 rounded-full mr-3"
        />
        <View>
          <Text className="text-body font-semibold text-text">
            {data?.firstName} {data?.lastName}
          </Text>
          <Text className="text-caption text-text">{data?.user.email || "undefined"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const UnauthenticatedProfile = () => (
    <View className="flex-1">
      <TouchableOpacity
        onPress={() => navigation.navigate('SignIn')}
        className="bg-blue-50 px-8 py-4 rounded-lg mb-3"
        activeOpacity={0.8}
      >
        <Text className="text-warning font-semibold text-body text-center">
          {t('profile.signin')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('SignUp')}
        activeOpacity={0.8}
      >
        <Text className="text-primary font-semibold text-body text-center">
          {t('loginScreen.signup')} ?
        </Text>
      </TouchableOpacity>
    </View>
  );

  const QuickActions = () => (
    <View className="flex-row gap-8">
      <TouchableOpacity 
        onPress={() => navigation.navigate('FavoriteScreen')} 
        className="flex-col items-center"
      >
        <Ionicons name="heart-outline" size={32} color="#3B82F6" />
        <Text className="text-caption text-textSecondary">{t('profile.favorites')}</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => navigation.navigate('HistoryScreen')} 
        className="flex-col items-center"
      >
        <Ionicons name="time-outline" size={32} color="#3B82F6" />
        <Text className="text-caption text-textSecondary">{t('profile.history')}</Text>
      </TouchableOpacity>
    </View>
  );

  const MenuSection = ({ title, items }: { title?: string; items: typeof settings }) => (
    <View className="mt-6 mx-4 space-y-4">
      {title && <Text className="text-sm font-semibold text-textSecondary">{title}</Text>}
      {items.map((item, idx) => (
        <TouchableOpacity
          onPress={() => handleNavigate(item.route)}
          key={idx}
          className="flex-row justify-between items-center py-3"
        >
          <View className="flex-row items-center gap-3">
            <Ionicons name={item.icon as any} size={18} color="#3B82F6" />
            <Text className="text-body text-text">{item.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const FreelancerSection = () => (
    <View className="mx-4 space-y-4">
      <TouchableOpacity
        className="flex-row justify-between items-center py-3"
        onPress={() => navigation.navigate('FreelancerRoleGate')}
      >
        <View className="flex-row items-center gap-3">
          <Ionicons name="briefcase-outline" size={18} color="#3B82F6" />
          <Text className="text-body text-text">
            {data?.businessType === 'FREELANCER'
              ? t('profile.see_freelancer_profile')
              : t('profile.freelancer')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-surface">
      <ProfileHeader />

      {/* Profile Section */}
      <View className="px-4 my-8 flex-row justify-between items-center">
        <View className="flex-1 mr-4">
          {isAuthenticated ? (
            isLoading || !data || isError ? (
              <ProfileLoadingSkeleton />
            ) : (
              <AuthenticatedProfile />
            )
          ) : (
            <UnauthenticatedProfile />
          )}
        </View>
        <QuickActions />
      </View>

      <ScrollView 
        className="flex-1" 
        showsHorizontalScrollIndicator={false} 
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content Card */}
        <View className="bg-blue-50 mx-4 mt-8 p-4 rounded-2xl py-6">
          <FreelancerSection />
          <MenuSection title={t('profile.account_settings')} items={settings} />
          <MenuSection title={t('profile.conditions_policies')} items={policy} />
        </View>

        {/* Logout Section */}
        {isAuthenticated && (
          <View className="mt-6 mx-4 px-4 space-y-4">
            <View className="bg-gray-300 h-[0.5px] w-full" />
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row justify-between bg-surface border border-border rounded-full px-4 items-center py-3"
            >
              <View className="flex-row items-center gap-3">
                <Ionicons name="log-out-outline" size={18} color="#3B82F6" />
                <Text className="text-body text-error">{t('profile.logout')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        

        {/* Footer */}
        <View className="h-12 items-center justify-center mb-12 mt-4">
          <Text className="text-caption text-gray-400">
            {t('profile.application_version')}: v{Constants.expoConfig?.version}
          </Text>
        </View>
      </ScrollView>

      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        loading={loading}
      />
    </View>
  );
};

export default ProfileScreen;