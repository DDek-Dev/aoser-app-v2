import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  Animated,
  Dimensions,
  Pressable,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MediaFile, Message } from 'types';
import ProjectMessageItem from './ProjectMessageItem';
import MediaRenderer from './MediaRenderer';
import { useAuth } from 'hooks/useAuth';
import soctketService from 'service/soctketService';
import FullScreenMediaModal from './FullScreenMediaModal';
import { useTranslation } from 'react-i18next';
import ProjectOfferingMessage from './ProjectOfferingMessage';
import { map } from 'assets';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;


interface ChatMessageItemProps {
  item: Message;

  onUpdateMessage: (message: Message) => void;
  onCopyMessage?: (message: string) => void;
  onReplyToMessage?: (message: Message) => void;
  onAIResponse?: (message: Message) => void;
  onUnsendMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  isDeleteMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (messageId: string) => void;
  onEnterDeleteMode?: () => void;
  messageOption?: () => void;
}

interface ActionMenuProps {
  item: Message;
  visible: boolean;
  position: { x: number; y: number };
  onUpdate: () => void
  onClose: () => void;
  onCopy: () => void;
  onReply: () => void;
  onUnsend: () => void;
  onAIResponse: () => void;
  onDelete: () => void;

  isFromUser: boolean;

}

const ActionMenu: React.FC<ActionMenuProps> = ({
  item,
  visible,
  position,
  onClose,
  onCopy,
  onReply,
  onUnsend,
  onAIResponse,
  onDelete,
  onUpdate,
  isFromUser
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const { t } = useTranslation();
  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const menuItems = [
    ...(isFromUser && item.messageType !== 'WORK'
      ? [{ icon: '', label: t('chat.chatroom.edit'), action: onUpdate, dangerous: false }]
      : []),
    { icon: 'copy-outline', label: t('chat.chatroom.copy'), action: onCopy },
    { icon: 'arrow-undo-outline', label: t('chat.chatroom.reply'), action: onReply },
    // { icon: 'sparkles-outline', label: 'AI Response', action: onAIResponse },
    { icon: 'trash-outline', label: t('chat.chatroom.delete_for_me'), action: onDelete, dangerous: true },
    ...(isFromUser
      ? [{ icon: 'close', label: t('chat.chatroom.unsend'), action: onUnsend, dangerous: true }]
      : []),
  ];


  // Calculate menu position to ensure it stays on screen
  const menuWidth = 160;
  const menuHeight = menuItems.length * 50 + 16;

  let adjustedX = position.x;
  let adjustedY = position.y;

  if (adjustedX + menuWidth > screenWidth) {
    adjustedX = screenWidth - menuWidth - 20;
  }
  if (adjustedY + menuHeight > screenHeight) {
    adjustedY = adjustedY - menuHeight - 20;
  }



  return (

    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <Animated.View
            style={{
              position: 'absolute',
              left: adjustedX,
              top: adjustedY,
              backgroundColor: 'white',
              borderRadius: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
              minWidth: menuWidth,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }}
          >
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => {
                  item.action();
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  // justifyContent: "start",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                  borderBottomColor: '#f3f4f6',
                }}
              >
                <Ionicons
                  name={item.icon as any}
                  size={20}
                  color={item.dangerous ? '#ef4444' : '#374151'}
                  style={{ marginRight: 12 }}
                />
                <Text
                  style={{
                    color: item.dangerous ? '#ef4444' : '#374151',

                  }}

                  className='text-body'
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  item,

  onUpdateMessage,
  onCopyMessage,
  onReplyToMessage,
  onAIResponse,
  // onDeleteMessage,
  isDeleteMode = false,
  isSelected = false,
  onToggleSelect,
  onEnterDeleteMode,
}) => {


  const { user } = useAuth();
  const isFromUser = item.sender === user?._id;
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [isUnsendConplete, setIsUnsendComplete] = useState(false);
  const [isDeleteCompleteID, setIsDeleteCompleteID] = useState('');
  const [isFullScreenModalVisible, setIsFullScreenModalVisible] = useState(false);
  const [fullScreenMedia, setFullScreenMedia] = useState<MediaFile | null>(null);

  // const currentLanguage = getCurrentLanguage();


  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const { t } = useTranslation()
  // Normalize item.files which may be string[] (urls) or MediaFile[] into MediaFile[]
  const inferTypeFromUri = (uri: string, mimeType?: string) => {
    if (mimeType && mimeType.startsWith('video/')) return 'video';
    if (mimeType && mimeType.startsWith('image/')) return 'image';
    const clean = uri.split('?')[0].toLowerCase();
    const ext = clean.includes('.') ? clean.split('.').pop() : '';
    const videoExts = ['mp4', 'mov', 'webm', 'mkv', 'avi', '3gp'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
    if (ext && videoExts.includes(ext)) return 'video';
    if (ext && docExts.includes(ext)) return 'document';
    return 'image';
  };

  const mediaList: MediaFile[] = (item.files || []).map((f: any, idx: number) => {
    if (typeof f === 'string') {
      const type = inferTypeFromUri(f);
      return {
        id: f || `${item._id || 'msg'}_${idx}`,
        uri: f,
        type: type as 'image' | 'video' | 'document',
        name: f.split('/').pop() || 'file',
      } as MediaFile;
    }
    // If it's already MediaFile-like, ensure uri is present
    const mf = f as MediaFile;
    if (!mf.type || !mf.uri) {
      const type = inferTypeFromUri(String(mf.uri || mf.name || ''), mf.mimeType);
      return {
        id: mf.id || `${item._id || 'msg'}_${idx}`,
        uri: String(mf.uri || mf.name || ''),
        type: type as 'image' | 'video' | 'document',
        name: mf.name || String(mf.uri || '').split('/').pop() || 'file',
        size: mf.size,
        mimeType: mf.mimeType,
      } as MediaFile;
    }
    return mf;
  });


  const handleLongPress = (event: any) => {
    if (isDeleteMode) return;

    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setShowActionMenu(true);

  };

  const handleUpdate = () => {
    if (item.message && onUpdateMessage) {
      onUpdateMessage(item);
    }
  };
  const handleCopy = () => {
    if (item.message && onCopyMessage) {
      onCopyMessage(item.message);
    }
  };

  const handleReply = () => {
    if (onReplyToMessage) {
      onReplyToMessage(item);
    }
  };

  const handleAIResponse = () => {
    if (onAIResponse) {
      onAIResponse(item);
    }
  };

  const handleDelete = () => {
    soctketService.deleteMessageForme({ messageId: item._id });
    setIsDeleteCompleteID(item._id || '');
  };


  const handleMediaPress = (media: MediaFile) => {
    setFullScreenMedia(media);
    setIsFullScreenModalVisible(true);
  };
  const handleUnsend = () => {
    soctketService.emitUnsendMessage({ messageId: item._id });
    setIsUnsendComplete(true);
  }
  const handleSelectToggle = () => {
    if (onToggleSelect) {
      onToggleSelect(item._id || '');
    }
  };

  const renderMediaGrid = () => {
    if (!mediaList || mediaList.length === 0) return null;

    const mediaCount = mediaList.length;
    // console.log("mediaList in meesafe item: ", mediaList)
    if (mediaCount === 1) {
      return (
        <MediaRenderer
          media={mediaList[0]}
          index={0}
          allMedia={mediaList ?? []}
          onMediaPress={handleMediaPress}
        />
      );
    } else if (mediaCount === 2) {
      return (
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {mediaList.map((media, index) => (
            <MediaRenderer
              key={media.id}
              media={media}
              index={index}
              allMedia={mediaList ?? []}
              onMediaPress={handleMediaPress}
            />
          ))}
        </View>
      );
    } else if (mediaCount === 3) {
      return (
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <MediaRenderer
            key={mediaList[0].id}
            media={mediaList[0]}
            index={0}
            allMedia={mediaList}
            onMediaPress={handleMediaPress}
          />
          <View style={{ flexDirection: 'column' }}>
            <MediaRenderer
              key={mediaList[1].id}
              media={mediaList[1]}
              index={1}
              allMedia={mediaList}
              onMediaPress={handleMediaPress}
            />
            <MediaRenderer
              key={mediaList[2].id}
              media={mediaList[2]}
              index={2}
              allMedia={mediaList}
              onMediaPress={handleMediaPress}
            />
          </View>
        </View>
      );
    } else if (mediaCount === 4) {
      return (
        <View style={{ marginTop: 8 }}>
          <View style={{ flexDirection: 'row' }}>
            <MediaRenderer
              key={mediaList[0].id}
              media={mediaList[0]}
              index={0}
              allMedia={mediaList}
              onMediaPress={handleMediaPress}
            />
            <MediaRenderer
              key={mediaList[1].id}
              media={mediaList[1]}
              index={1}
              allMedia={mediaList}
              onMediaPress={handleMediaPress}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <MediaRenderer
              key={mediaList[2].id}
              media={mediaList[2]}
              index={2}
              allMedia={mediaList}
              onMediaPress={handleMediaPress}
            />
            <MediaRenderer
              key={mediaList[3].id}
              media={mediaList[3]}
              index={3}
              allMedia={mediaList}
              onMediaPress={handleMediaPress}
            />
          </View>
        </View>
      );
    } else {
      return (
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          {mediaList.slice(0, 2).map((media, index) => (
            <MediaRenderer
              key={media.id}
              media={media}
              index={index}
              allMedia={mediaList ?? []}
              onMediaPress={handleMediaPress}
            />
          ))}
        </View>
      );
    }
  };


  // console.log("ITEM: ", item)
  return (
    <>
      <Pressable
        onLongPress={handleLongPress}

        onPress={isDeleteMode ? handleSelectToggle : undefined}
        delayLongPress={300}
        // activeOpacity={0.8}
        style={{
          opacity: isDeleteMode && isSelected ? 0.6 : 1,
        }}
      >



        <View className={`flex-row ${isDeleteMode && isSelected ? 'bg-blue-50' : ''}  mb-4 ${isFromUser ? 'justify-end' : 'justify-start'}`}>
          {isDeleteCompleteID === item._id ? (
            <View>

            </View>
          ) : (
            isUnsendConplete || item.isUnSend ? (
              <View className="px-4 py-4 w-[85%] bg-gray-100 rounded-xl  self-center mt-1 mb-1">
                <Text className="text-gray-500 italic  text-caption">
                  {t('chat.chatroom.message_unsent')}
                </Text>
              </View>
            ) : (

              <View className={`max-w-[85%] ${isFromUser ? 'items-end' : 'items-start'}`}>
                {/* Reply Section - Shows first if exists */}
                {item.replyTo && (
                  <View
                    className={`px-3 py-2 border-l-4 ${isFromUser
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-400'
                      }`}
                  >
                    {/* Reply Header Icon */}
                    <View className="flex-row items-center mb-1">
                      <Ionicons
                        name="return-down-forward"
                        size={14}
                        color={isFromUser ? '#3B82F6' : '#6B7280'}
                      />
                      <Text
                        className={`text-xs ml-1 font-medium ${isFromUser ? 'text-blue-600' : 'text-gray-600'
                          }`}
                      >
                        {t('chat.chatroom.replyingTo')}
                      </Text>
                    </View>

                    {/* Reply Content */}
                    <View className="pl-1">
                      {/* Message preview */}
                      {item.replyTo?.message && (
                        <Text
                          className={`text-sm ${isFromUser ? 'text-gray-700' : 'text-gray-600'
                            }`}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {item.replyTo.message}
                        </Text>
                      )}

                      {/* File preview */}
                      {item.replyTo?.files && item.replyTo.files.length > 0 && (() => {
                        const fileUri = BASE_IMAGE + item.replyTo.files[0];
                        const fileType = inferTypeFromUri(fileUri);

                        return (
                          <View className="flex-row ">
                            {fileType === 'image' && (
                              <Image
                                source={{ uri: fileUri }}
                                className="w-10 h-10 rounded-md mr-2"
                                resizeMode="cover"
                              />
                            )}

                            {fileType === 'video' && (
                              <View className="w-10 h-10 rounded-md mr-2 bg-gray-800 items-center justify-center">
                                <Ionicons name="play-circle" size={20} color="#FFF" />
                              </View>
                            )}

                            {fileType === 'document' && (
                              <View className="w-10 h-10 rounded-md mr-2 bg-blue-100 items-center justify-center">
                                <Ionicons name="document-text" size={20} color="#3B82F6" />
                              </View>
                            )}



                            <View className="">
                              <Text
                                className="text-xs text-gray-600 font-medium"
                                numberOfLines={1}
                              >
                                {item.replyTo.files[0].split('/').pop()}
                              </Text>
                              <Text className="text-xs text-gray-400 capitalize">
                                {fileType}
                              </Text>
                            </View>
                          </View>
                        );
                      })()}

                      {item.replyTo?.work && (

                        <View className="py-1 w-64">
                          <View className="flex-row items-center mb-1">
                            <Ionicons name="briefcase-outline" size={16} color={isFromUser ? '#3B82F6' : '#6B7280'} />
                            <Text className="text-body font-semibold text-gray-700 ml-1" numberOfLines={1}>
                              {item.replyTo?.work.workTitle}
                            </Text>
                          </View>
                          <Text numberOfLines={2} className="text-caption text-gray-600">
                            {item.replyTo?.work.description}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Text className="font-bold text-warning text-body">{item.replyTo?.work.currency} </Text>
                            <Text className="font-bold text-primary text-body">
                              {new Intl.NumberFormat().format(item.replyTo?.work.budget as number)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}
                <View
                  className={`rounded-2xl overflow-hidden ${isFromUser
                    ? 'bg-primary rounded-br-sm'
                    : 'bg-surface border border-border rounded-bl-sm'
                    }`}
                >


                  {/* Main Message Content */}
                  <View className="px-4 py-3">
                    {/* Text Message */}
                    {item.message && (
                      <Text
                        className={`text-body ${isFromUser ? 'text-white' : 'text-text'
                          }`}
                      >
                        {item.message}
                      </Text>
                    )}

                    {/* Location Message */}
                    {item.messageType === 'LOCATION' && (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                          const mapsUrl = (item as any).mapsUrl || `https://www.google.com/maps/search/?api=1&query=${(item as any).location?.latitude},${(item as any).location?.longitude}`;
                          if (mapsUrl) Linking.openURL(mapsUrl);
                        }}
                        style={{
                          marginTop: 8,
                          borderRadius: 16,
                          overflow: 'hidden',
                          backgroundColor: isFromUser ? '#3B82F6' : '#fff',
                          // borderWidth: isFromUser ? 0 : 1,
                     
                        }}
                        className='w-[18rem] border border-border'
                      >
                        {/* Map Preview Placeholder / Static Map */}
                        <View style={{
                          height: 120,
                          backgroundColor: isFromUser ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {/* If you have a Google Maps API key, replace this with an Image component using Static Maps API */}
                          {/* <Ionicons
                            name="map"
                            size={40}
                            color={isFromUser ? 'rgba(255,255,255,0.6)' : '#9ca3af'}
                          /> */}

                          <Image
                            source={map}
                            style={{
                              width: '100%',
                              height: '100%',
                            }}
                            resizeMode="contain"
                          />
                          {/* <View style={{
                            position: 'absolute',
                            bottom: 10,
                            right: 10,
                            backgroundColor: '#ef4444',
                            padding: 4,
                            borderRadius: 20,
                            borderWidth: 2,
                            borderColor: '#fff'
                          }}>
                            <Ionicons name="location" size={14} color="#fff" />
                          </View> */}
                        </View>

                        {/* Info Section */}
                        <View style={{ padding: 12 }}>
                          {/* <Text style={{
                            color: isFromUser ? '#fff' : '#1f2937',
                            fontWeight: 'bold',
                            fontSize: 15
                          }}>
                            Current Location { (item as any).mapsUrl }
                          </Text> */}

                          {/* {((item as any).expiresAt) && (
                            <Text style={{
                              color: isFromUser ? 'rgba(255,255,255,0.8)' : '#6b7280',
                              fontSize: 11,
                              marginTop: 2
                            }}>
                              {t('chat.chatroom.live_until')} {new Date((item as any).expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          )} */}

                          <View style={{
                            marginTop: 8,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: isFromUser ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <Text style={{
                              color: isFromUser ? '#fff' : '#3B82F6',
                              fontWeight: '600',
                              fontSize: 13
                            }}>
                              {t('chat.chatroom.view_on_map')} {(item as any).location?.latitude}
                            </Text>
                            <Ionicons
                              name="chevron-forward"
                              size={16}
                              color={isFromUser ? '#fff' : '#3B82F6'}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    )}

                    {/* Render media grid */}
                    {renderMediaGrid()}

                    {/* Projects */}
                    {item.work && item.messageType === 'WORK' && (
                      <View className="mt-2">
                        <ProjectMessageItem projects={item} />
                      </View>
                    )}
                    {item.messageType === 'OFFERING_WORK' && (

                      <View className="mt-2">
                        <ProjectOfferingMessage projects={item} />
                      </View>
                    )}

                    {/* Timestamp and Status */}
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text
                        className={`text-xs ${!isFromUser ? 'text-textSecondary' : 'text-border'
                          }`}
                      >
                        {formatTime(item.createdAt || '')}
                      </Text>

                      {isFromUser && item.status === 'SENT' && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={'#9CA3AF'}
                        />
                      )}

                      {isFromUser && item.status === 'READ' && (
                        <Ionicons
                          name="checkmark-done"
                          size={14}
                          color={!isFromUser ? '#3B82F6' : 'lightblue'}
                        />
                      )}

                      {item.status === 'DELIVERED' && (
                        <Ionicons name="warning" size={14} color="#F59E0B" />
                      )}
                    </View>
                  </View>
                </View>
              </View>
            )

          )}

        </View>
      </Pressable>



      {/* Action Menu */}
      <ActionMenu
        item={item}
        visible={showActionMenu}
        position={menuPosition}
        onClose={() => setShowActionMenu(false)}
        onCopy={handleCopy}
        onUnsend={handleUnsend}
        onReply={handleReply}
        onAIResponse={handleAIResponse}
        onDelete={handleDelete}
        isFromUser={isFromUser}
        onUpdate={handleUpdate}

      />

      <FullScreenMediaModal
        visible={isFullScreenModalVisible}
        mediaList={mediaList}
        initialMedia={fullScreenMedia}
        onClose={() => setIsFullScreenModalVisible(false)}
      />
    </>
  );
};

export default ChatMessageItem;