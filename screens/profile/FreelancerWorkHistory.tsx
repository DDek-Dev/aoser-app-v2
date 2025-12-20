import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Dimensions, Pressable } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetFlHistory } from 'hooks/useFreelancer';
import LoadingScreen from 'screens/Loading/LoadingScreen';
import { Job } from 'types';
import { formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';

// TypeScript interfaces


interface StatusTagProps {
    status: Job['workStatus'];
}

const { width: screenWidth } = Dimensions.get('window');
const IMAGES_BASE_URL = process.env.EXPO_PUBLIC_IMAGES_URL;
const currentLanguage = getCurrentLanguage();

// Enhanced StatusTag component with better styling
const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
    const getStatusConfig = (status: Job['workStatus']) => {
        switch (status) {
            case 'PUBLISHED':
                return {
                    backgroundColor: '#FEF3C7',
                    textColor: '#D97706',
                    icon: 'sparkles' as const,
                    text: 'New'
                };
            case 'DOING':
                return {
                    backgroundColor: '#DBEAFE',
                    textColor: '#2563EB',
                    icon: 'time' as const,
                    text: 'In Progress'
                };
            case 'AWAITING_COMPLETED':
                return {
                    backgroundColor: '#FEF3C7',
                    textColor: '#F59E0B',
                    icon: 'hourglass' as const,
                    text: 'Pending'
                };
            case 'COMPLETED':
                return {
                    backgroundColor: '#D1FAE5',
                    textColor: '#065F46',
                    icon: 'checkmark-circle' as const,
                    text: 'Completed'
                };
            default:
                return {
                    backgroundColor: '#F3F4F6',
                    textColor: '#6B7280',
                    icon: 'help-circle' as const,
                    text: 'Unknown'
                };
        }
    };

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

// Work item card component
const WorkItemCard: React.FC<{
    item: Job;
    onPress: (workId: string) => void;
}> = ({ item, onPress }) => {
    return (
        <Pressable
            onPress={() => onPress(item._id)}
            className="bg-surface rounded-2xl mx-4 mb-4 overflow-hidden border border-border"
           

        >
            {/* Card Header */}
            <View className="flex-row justify-between items-center p-4">
                <View className="flex-row items-center gap-3">
                    <View className="relative">
                        <Image
                            source={{ uri: IMAGES_BASE_URL + item.createdBy.userProfileImage }}
                            className="w-12 h-12 rounded-full  border border-border"
                        />
                        {/* <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-white" /> */}
                    </View>
                    <View>
                        <Text className="text-primary font-semibold text-[16px]">
                            {item.createdBy.firstName}
                        </Text>
                        <Text className="text-warning text-caption">
                            {item.hiringType === 'NEW_HIRE' ? 'New Hire' : 'Re-hire'}
                        </Text>
                    </View>
                </View>
                <StatusTag status={item.workStatus} />
            </View>

            {/* Card Content */}
            <View className="p-4">
                <Text className="text-text font-semibold text-subheading mb-3 leading-6">
                    {item.workTitle}
                </Text>

                {/* Service Type */}
                <View className="flex-row items-center gap-2 mb-3">
                    <View className="bg-primary/10 p-2 rounded-full">
                        <MaterialIcons name="work" size={16} color="#3B82F6" />
                    </View>
                    <Text className="text-textSecondary text-body flex-1">
                        {item.serviceType.name}
                    </Text>
                </View>

                {/* Deadline */}
                {item.deadLine && (
                    <View className="flex-row items-center gap-2 mb-4">
                        <View className="bg-warning/10 p-2 rounded-full">
                            <Ionicons name="calendar" size={16} color="#F59E0B" />
                        </View>
                        <Text className="text-textSecondary text-body">
                            Deadline: {formatRelativeTime(item.deadLine, currentLanguage)}
                        </Text>
                    </View>
                )}

                {/* Budget Section */}
                <View className="bg-gradient-to-r from-success/5 to-secondary/5 rounded-xl p-4 mb-4">
                    <Text className="text-textSecondary text-caption mb-1">Total Budget</Text>
                    <View className="flex-row items-center gap-2">
                        <Text className="text-success font-bold text-[20px]">
                            {item.currency}
                        </Text>
                        <Text className="text-success font-bold text-[20px]">
                            {item.budget}
                        </Text>
                    </View>
                </View>

                {/* Action Button */}
                <TouchableOpacity
                    onPress={() => onPress(item._id)}
                    className="bg-primary rounded-xl py-3 px-4 flex-row items-center justify-center gap-2"
                    style={{
                        shadowColor: '#3B82F6',
                        shadowOffset: {
                            width: 0,
                            height: 4,
                        },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 6,
                    }}
                >
                    <Text className="text-white font-semibold text-body">
                        {item.workStatus === 'PUBLISHED' ? 'Check Details' : 'View Project'}
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

// Main component
const FreelancerWorkHistory: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
    const { data, isLoading } = useGetFlHistory();

    const handleWorkItemPress = (workId: string): void => {
        navigation.navigate('FreelancerWorkDetail', { workId });
    };

    const renderEmptyState = () => (
        <View className="flex-1 justify-center items-center py-20">
            <View className="bg-primary/10 p-6 rounded-full mb-4">
                <MaterialIcons name="work-off" size={48} color="#3B82F6" />
            </View>
            <Text className="text-text font-semibold text-subheading mb-2">
                No Work History Yet
            </Text>
            <Text className="text-textSecondary text-body text-center px-8">
                Start taking on projects to build your work history
            </Text>
        </View>
    );

    if (isLoading) return <LoadingScreen />;

    return (
        <ScreenWrapper safeEdges={[]} >
            {/* Custom Header with Gradient */}
            <View style={{ height: insets.top, backgroundColor: '#3B82F6' }} />
            <LinearGradient
                colors={['#3B82F6', '#3B82F6', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingHorizontal: 16, paddingVertical: 16 }}
            >
                <View className="flex-row items-center gap-3">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="bg-white/20 p-2 rounded-full"
                    >
                        <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-white font-bold text-[20px]">
                            Work History
                        </Text>
                        <Text className="text-blue-100 text-caption">
                            Track all your completed projects
                        </Text>
                    </View>
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-white text-caption font-semibold">
                            {data?.length || 0} Projects
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Content */}
            <View className="flex-1 bg-background">
                <FlatList
                    data={data}
                    keyExtractor={(item: Job) => item._id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingTop: 16,
                        paddingBottom: insets.bottom + 16,
                        flexGrow: 1
                    }}
                    renderItem={({ item }: { item: Job }) => (
                        <WorkItemCard
                            item={item}
                            onPress={handleWorkItemPress}
                        />
                    )}
                    ListEmptyComponent={renderEmptyState}
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
            </View>
        </ScreenWrapper>
    );
};

export default FreelancerWorkHistory;