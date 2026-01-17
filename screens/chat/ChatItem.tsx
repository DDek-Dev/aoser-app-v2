import React from 'react'
import { View, Text, Image, Pressable } from 'react-native'
import { Message } from 'types';
import { UserProfile } from 'types/profile';
import { useAuth } from 'hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { profileImage } from 'assets';
import { formatRelativeTime, formatTime, getCurrentLanguage } from 'utils/dateFormatter';

const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;

type ChatItemProps = {
  _id: string;
  participants: UserProfile;
  createdAt: string;
  updatedAt: string;
  lastMessage: Message;
  unreadCount: number;
  pinned?: boolean;
  online?: boolean;
  unread?: boolean;
  onPress: () => void;

  onLongPress: () => void

}

export default function ChatItem({
 
  participants,

  lastMessage,
  unreadCount,
  pinned,
  online,
  unread,
  onPress,
  onLongPress
}: ChatItemProps) {


  // Format time helper
  // const formatTime = (dateString: string) => {
  //   const date = new Date(dateString);
  //   const now = new Date();
  //   const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  //   if (diffInHours < 24) {
  //     return date.toLocaleTimeString('en-US', {
  //       hour: 'numeric',
  //       minute: '2-digit',
  //       hour12: true
  //     });
  //   } else if (diffInHours < 168) {
  //     return date.toLocaleDateString('en-US', { weekday: 'short' });
  //   } else {
  //     return date.toLocaleDateString('en-US', {
  //       month: 'short',
  //       day: 'numeric'
  //     });
  //   }
  // };

  // Safely get image URL
  const imageUrl = participants?.userProfileImage
    ? `${BASE_IMAGE}${participants.userProfileImage}`
    : undefined;

  // Safely get message text
  const { user } = useAuth();

  const senderIsMe = lastMessage?.sender === user?._id;
  const prefixText = senderIsMe ? 'You: ' : '';

  const fileUrl = lastMessage?.files?.[0] || '';
  const lowerFile = (fileUrl || '').toLowerCase();
  const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].some(ext => lowerFile.includes(ext));

  const workTitle = (lastMessage as Message)?.work?.workTitle || (lastMessage as any)?.work?.workTitle;

  // messagePreview will be rendered below (can be string or element)
  const messagePreviewType = lastMessage?.messageType || 'TEXT';

  // Safely get participant name
  const participantName = participants?.firstName || 'Unknown';
  const lastname = participants?.lastName || 'Unknown';
  const currentLanguage = getCurrentLanguage();
  // console.log("id: ", _id);
  return (
    <Pressable
      onPress={onPress}
      className="active:bg-gray-100"
      onLongPress={onLongPress}
    >
      <View className="flex-row items-center justify-between px-4 py-4 bg-surface border-b border-gray-100">
        {/* Left side - Avatar and Info */}
        <View className="flex-row items-center flex-1 mr-3">
          {/* Avatar with online indicator */}
          <View className="relative mr-3">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                className="w-14 h-14 rounded-full"
              // defaultSource={require('../../assets/default-avatar.png')} // Optional: add default avatar
              />
            ) : (
              // <View className="w-14 h-14 rounded-full bg-gray-300 items-center justify-center">
              //   <Text className="text-white text-xl font-bold">
              //     {participantName.charAt(0).toUpperCase()}
              //   </Text>
              // </View>

              <Image
                source={profileImage}
                className="w-14 h-14 rounded-full mr-3"
              />
            )}
            {online && (
              <View className="w-3 h-3 rounded-full bg-green-500 absolute bottom-0 right-0 border-2 border-white" />
            )}
          </View>

          {/* Name and Message */}
          <View className="flex-1">
            <View className="flex-row items-center mb-1">
              <Text
                className="text-text font-semibold text-body flex-1"
                numberOfLines={1}
              >
                {participantName} {lastname}
              </Text>
              {pinned && (
                <Text className="ml-1 text-xs">📌</Text>
              )}
            </View>
            {messagePreviewType === 'TEXT' ? (
              <Text
                className="text-textSecondary text-caption"
                numberOfLines={1}
              >
                {prefixText}{lastMessage?.message || ''}
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons
                  name={
                    messagePreviewType === 'FILE'
                      ? (isImage ? 'image-outline' : 'document-text-outline')
                      : messagePreviewType === 'WORK'
                        ? 'briefcase-outline'
                        : 'link-outline'
                  }
                  size={14}
                  color="#6B7280"
                  style={{ marginRight: 6 }}
                />
                <Text className="text-textSecondary text-caption" numberOfLines={1}>
                  {prefixText}
                  {messagePreviewType === 'FILE'
                    ? (isImage ? ' Send a Photo' : 'File')
                    : messagePreviewType === 'WORK'
                      // ? `Work: ${workTitle}`
                      ? `Send a work`
                      : (lastMessage?.message || 'Link')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Right side - Time and Unread */}
        <View className="items-end justify-center ml-2">
          <Text className="text-textSecondary text-xs mb-1">
            {formatRelativeTime(lastMessage.updatedAt as string , currentLanguage )} 
          </Text>
          {unreadCount > 0 && (
            <View className="bg-primary rounded-full min-w-[20px] h-5 items-center justify-center px-1.5">
              <Text className="text-white text-xs font-semibold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}