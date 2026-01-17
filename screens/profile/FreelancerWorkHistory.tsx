import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import ScreenWrapper from 'components/ui/ScreenWrapper';
import LoadingScreen from 'screens/Loading/LoadingScreen';

// Hooks
import { useGetFlHistory } from 'hooks/useFreelancer';

// Types
import { FreelancerStackParamList } from 'types/navigation';
import { Job } from 'types';

// Utils
import { formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
import { profileImage } from 'assets';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

interface StatusTagProps {
    status: Job['workStatus'];
}

interface WorkItemCardProps {
    item: Job;
    onPress: (workId: string) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;

// =============================================================================
// STATUS TAG COMPONENT
// =============================================================================

/**
 * StatusTag Component
 * 
 * Displays a styled badge showing the current status of a work item.
 * Supports multiple status types with different colors and icons.
 * 
 * Status Types:
 * - PUBLISHED: New work posted
 * - DOING: Work in progress
 * - AWAITING_COMPLETED: Pending completion review
 * - COMPLETED: Work finished
 * - ASSIGNED_WORKER: Work assigned to freelancer
 */
const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
    const { t } = useTranslation();

    /**
     * Get configuration for each status type
     * Returns background color, text color, icon, and translated text
     */
    const getStatusConfig = useCallback((status: Job['workStatus']) => {
        switch (status) {
            case 'PUBLISHED':
                return {
                    backgroundColor: '#FEF3C7',
                    textColor: '#D97706',
                    icon: 'sparkles' as const,
                    text: t('profile.freelancer_workHistory.status.new')
                };
            case 'DOING':
                return {
                    backgroundColor: '#DBEAFE',
                    textColor: '#2563EB',
                    icon: 'time' as const,
                    text: t('profile.freelancer_workHistory.status.in_progress')
                };
            case 'AWAITING_COMPLETED':
                return {
                    backgroundColor: '#FEF3C7',
                    textColor: '#F59E0B',
                    icon: 'hourglass' as const,
                    text: t('profile.freelancer_workHistory.status.pending')
                };
            case 'COMPLETED':
                return {
                    backgroundColor: '#D1FAE5',
                    textColor: '#065F46',
                    icon: 'checkmark-circle' as const,
                    text: t('profile.freelancer_workHistory.status.completed')
                };
            case 'ASSIGNED_WORKER':
                return {
                    backgroundColor: '#E0E7FF',
                    textColor: '#4F46E5',
                    icon: 'person' as const,
                    text: t('profile.freelancer_workHistory.status.new')
                };
            case 'ASSIGNED_AWAIT_PAYMENT':
                return {
                    backgroundColor: '#E0E7FF',
                    textColor: '#4F46E5',
                    icon: 'person' as const,
                    text: t('profile.freelancer_workHistory.status.assigned_wait_payment')
                };
            default:
                return {
                    backgroundColor: '#F3F4F6',
                    textColor: '#6B7280',
                    icon: 'help-circle' as const,
                    text: t('profile.freelancer_workHistory.status.unknown')
                };
        }
    }, [t]);

    const config = getStatusConfig(status);

    return (
        <View
            style={{
                backgroundColor: config.backgroundColor,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
            }}
        >
            <Ionicons name={config.icon} size={12} color={config.textColor} />
            <Text
                style={{
                    color: config.textColor,
                    fontSize: 11,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                }}
            >
                {config.text}
            </Text>
        </View>
    );
};

// =============================================================================
// WORK ITEM CARD COMPONENT
// =============================================================================

/**
 * WorkItemCard Component
 * 
 * Displays a single work history item with:
 * - Client profile image and name
 * - Work status badge
 * - Work title and description
 * - Service type
 * - Deadline (if available)
 * - Budget information
 * - Action button (View Details/View Project)
 * 
 * Features:
 * - Pressable with visual feedback
 * - Conditional rendering for optional fields
 * - Responsive layout
 * - Shadow effects for iOS and Android
 */
const WorkItemCard: React.FC<WorkItemCardProps> = ({ item, onPress }) => {
    const { t } = useTranslation();
    const currentLanguage = getCurrentLanguage();

    // Determine if image URL needs base path
    const profileImageUri = item.createdBy.userProfileImage?.startsWith('http')
        ? item.createdBy.userProfileImage
        : `${IMAGES_BASE_URL}${item.createdBy.userProfileImage}`;

    return (
        <Pressable
            onPress={() => onPress(item._id)}
            className="bg-surface rounded-2xl mx-4 mb-4 overflow-hidden border border-border"
            accessibilityRole="button"
            accessibilityLabel={`View work: ${item.workTitle}`}
            accessibilityHint="Double tap to view work details"
        >
            {/* ===== CARD HEADER ===== */}
            <View className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center gap-3">
                    {/* Client Profile Image */}
                    <View className="relative">
                        <Image
                            source={item.createdBy.userProfileImage ? {  uri: IMAGES_BASE_URL + item.createdBy.userProfileImage }: profileImage}
                            className="w-12 h-12 rounded-full  border border-border"
                        />
                    </View>

                    {/* Client Info */}
                    <View>
                        <Text className="text-primary font-semibold text-[16px]" numberOfLines={1}>
                            {item.createdBy.firstName} {item.createdBy.lastName}
                        </Text>
                        {/* Optional: Display hiring type if needed */}
                        {/* <Text className="text-warning text-caption">
              {item.hiringType === 'NEW_HIRE' 
                ? t('profile.freelancer_workHistory.new_hire')
                : t('profile.freelancer_workHistory.re_hire')
              }
            </Text> */}
                    </View>
                </View>

                {/* Status Badge */}
                <StatusTag status={item.workStatus} />
            </View>

            {/* ===== CARD CONTENT ===== */}
            <View className="px-4 pb-4">
                {/* Work Title */}
                <Text
                    className="text-text font-semibold text-subheading mb-3 leading-6"
                    numberOfLines={2}
                >
                    {item.workTitle}
                </Text>

                {/* Service Type */}
                <View className="flex-row items-center gap-2 mb-3">
                    <View className="bg-primary/10 p-2 rounded-full">
                        <MaterialIcons name="work" size={16} color="#3B82F6" />
                    </View>
                    <Text className="text-textSecondary text-body flex-1" numberOfLines={1}>
                        {item.serviceType?.name || t('profile.freelancer_workHistory.no_service_type')}
                    </Text>
                </View>

                {/* Deadline - Only show if available */}
                {item.deadLine && (
                    <View className="flex-row items-center gap-2 mb-4">
                        <View className="bg-warning/10 p-2 rounded-full">
                            <Ionicons name="calendar" size={16} color="#F59E0B" />
                        </View>
                        <Text className="text-textSecondary text-body">
                            {t('profile.freelancer_workHistory.deadline_label')}: {formatRelativeTime(item.deadLine, currentLanguage)}
                        </Text>
                    </View>
                )}

                {/* Budget Section */}
                <View className="bg-gradient-to-r from-success/5 to-secondary/5 rounded-xl p-4 mb-4">
                    <Text className="text-textSecondary text-caption mb-1">
                        {t('profile.freelancer_workHistory.total_budget')}
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <Text className="text-success font-bold text-[20px]">
                            {item.currency || 'USD'}
                        </Text>
                        <Text className="text-success font-bold text-[20px]">
                            {item.budget?.toLocaleString() || '0'}
                        </Text>
                    </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    onPress={() => onPress(item._id)}
                    className="bg-primary rounded-xl py-3 px-4 flex-row items-center justify-center gap-2"
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    style={{
                        shadowColor: '#3B82F6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <Text className="text-white font-semibold text-body">
                        {item.workStatus === 'PUBLISHED'
                            ? t('profile.freelancer_workHistory.check_details')
                            : t('profile.freelancer_workHistory.view_project')
                        }
                    </Text>
                    <Ionicons
                        name={item.workStatus === 'PUBLISHED' ? 'eye' : 'arrow-forward'}
                        size={16}
                        color="#FFFFFF"
                    />
                </TouchableOpacity>
            </View>
        </Pressable>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * FreelancerWorkHistory Component
 * 
 * Displays the freelancer's complete work history including:
 * - All projects (published, in progress, completed)
 * - Project details and status
 * - Navigation to individual work details
 * 
 * Features:
 * - FlatList for performance with large lists
 * - Pull-to-refresh (can be added)
 * - Empty state when no work history
 * - Loading state
 * - Safe area handling for iOS notch
 * - Accessibility support
 */
const FreelancerWorkHistory: React.FC = () => {
    // Hooks
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const { t } = useTranslation();
    const { data, isLoading, error } = useGetFlHistory();

    /**
     * Navigate to work detail screen
     * @param workId - The ID of the work item to view
     */
    const handleWorkItemPress = useCallback((workId: string): void => {
        console.log('[WorkHistory] Navigating to work detail:', workId);
        navigation.navigate('FreelancerWorkDetail', { workId });
    }, [navigation]);

    /**
     * Navigate back to previous screen
     */
    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    /**
     * Render empty state when no work history exists
     */
    const renderEmptyState = useCallback(() => (
        <View className="flex-1 justify-center items-center py-20">
            <View className="bg-primary/10 p-6 rounded-full mb-4">
                <MaterialIcons name="work-off" size={48} color="#3B82F6" />
            </View>
            <Text className="text-text font-semibold text-subheading mb-2">
                {t('profile.freelancer_workHistory.empty_state_title')}
            </Text>
            <Text className="text-textSecondary text-body text-center px-8">
                {t('profile.freelancer_workHistory.empty_state_description')}
            </Text>
        </View>
    ), [t]);

    /**
     * Render individual work item
     */
    const renderWorkItem = useCallback(({ item }: { item: Job }) => (
        <WorkItemCard item={item} onPress={handleWorkItemPress} />
    ), [handleWorkItemPress]);

    /**
     * Item separator for better visual spacing
     */
    const renderItemSeparator = useCallback(() => (
        <View style={{ height: 8 }} />
    ), []);

    /**
     * Extract unique key for each item
     */
    const keyExtractor = useCallback((item: Job) => item._id, []);

    // =================================================================
    // LOADING STATE
    // =================================================================
    if (isLoading) {
        return <LoadingScreen />;
    }

    // =================================================================
    // ERROR STATE (Optional - add error handling)
    // =================================================================
    if (error) {
        return (
            <ScreenWrapper safeEdges={['top']}>
                <View className="flex-1 justify-center items-center px-6">
                    <MaterialIcons name="error-outline" size={64} color="#EF4444" />
                    <Text className="text-text font-semibold text-subheading mt-4 mb-2">
                        {t('profile.freelancer_workHistory.error_title', 'Error Loading Work History')}
                    </Text>
                    <Text className="text-textSecondary text-body text-center mb-6">
                        {t('profile.freelancer_workHistory.error_description', 'Unable to load your work history. Please try again.')}
                    </Text>
                    <TouchableOpacity
                        onPress={handleGoBack}
                        className="bg-primary px-6 py-3 rounded-xl"
                    >
                        <Text className="text-white font-semibold">
                            {t('profile.freelancer_workHistory.go_back', 'Go Back')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScreenWrapper>
        );
    }

    // =================================================================
    // MAIN RENDER
    // =================================================================
    return (
        <ScreenWrapper safeEdges={['top']}>
            {/* ===== HEADER ===== */}
            <View className="p-4 bg-white border-b border-border">
                <View className="flex-row items-center gap-3">
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={handleGoBack}
                       
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <MaterialIcons name="chevron-left" size={32} color="#3B82F6" />
                    </TouchableOpacity>

                    {/* Title Section */}
                    <View className="flex-1">
                        <Text className="text-text font-bold text-subheading">
                            {t('profile.freelancer_workHistory.title')}
                        </Text>
                        <Text className="text-textSecondary text-caption">
                            {t('profile.freelancer_workHistory.subtitle')}
                        </Text>
                    </View>

                    {/* Project Count Badge */}
                    <View className="bg-primary px-3 py-1 rounded-3xl">
                        <Text className="text-white text-caption font-semibold">
                            {data?.length || 0} {t('profile.freelancer_workHistory.projects_count')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* ===== CONTENT - WORK LIST ===== */}
            <View className="flex-1 bg-background">
                <FlatList
                    data={data || []}
                    keyExtractor={keyExtractor}
                    renderItem={renderWorkItem}
                    ListEmptyComponent={renderEmptyState}
                    ItemSeparatorComponent={renderItemSeparator}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingTop: 16,
                        paddingBottom: insets.bottom + 16,
                        flexGrow: 1,
                    }}
                    // Performance optimizations
                    removeClippedSubviews={true}
                //   maxToRefreshDistance={100}
                // Add pull-to-refresh if needed
                // refreshControl={
                //   <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                // }
                />
            </View>
        </ScreenWrapper>
    );
};

export default FreelancerWorkHistory;