import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Pressable, ScrollView } from 'react-native';
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
import { formatDisplayDateTime, formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
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

type WorkStatusFilter = 'ALL' | Job['workStatus'];

const WORK_STATUS_I18N_KEY: Record<Job['workStatus'], string> = {
    PUBLISHED: 'published',
    PRIVATE: 'private',
    ASSIGNED_WORKER: 'assigned',
    ASSIGNED_AWAIT_PAYMENT: 'awaiting_payment',
    DOING: 'in_progress',
    AWAITING_COMPLETED: 'pending_review',
    COMPLETED: 'completed',
    DELAY: 'delayed',
};

const WORK_STATUS_FILTERS: WorkStatusFilter[] = [
    'ALL',
    'PUBLISHED',
    'ASSIGNED_WORKER',
    'ASSIGNED_AWAIT_PAYMENT',
    'DOING',
    'AWAITING_COMPLETED',
    'COMPLETED',
    'DELAY',
];

// =============================================================================
// STATUS TAG COMPONENT
// =============================================================================

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

const WorkItemCard: React.FC<WorkItemCardProps> = ({ item, onPress }) => {
    const { t } = useTranslation();
    const currentLanguage = getCurrentLanguage();


    if (!item.createdBy) {
        return null
    }
    return (
        <Pressable
            onPress={() => onPress(item._id)}
            className="bg-surface rounded-2xl mx-2 overflow-hidden border border-border"
            accessibilityRole="button"
            accessibilityLabel={`View work: ${item.workTitle}`}
            accessibilityHint="Double tap to view work details"
        >
            {/* ===== CARD HEADER ===== */}


            <View className='p-4'>

                <View className='flex-row justify-between px-1'>

                    <View className="flex-row gap-2 items-center">
                        <Image
                            source={item.createdBy.userProfileImage ? { uri: IMAGES_BASE_URL + item.createdBy.userProfileImage } : profileImage}
                            className="w-10 h-10 rounded-full"
                        />
                        <Text>{item.createdBy.firstName} {item.createdBy.lastName}</Text>
                    </View>
                    <View>
                        <StatusTag status={item.workStatus} />
                        <Text className="text-caption text-textSecondary mt-2 text-center">
                            {formatRelativeTime(item.createdAt, currentLanguage)}
                        </Text>
                    </View>

                </View>

                <View className='h-[1px] bg-border my-2' />
            </View>

            {/* ===== CARD CONTENT ===== */}
            <View className="px-4 pb-4">
                <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-3 ">
                        <Text className="text-body font-semibold text-gray-900" numberOfLines={2}>
                            {item.workTitle}
                        </Text>

                    </View>
                    <View className="w-6 mr-3 ">


                    </View>

                </View>

                <Text className="text-body text-gray-500 mb-3" numberOfLines={3}>
                    {item.description}
                </Text>



                <View className='bg-background px-2 rounded-2xl p-2'>


                    <View className=" flex-row items-center  ">

                        <Text >{t('postWork.work_type')} : </Text>
                        <Text className="text-caption text-text bg-surface p-2 rounded-full  ">
                            {item.kindOfWork === 'ONLINE' ? t('editWork.workType.online') : t('editWork.workType.offline')}
                        </Text>
                    </View>
                    {item.budgetType === 'OFFERING' ? (
                        <View className=''>
                            <Text className="text-body text-primary font-bold mr-2">{t('workDetail.offering_price')}</Text>
                        </View>
                    ) : (

                        <View className="flex-row items-center">
                            <Text>{t('postWork.budget')} : </Text>
                            <Text className="font-bold text-body text-primary">
                                {new Intl.NumberFormat().format(item.budget)}
                            </Text>
                            <Text className="font-bold text-body text-warning ml-2">{item.currency} </Text>
                        </View>

                    )}


                    {item.startDate !== undefined &&

                        <View className="flex-row mt-3 items-center">
                            <Text>{currentLanguage === 'la' ? 'ເລີ່ມ' : 'Start'} : </Text>

                            <View className="flex-row gap-2 items-center">
                                <Ionicons name="time-outline" size={18} color="#F59E0B" />
                                <Text className="text-sm text-textSecondary">
                                    {/* {formatDate(item.deadLine as string, currentLanguage)} */}
                                    {formatDisplayDateTime(item.startDate as string)}
                                </Text>
                            </View>
                        </View>
                    }

                    {item.deadLine !== undefined &&
                        <View className="flex-row mt-3 items-center">
                            {/* <Text>{t('workDetail.deadline')} : </Text> */}
                            <Text>{currentLanguage === 'la' ? 'ຫາ' : 'End'} : </Text>

                            <View className="flex-row gap-2 items-center">
                                <Ionicons name="time-outline" size={18} color="#F59E0B" />

                                <Text className="text-sm text-textSecondary">
                                    {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                                    {formatDisplayDateTime(item.deadLine as string)}
                                </Text>
                            </View>
                        </View>

                    }

                    {item.address&& item.address.village !== '' && item.address.district !== '' && item.address.province !== '' &&

                        <View className="flex-row mt-3 items-center">
                            {/* <Text>{t('workDetail.deadline')} : </Text> */}
                            <Text>{t('payment_success.address')}:  </Text>

                            <View className="flex-row gap-2 items-center">
                                <Ionicons name="location-outline" size={18} color="#F59E0B" />

                                <Text className="text-sm text-textSecondary">
                                    {/* {formatDate(item.deadLine as string, currentLanguage)} */}

                                    {item.address.village}, {item.address.district}, {item.address.province}
                                </Text>
                            </View>
                        </View>
                    }

                </View>

                {/* Action Button */}
                <TouchableOpacity
                    onPress={() => onPress(item._id)}
                    className="bg-primary rounded-xl py-3 px-4 flex-row items-center justify-center gap-2"
                    activeOpacity={0.8}
                    accessibilityRole="button"

                >
                    <Text className="text-white font-semibold text-body">
                        {item.workStatus === 'PUBLISHED'
                            ? t('profile.freelancer_workHistory.check_details')
                            : t('profile.freelancer_workHistory.view_project')
                        }
                    </Text>

                </TouchableOpacity>
            </View>
        </Pressable>
    );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const FreelancerWorkHistory: React.FC = () => {
    // Hooks
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const { t } = useTranslation();
    const { data, isLoading, error } = useGetFlHistory();
    const [statusFilter, setStatusFilter] = useState<WorkStatusFilter>('ALL');

    const filteredData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        if (statusFilter === 'ALL') return data;
        return data.filter((item) => item.workStatus === statusFilter);
    }, [data, statusFilter]);

    const statusFilterLabel = useCallback(
        (filterId: WorkStatusFilter) => {
            if (filterId === 'ALL') return t('categoryTabs.all');
            return t(`postWork.status.${WORK_STATUS_I18N_KEY[filterId]}`);
        },
        [t]
    );

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
                            {filteredData.length} {t('profile.freelancer_workHistory.projects_count')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* ===== STATUS FILTER (Chips) ===== */}
            <View className="bg-white px-4 pb-3 border-b border-border">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingVertical: 6 }}
                >
                    {WORK_STATUS_FILTERS.map((filterId) => {
                        const isActive = filterId === statusFilter;
                        return (
                            <Pressable
                                key={filterId}
                                onPress={() => setStatusFilter(filterId)}
                                className={`px-3 py-2 rounded-full border ${isActive ? 'bg-primary border-primary' : 'bg-surface border-border'
                                    }`}
                            >
                                <Text
                                    className={`text-sm font-medium ${isActive ? 'text-white' : 'text-textSecondary'
                                        }`}
                                >
                                    {statusFilterLabel(filterId)}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ===== CONTENT - WORK LIST ===== */}
            <View className="flex-1 bg-background">
                <FlatList
                    data={filteredData}
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
