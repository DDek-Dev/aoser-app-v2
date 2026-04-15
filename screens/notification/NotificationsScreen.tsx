import React, { useCallback, useState } from 'react';
import { View, Text, SectionList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, useReadNotification } from 'hooks/useNotifications';
import { Notifications } from 'types';
import { formatRelativeTime, getCurrentLanguage } from 'utils/dateFormatter';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import SkeletonNotification from 'skeletonScreens/SkeletonNotification';
import { NotificationNoResult } from './NotificationNoResult';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FreelancerStackParamList } from 'types/navigation';
// import ViewFormNotification from 'components/publicwork/ViewFormNotification';
import { useTranslation } from 'react-i18next';

const getIconByType = (type: string) => {
  switch (type) {
    case 'Like': return { name: 'heart', color: '#F43F5E' };
    case 'Work': return { name: 'briefcase', color: '#3B82F6' };
    case 'Review': return { name: 'star', color: '#FACC15' };
    case 'Message': return { name: 'chatbubble-ellipses', color: '#10B981' };
    case 'PaymentHistory': return { name: 'card', color: '#6366F1' };
    case 'PostComment': return { name: 'chatbox', color: '#A855F7' };
    case 'UserProfile': return { name: 'person', color: '#6366F1' };
    case 'News': return { name: 'newspaper', color: '#F97316' };
    default: return { name: 'notifications', color: '#999' };
  }
};

const NotificationItem = ({ item, onPress }: { item: Notifications, onPress: (notification: Notifications) => void }) => {
  const currentLanguage = getCurrentLanguage();
  const { name, color } = getIconByType(item.notificationType);
  return (
    <Pressable onPress={() => onPress(item)}>
      <View className="flex-row items-start bg-white px-4 py-4 h-28 mb-1 rounded-2xl border border-border">
        <View className="w-10 h-10 bg-background rounded-full justify-center items-center mr-3">
          <Ionicons name={name as any} size={20} color={color} />
        </View>
        <View className="flex-1">
          <Text className="text-body text-text font-semibold">{item.title}</Text>
          <Text className="text-body text-text" numberOfLines={3}>{item.message}</Text>
        </View>
        <View className="items-end">
          <Text className="text-caption text-textSecondary mb-1">{formatRelativeTime(item.createdAt, currentLanguage)}</Text>
          {!item.isRead && <View className="w-2 h-2 bg-primary rounded-full" />}
        </View>
      </View>
    </Pressable>
  );
};

const groupNotifications = (notifications: Notifications[]) => {
  const today: Notifications[] = [];
  const yesterday: Notifications[] = [];
  const earlier: Notifications[] = [];
  const now = new Date();
  const currentLanguage = getCurrentLanguage();

  notifications.forEach(n => {
    const created = new Date(n.createdAt);
    const isToday = created.toDateString() === now.toDateString();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const isYesterday = created.toDateString() === yesterdayDate.toDateString();

    if (isToday) {
      today.push(n);
    } else if (isYesterday) {
      yesterday.push(n);
    } else {
      earlier.push(n);
    }
  });
  const sections = [];
  if (today.length) sections.push({ title: currentLanguage === 'la' ? 'ມື້ນີ້' : 'Today', data: today });
  if (yesterday.length) sections.push({ title: currentLanguage === 'la' ? 'ມື້ວານ' : 'Yesterday', data: yesterday });
  if (earlier.length) sections.push({ title: currentLanguage === 'la' ? 'ກ່ອນໜ້ານີ້' : 'Earlier', data: earlier });
  return sections;
};

const NotificationsScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();

  const { data, isLoading, isError, error, refetch } = useNotifications();
  const { mutate: markAsRead } = useReadNotification();
  const [localNotifications, setLocalNotifications] = useState<Notifications[]>([]);
  const [refreshing, setRefreshing] = useState(false);


  // console.log('data notifications: ', JSON.stringify(data?.slice(-3), null, 2))
  React.useEffect(() => {
    if (data) setLocalNotifications(data);
  }, [data]);

  const { t } = useTranslation();

  const handleNavigationByType = (notification: Notifications) => {
    if (notification.notifyAbout === "UPDATE_FREELANCER_KYC") {
      navigation.navigate('FreelancerRoleGate');
      return;
    }

    // Navigate based on notification type
    switch (notification.notificationType) {
      case 'Like':
      case 'PostComment':
        // Navigate to post detail if relatedPost exists
        if (notification.notificationType === "Like" || notification.notificationType === "PostComment") {
          // navigation.navigate('PostDetail', { postId: notification.relatedPost });
        }
        break;

      case 'Work':
        // Navigate to work/job detail

        if (notification.notificationType === "Work") {
          navigation.navigate('FreelancerWorkDetail', { workId: notification.aboutNotification });
        }
        break;

      case 'Review':
        // Navigate to reviews page
        if (notification.notificationType === "Review") {

          navigation.navigate('FreelancerProfile', { userId: notification.recipient._id });

        }
        break;

      case 'Message':
        // Navigate to chat
        if (notification.notificationType === "Message") {
          console.log("Chat")
          navigation.navigate('RoomChat', { userId: notification.aboutNotification });
        } else if (notification.sender) {
          console.log("Chat")
          navigation.navigate('ChatScreen');

          // navigation.navigate('Chat', { userId: notification.sender._id });
        }
        break;

      case 'PaymentHistory':
        // Navigate to payment history
        // if (notification.notificationType === "Work") {
        //   navigation.navigate('FreelancerWorkDetail', { workId: notification.aboutNotification });
        // }

        // navigation.navigate('PaymentHistory');
        break;

      case 'UserProfile':
        // Navigate to user profile
        if (notification.notificationType === "UserProfile") {
          navigation.navigate('FreelancerWorkDetail', { workId: notification.aboutNotification });
        } else if (notification.sender) {
          console.log("FreelancerUserProfile")

          // navigation.navigate('FreelancerProfile', { 
          //   freelancerId: notification.relatedFreelancer 
          // });
        }
        break;

      case 'News':
        // Navigate to news detail
        if (notification.notificationType === "News") {
          console.log("NewsDetail")
          navigation.navigate('News', { newsId: notification.aboutNotification });
        } else {
          console.log("News")
          // navigation.navigate('News');
        }
        break;

      default:
        console.log('No navigation defined for this notification type');
        break;
    }
  };

  const handleNotificationPress = (notification: Notifications) => {
    // Mark as read
    markAsRead(notification._id, {
      onSuccess: () => {
        console.log('Notification marked as read successfully');
        handleNavigationByType(notification);
        refetch();
      },
      onError: (error) => {
        console.log('Error marking notification as read:', error);
        handleNavigationByType(notification);
      },
    });
  };


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {

      await refetch();
    } catch (error) {
      console.log('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const sections = groupNotifications(localNotifications);

  if (isLoading || isError) return (
    <View className='w-full h-full '>
      <SkeletonNotification />
    </View>
  );

  return (
    <ScreenWrapper safeEdges={['top']}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className='px-4 flex-row justify-between items-center mb-1'>
          <View className="flex-row items-center bg-surface p-3 rounded-2xl flex-1 mr-3">
            <View className="flex-1">
              <Text className="font-semibold text-primary text-heading">{t('notification.notification')}</Text>
            </View>
          </View>
        </View>

        {/* Notifications List */}
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => item._id + index}
          renderItem={({ item }) => <NotificationItem item={item} onPress={handleNotificationPress} />}
          renderSectionHeader={({ section: { title } }) => (
            <Text className="text-caption text-text font-semibold mb-2 mt-2">{title}</Text>
          )}
          contentContainerStyle={{ padding: 8 }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B82F6" // iOS spinner color
              colors={['#3B82F6']} // Android spinner color
            />
          }

          ListEmptyComponent={<NotificationNoResult />}
        />
      </View>
    </ScreenWrapper>
  );
};

export default NotificationsScreen;
