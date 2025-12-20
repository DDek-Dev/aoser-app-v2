import { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ScreenWrapper from 'components/ui/ScreenWrapper';
import { useChatRoom } from 'hooks/useChat';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { FreelancerStackParamList } from 'types/navigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import SocketService from 'service/soctketService';
import { getPresignedUrls, uploadFileToUrl } from 'api/uploadUtils';

import { useAuth } from 'hooks/useAuth';

// Import components
import MediaPreviewModal from 'components/chat/MediaPreviewModal';

import FileOptionsMenu from 'components/chat/FileOptionsMenu';
import ChatListContainer from 'components/chat/ChatListContainer';
import { chatApi } from 'api/chatApi';
import ProjectSelectionModal from 'components/chat/ProjectSelectionModal';
import { MediaFile, Message, WorkApplies, OptimisticMessage, Job } from 'types';
import { useMessageActions } from 'hooks/useMessageActions';
import { publicWorkKeys, useGetAllAppliedWork } from 'hooks/usePublicWork';
import { useQueryClient } from '@tanstack/react-query';
import { publiceWorkApi } from 'api/publicWork';
// import ChatItemSkeleton from 'skeletonScreens/ChatItemSkeleton';
import MessagelistSkeleton from 'skeletonScreens/MessagelistSkeleton';
import { useTranslation } from 'react-i18next';
import { ALERT_TYPE, Toast } from 'react-native-alert-notification';
import { profileImage } from 'assets';



const BASE_IMAGE = process.env.EXPO_PUBLIC_IMAGES_URL;

const RoomChat = () => {
  const route = useRoute<RouteProp<FreelancerStackParamList, 'RoomChat'>>();
  const navigation = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>();
  const queryClient = useQueryClient();
  const { userId: partnerId } = route.params;
  const { data: works, isLoading: appliIsLoading } = useGetAllAppliedWork();
  const { tokens, user, isLoadingAuth } = useAuth();

  const { data: chat, isLoading } = useChatRoom(partnerId);

  if (!user?._id) {
    return null;
  }

  const SERVER_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

  // State
  const [fileOptionsVisible, setFileOptionsVisible] = useState(false);
  const [chatFadeAnim] = useState(new Animated.Value(0));
  const [message, setMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);
  const [showMediaPreview, setShowMediaPreview] = useState(false);

  const [showProjectSelection, setShowProjectSelection] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isFileSending, setIsFileSending] = useState(false);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [updateTo, setUpdateTo] = useState<Message | null>(null);
  // Default upload size limits
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

  // Refs
  const textInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { t } = useTranslation();
  const {
    handleCopyMessage,
    // handleReplyToMessage,
    handleAIResponse,
  } = useMessageActions();


  const handleReplyToMessage = useCallback((message: Message) => {
    console.log('message', message)
    setReplyTo(message)
    return message
  }, []);
  const handleUpdateMessage = useCallback((message: Message) => {
    console.log('message on update', message)
    setUpdateTo(message)
    return message
  }, []);
  // console.log('replto', replyTo)


  // Load initial messages from API
  useEffect(() => {



    if (updateTo) {
      setMessage(updateTo.message)
    } else {
      if (!replyTo) {
        setMessage('');
      }
    }
    // ✅ PREFETCH ALL WORK IDs (only happens once per session)
    const workMessages = chat?.conversationMessages.filter(
      (msg: Message) => msg.messageType === 'WORK' && msg.work
    );

    workMessages?.forEach((msg: Message) => {
      const workId = msg.work?._id;
      const work = msg.work

      if (workId) {
        // Check if already in cache
        const cachedData = queryClient.getQueryData(publicWorkKeys.detail(work as Job));

        // ✅ ONLY FETCH IF NOT IN CACHE
        if (!cachedData) {
          queryClient.prefetchQuery({
            queryKey: publicWorkKeys.detail(workId as any),
            queryFn: () => publiceWorkApi.getPublicWorkById(workId),
            staleTime: Infinity,
          });
        }
      }
    });

  }, [chat?.conversationMessages, queryClient, updateTo]);


  // Socket connection and event listeners
  useEffect(() => {
    if (!SERVER_URL || !tokens?.accessToken || !chat?.conversation?._id) return;

    const conversationId = chat.conversation._id;

    console.log('chat.conversation._id', chat.conversation._id)
    try {
      // Connect socket
      SocketService.connect(SERVER_URL, tokens.accessToken, user?._id || null);

      // Wait a bit for connection, then join
      const joinTimeout = setTimeout(() => {
        if (SocketService.isConnected()) {
          SocketService.joinConversation(conversationId);
        }
      }, 500);

      // Listen for new messages
      const handleNewMessage = (newMessage: Message & { tempId?: string }) => {


        setMessages(prev => {
          // Check if message already exists (avoid duplicates)
          if (prev.some(m => m._id === newMessage._id)) {
            return prev;
          }

          // If server echoed tempId, replace matching optimistic message
          if ((newMessage as any).tempId) {
            const idx = prev.findIndex(m => (m as OptimisticMessage).tempId === (newMessage as any).tempId);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = newMessage;
              return updated;
            }
          }

          // Fallback: replace first pending optimistic message from this user
          const tempIndex = prev.findIndex(m => (m as OptimisticMessage).pending && m.sender === newMessage.sender);
          if (tempIndex !== -1 && newMessage.sender === user._id) {
            const updated = [...prev];
            updated[tempIndex] = newMessage;
            return updated;
          }

          return [...prev, newMessage];
        });



        // Auto-mark as read if from other user
        // if (newMessage.sender !== user._id) {
        //   SocketService.markMessagesAsRead(conversationId);
        // }
      };

      // Listen for message status updates
      const handleStatusUpdate = (data: { conversationId: string; status: string }) => {
        if (data.conversationId !== conversationId) {

          setMessages(prev =>
            prev.map(msg =>
              msg.sender === user._id && msg.status !== 'READ'
                ? { ...msg, status: data.status as 'SENT' | 'DELIVERED' | 'READ' }
                : msg
            )
          );
        }
      };

      // Listen for typing indicators
      const handleTyping = (data: { userId: string; isTyping: boolean }) => {
        if (data.userId !== user._id) {
          setTypingUsers(prev => {
            if (data.isTyping) {
              return prev.includes(data.userId) ? prev : [...prev, data.userId];
            } else {
              return prev.filter(id => id !== data.userId);
            }
          });
        }
      };



      SocketService.onMessageReceived(handleNewMessage);
      SocketService.onMessageStatusUpdate(handleStatusUpdate);
      SocketService.onTyping(handleTyping);

      return () => {
        clearTimeout(joinTimeout);
        SocketService.removeListener('message:send');
        SocketService.removeListener('messages:status:update');
        SocketService.removeListener('typing');
      };
    } catch (err) {
      console.log('Socket error:', err);
    }
  }, [SERVER_URL, tokens?.accessToken, user?._id, chat?.conversation?._id]);

  // Keyboard listeners
  useEffect(() => {
    Animated.timing(chatFadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);



  // Handlers
  const handleShowOptions = () => {
    setFileOptionsVisible(!fileOptionsVisible);
    if (!fileOptionsVisible) {
      Keyboard.dismiss();
      textInputRef.current?.blur();
    }
  };

  const handleBackgroundPress = () => {
    if (fileOptionsVisible) {
      setFileOptionsVisible(false);
    }
  };

  const handleProjectSelection = () => {
    setShowProjectSelection(true);
    setFileOptionsVisible(false);
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('chat.chatroom.permissionNeeded'), t('chat.chatroom.cameraPermissionMessage'));
      return false;
    }
    return true;
  };

  const handlePhotoSelection = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        const mediaFiles: MediaFile[] = result.assets.map((asset, index) => {
          const isVideo = asset.type === 'video' || asset.mimeType?.startsWith('video/');
          return {
            id: `${Date.now()}_${index}`,
            uri: asset.uri,
            type: isVideo ? 'video' : 'image',
            name: asset.fileName || `${isVideo ? 'video' : 'image'}_${index + 1}.${isVideo ? 'mp4' : 'jpg'}`,
            size: asset.fileSize,
            mimeType: asset.mimeType,
          };
        });

        setSelectedMedia(mediaFiles);
        setShowMediaPreview(true);
      }
    } catch (error) {

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('chat.chatroom.error'),
        textBody: t('chat.chatroom.failedToSelectMedia'),
      });
    }
    setFileOptionsVisible(false);
  };

  const handleFileSelection = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
        ],
      });

      if (!result.canceled && result.assets) {
        const mediaFiles: MediaFile[] = result.assets.map((asset, index) => ({
          id: `${Date.now()}_${index}`,
          uri: asset.uri,
          type: 'document' as const,
          name: asset.name,
          size: asset.size,
          mimeType: asset.mimeType,
        }));

        sendMediaMessage(mediaFiles, '');
      }
    } catch (error) {

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('chat.chatroom.error'),
        textBody: t('chat.chatroom.failedToSelectFiles'),
      });
    }
    setFileOptionsVisible(false);
  };

  const handleLocationSelection = () => {
    // let user pick duration
    Alert.alert(
      t('chat.chatroom.shareLocation') || 'Share location',
      t('chat.chatroom.chooseDuration') || 'How long should this location be shared?',
      [
        { text: '15 min', onPress: () => shareLocation(15) },
        { text: '60 min', onPress: () => shareLocation(60) },
        { text: '8 h', onPress: () => shareLocation(8 * 60) },
        { text: '24 h', onPress: () => shareLocation(24 * 60) },
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
      ]
    );
  };

  const shareLocation = async (durationMinutes: number) => {
    if (!chat?.conversation?._id) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('chat.chatroom.permissionNeeded') || 'Permission needed', t('chat.chatroom.locationPermissionMessage') || 'Location permission is required to share your location.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude } = pos.coords;
      const expiresAt = Date.now() + durationMinutes * 60_000;
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: OptimisticMessage = {
        tempId,
        conversation: chat.conversation._id,
        sender: user._id,
        message: `Shared location (${durationMinutes} min)`,
        messageType: 'LOCATION',
        status: 'SENT',
        pending: true,
        isUnSend: false,
        // attach location data so UI can render
        // @ts-ignore
        location: { latitude, longitude },
        // @ts-ignore
        mapsUrl,
        // @ts-ignore
        expiresAt,
      };

      setMessages(prev => [...prev, optimisticMessage as Message]);

      SocketService.sendMessage(
        {
          conversationId: chat.conversation._id,
          tempId,
          message: optimisticMessage.message,
          messageType: 'LOCATION',
          location: { latitude, longitude },
          mapsUrl,
          expiresAt,
        },
        (response) => {
          if (response?.ok && response.message) {
            setMessages(prev => prev.map(m => (m as OptimisticMessage).tempId === tempId ? response.message : m));
          } else {
            setMessages(prev => prev.filter(m => (m as OptimisticMessage).tempId !== tempId));
            Alert.alert(t('chat.chatroom.error') || 'Error', t('chat.chatroom.failedToShareLocation') || 'Failed to share location');
          }
        }
      );

    } catch (err) {
      console.log('shareLocation error', err);
      Alert.alert(t('chat.chatroom.error') || 'Error', t('chat.chatroom.failedToShareLocation') || 'Failed to share location');
    }

    setFileOptionsVisible(false);
  };


  // send project function

  const sendProjectMessage = (selectedProjects: WorkApplies[]) => {
    if (!chat?.conversation?._id) return;
    selectedProjects.forEach((project, idx) => {
      const workId = project.work;
      const tempId = `temp_${Date.now()}_${idx}`;

      // ✅ CACHE THE WORK DATA IMMEDIATELY (so it never needs to fetch)
      queryClient.setQueryData(
        publicWorkKeys.detail(workId),
        project.work // You already have the full work object here!
      );

      const optimisticMessage: OptimisticMessage = {
        tempId,
        conversation: chat.conversation._id,
        sender: user._id,
        message: '',
        isUnSend: false,
        work: workId,
        messageType: 'WORK',
        status: 'SENT',
        pending: true,
      };

      setMessages(prev => [...prev, optimisticMessage as Message]);

      SocketService.sendMessage(
        {
          conversationId: chat.conversation._id,
          message: optimisticMessage.message,
          work: workId,
          messageType: 'WORK',
        },
        (response) => {
          if (response?.ok && response.message) {
            setMessages(prev =>
              prev.map(m => (m as OptimisticMessage).tempId === tempId ? response.message : m)
            );
          } else {
            setMessages(prev => prev.filter(m => (m as OptimisticMessage).tempId !== tempId));

            Toast.show({
              type: ALERT_TYPE.DANGER,
              title: t('chat.chatroom.error'),
              textBody: `${t('chat.chatroom.failedToSendProject')} ${project.work?.workTitle || workId}`,
            });
          }
        }
      );
    });


  };


  // SEND MEDIA FUCNTION 
  const sendMediaMessage = async (mediaFiles: MediaFile[], textMessage: string) => {
    if (!chat?.conversation?._id) return;
    setIsFileSending(true);
    // Build file metadata for presigned URL request
    const fileMeta = mediaFiles.map(f => ({
      name: f.name || `file_${Date.now()}`,
      type: f.mimeType || 'application/octet-stream',
    }));

    // Validate sizes before requesting presigned URLs
    const oversized = mediaFiles
      .map((f, idx) => ({ f, idx }))
      .filter(({ f }) => {
        const isVideo = f.type === 'video' || f.mimeType?.startsWith('video/');
        const size = f.size || 0;
        console.log('File blob size:', size);
        return isVideo ? size > MAX_VIDEO_SIZE : size > MAX_IMAGE_SIZE;
      });

    if (oversized.length > 0) {
      const list = oversized
        .map(({ f }) => `${f.name || f.uri.split('/').pop()} (${Math.round((f.size || 0) / 1024)} KB)`)
        .join('\n');

      Toast.show({
        type: ALERT_TYPE.DANGER,
        title: t('chat.chatroom.fileTooLarge'),
        textBody: t('chat.chatroom.fileTooLargeMessage'),
      });
      return;
    }

    let presigned;
    try {
      presigned = await getPresignedUrls(fileMeta);
    } catch (err) {
      console.log('Failed to get presigned urls', err);

      return;
    }

    const tempId = `temp_${Date.now()}`;

    // Optimistic UI: show local URIs until server responds
    const optimisticMessage: OptimisticMessage = {
      tempId,
      conversation: chat.conversation._id,
      sender: user._id,
      isUnSend: false,
      message: textMessage || '',
      files: mediaFiles.map(f => f.uri),
      messageType: 'FILE',
      status: 'SENT',
      pending: true,
      replyTo: replyTo?._id,
    };

    setMessages(prev => [...prev, optimisticMessage as Message]);

    // Upload each file to its presigned URL
    try {
      await Promise.all(presigned.map((p, idx) =>
        uploadFileToUrl(p.url, mediaFiles[idx].uri, p.contentType || fileMeta[idx].type)
      ));
      setIsFileSending(false);
    } catch (err) {
      console.log('File upload failed', err);
      Alert.alert('Upload failed', 'One or more file uploads failed.');
      setMessages(prev => prev.filter(m => (m as OptimisticMessage).tempId !== tempId));
      setIsFileSending(false);
      return;
    }

    // After upload succeed, send message using the server-side filename/key (not local URIs)
    const sentFileNames = presigned.map(p => p.filename || p.key);

    SocketService.sendMessage(
      {
        conversationId: chat.conversation._id,
        tempId,
        message: textMessage || '',
        files: sentFileNames,
        messageType: 'FILE',
      },
      (response) => {
        if (response?.ok && response.message) {
          setMessages(prev =>
            prev.map(m =>
              (m as OptimisticMessage).tempId === tempId ? response.message : m
            )
          );
        } else {
          Alert.alert('Error', 'Failed to send files');
          setMessages(prev => prev.filter(m => (m as OptimisticMessage).tempId !== tempId));
        }
      }
    );

    setSelectedMedia([]);
    setShowMediaPreview(false);
    setMessage('');
    setIsFileSending(false);

  };

  const handleSendMessage = () => {
    if (!message.trim() || !chat?.conversation?._id) return;

    // Check if we're updating an existing message
    if (updateTo) {
      handleNewUpdateMessage();
      return;
    }
    const tempId = `temp_${Date.now()}`;

    // Optimistic UI
    const optimisticMessage: OptimisticMessage = {
      tempId,
      conversation: chat.conversation._id,
      sender: user._id,
      isUnSend: false,
      message: message.trim(),
      messageType: 'TEXT',
      status: 'SENT',
      pending: true,
      replyTo: replyTo?._id,
    };

    setMessages(prev => [...prev, optimisticMessage as Message]);
    setMessage('');

    // Stop typing indicator
    SocketService.sendTypingIndicator(chat.conversation._id, false);

    // Send via socket
    SocketService.sendMessage(
      {
        conversationId: chat.conversation._id,
        // tempId,
        message: optimisticMessage.message,
        messageType: 'TEXT',
        replyTo: replyTo?._id,
      },
      (response) => {
        if (response?.ok && response.message) {
          // Replace optimistic message with server message
          setMessages(prev =>
            prev.map(m =>
              (m as OptimisticMessage).tempId === tempId ? response.message : m
            )
          );
        } else {
          // Mark as failed
          Alert.alert('Error', 'Failed to send message');
          setMessages(prev => prev.filter(m => (m as OptimisticMessage).tempId !== tempId));
        }
      }
    );

  };

  const handleNewUpdateMessage = () => {
    if (!updateTo || !message.trim() || !chat?.conversation?._id) return;

    const messageId = updateTo._id;
    const updatedText = message.trim();

    // Optimistically update the message in the UI
    setMessages(prev =>
      prev.map(m =>
        m._id === messageId
          ? { ...m, message: updatedText, isEdited: true }
          : m
      )
    );

    // Clear the update state and input
    setMessage('');
    setUpdateTo(null);

    // Send update via socket
    SocketService.updateMessage(
      {
        messageId: messageId as string,
        message: updatedText as any,
      },

    );

    // Stop typing indicator
    SocketService.sendTypingIndicator(chat.conversation._id, false);
  }

  const handleTyping = (text: string) => {

    setMessage(text);

    if (!chat?.conversation?._id) return;

    if (text.length > 0) {
      SocketService.sendTypingIndicator(chat.conversation._id, true);

      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

    } else {
      SocketService.sendTypingIndicator(chat.conversation._id, false);
    }
  };

  ;

  const handleCloseMediaPreview = () => {
    setShowMediaPreview(false);
    setSelectedMedia([]);
  };

  // Helper to infer media type from uri or mimeType
  const inferTypeFromUri = (uri?: string, mimeType?: string) => {
    if (mimeType) {
      if (mimeType.startsWith('video/')) return 'video' as const;
      if (mimeType.startsWith('image/')) return 'image' as const;
      if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document' as const;
    }

    if (!uri) return 'image' as const;
    const cleaned = uri.split('?')[0].split('#')[0];
    const parts = cleaned.split('.');
    const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
    const videoExts = ['mp4', 'mov', 'webm', 'mkv', '3gp', 'avi', 'flv', 'wmv', 'mpeg'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'bmp', 'svg'];
    const docExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];

    if (videoExts.includes(ext)) return 'video' as const;
    if (imageExts.includes(ext)) return 'image' as const;
    if (docExts.includes(ext)) return 'document' as const;
    return 'image' as const;
  };

  const allMedia = messages.flatMap(msg =>
    (msg.files || []).map((f: any, idx: number) => {
      if (typeof f === 'string') {
        const uri = f;
        const type = inferTypeFromUri(uri);
        return {
          id: uri || `${msg._id || 'msg'}_${idx}`,
          uri,
          type,
          name: uri.split('/').pop() || 'file',
        } as MediaFile;
      }
      // If backend already sent an object, ensure type is present or inferred
      const obj = f as MediaFile;
      if (!obj.type) {
        obj.type = inferTypeFromUri(obj.uri, obj.mimeType);
      }
      return obj as MediaFile;
    }) || []
  );

  if (isLoadingAuth || !user?._id || isLoading || !chat) {
    return <MessagelistSkeleton />;

  }

  // console.log('all nedia:', allMedia);

  return (
    <ScreenWrapper safeEdges={['top', 'bottom']}>
      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <View className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3 border-b border-border bg-surface">
            <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
              <MaterialIcons name="chevron-left" size={32} color="#2b82F6" />
            </TouchableOpacity>

            <Pressable className='flex-row items-center gap-2' onPress={() => navigation.navigate('AuthFreelancerProfile', { userId: chat.userProfile._id })}>

             

              <View className="">
                <Text className="text-body text-text font-bold">
                  {chat.userProfile.firstName} {chat.userProfile.lastName || ''}
                </Text>
                {typingUsers.length > 0 && (
                  <Text className="text-sm text-primary">{t('chat.chatroom.typing')}</Text>
                )}
              </View>
              {/* <Header_back iconColor='#2b82F6' onPress={() => navigation.goBack()} /> */}
              {chat.userProfile.userProfileImage ? (
                <Image
                  source={{ uri: BASE_IMAGE + chat.userProfile.userProfileImage }}
                  className="w-10 h-10 rounded-full mr-3"
                />
              ) : (
                <Image
                  source={profileImage}
                  className="w-10 h-10 rounded-full mr-3"
                />
              )}

            </Pressable>

          </View>

          {/* Chat List */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Animated.View
              style={{
                flex: 1,
                opacity: chatFadeAnim,
                paddingBottom: keyboardHeight > 0 ? 120 : 80,
              }}
            >
              <ChatListContainer
                messages={messages}

                onUpdateMessages={handleUpdateMessage}
                onCopyMessage={handleCopyMessage}
                onReplyToMessage={handleReplyToMessage}
                onAIResponse={handleAIResponse}
                keyboardHeight={keyboardHeight}
                flatListRef={flatListRef}
                onFetchPage={async (skip: number, limit: number) => {
                  try {
                    if (!tokens?.accessToken || (!partnerId && !chat?.userProfile?._id)) {
                      return [];
                    }
                    const userIdForFetch = partnerId || chat.userProfile._id;
                    const res = await chatApi.getChatroom(tokens.accessToken, userIdForFetch, skip, limit);
                    const list = res?.conversationMessages || [];
                    return list;
                  } catch (e: any) {
                    console.log('Failed to fetch messages:', e);
                    return [];
                  }
                }}
                pageSize={20}

              />
            </Animated.View>
          </KeyboardAvoidingView>

          {/* File Options Menu */}
          <FileOptionsMenu
            visible={fileOptionsVisible}
            keyboardHeight={keyboardHeight}
            onPhotoSelection={handlePhotoSelection}
            onFileSelection={handleFileSelection}
            onProjectSelection={handleProjectSelection}
            onLocationSelection={handleLocationSelection}
            onClose={() => setFileOptionsVisible(false)}
          />



          {/* Chat Input */}
          <View
            className="px-4 py-4 bg-surface border-t border-border"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20,
            }}
          >
            {replyTo && (
              <View className='mx-4 mb-2 p-3 rounded-lg bg-border border-l-4 border-blue-500'>
                <View className='flex-row items-start justify-between'>
                  <View className='flex-1 mr-2'>
                    {/* Reply label */}
                    <Text className='text-xs font-semibold text-gray-500 mb-1'>
                      {t('chat.chatroom.replyingTo')}
                    </Text>

                    {/* Message content */}
                    {replyTo.message && (
                      <Text
                        className='text-sm text-gray-700'
                        numberOfLines={2}
                        ellipsizeMode='tail'
                      >
                        {replyTo.message}
                      </Text>
                    )}

                    {/* File preview */}
                    {replyTo.files && replyTo.files.length > 0 && (() => {
                      const fileUri = BASE_IMAGE + replyTo.files[0];
                      const fileType = inferTypeFromUri(fileUri);

                      return (
                        <View className='flex-row items-center mt-2'>
                          {fileType === 'image' && (
                            <Image
                              source={{ uri: fileUri }}
                              className="w-12 h-12 rounded-md mr-2"
                              resizeMode="cover"
                            />
                          )}

                          {fileType === 'video' && (
                            <View className='w-12 h-12 rounded-md mr-2 bg-gray-800 items-center justify-center'>
                              <Ionicons name="play-circle" size={28} color="#FFF" />
                            </View>
                          )}

                          {fileType === 'document' && (
                            <View className='w-12 h-12 rounded-md mr-2 bg-blue-100 items-center justify-center'>
                              <Ionicons name="document-text" size={28} color="#3B82F6" />
                            </View>
                          )}

                          <View className='flex-1'>
                            <Text className='text-xs text-gray-700 font-medium' numberOfLines={1}>
                              {replyTo.files[0].split('/').pop()}
                            </Text>
                            <Text className='text-xs text-gray-400 capitalize'>
                              {fileType}
                            </Text>
                          </View>
                        </View>
                      );
                    })()}
                  </View>

                  {/* Close button */}
                  <Pressable
                    onPress={() => setReplyTo(null)}
                    className='p-1 rounded-full bg-gray-200 active:bg-gray-300'
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close" size={18} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
            )}
            <View className="flex-row items-end">
              <TouchableOpacity
                onPress={handleShowOptions}
                className={`mr-3 mb-2 w-10 h-10 rounded-full items-center justify-center border ${fileOptionsVisible ? 'bg-primary border-primary' : 'border-gray-300'
                  }`}
              >
                <Text
                  className={`text-body font-bold ${fileOptionsVisible ? 'text-white' : 'text-primary'
                    }`}
                >
                  +
                </Text>
              </TouchableOpacity>


              <TextInput
                ref={textInputRef}
                className="flex-1 bg-background px-4 py-3 rounded-2xl text-body text-text"
                placeholder={t('chat.chatroom.typeMessage')}
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={handleTyping}
                multiline={true}
                textAlignVertical="top"
                returnKeyType="default"
                blurOnSubmit={false}
                scrollEnabled={true}
                editable={true}  // ✅ Ensure it's editable
                keyboardType="default"
                style={{
                  minHeight: 44,
                  maxHeight: 120,
                  lineHeight: 20,
                  paddingTop: Platform.OS === 'ios' ? 12 : 8,
                  paddingBottom: Platform.OS === 'ios' ? 12 : 8,
                }}
                autoFocus={false}
                onFocus={() => {
                  setFileOptionsVisible(false);

                }}
              />

              <TouchableOpacity
                onPress={() => { handleSendMessage(); setReplyTo(null) }}
                className={`ml-3 mb-2 w-10 h-10 rounded-full items-center justify-center ${message.trim() ? 'bg-primary' : 'bg-gray-300'
                  }`}
                disabled={!message.trim()}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={message.trim() ? '#fff' : '#9CA3AF'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Media Preview Modal */}
          <MediaPreviewModal
            visible={showMediaPreview}
            selectedMedia={selectedMedia}
            message={message}
            onMessageChange={setMessage}
            onClose={handleCloseMediaPreview}
            onSend={sendMediaMessage}
            isSending={isFileSending}
          />



          {/* Project Selection Modal */}
          <ProjectSelectionModal
            visible={showProjectSelection}
            projects={works || []}
            isLoading={appliIsLoading}
            onClose={() => setShowProjectSelection(false)}
            onProjectsSelect={sendProjectMessage}
          />
        </View>
      </TouchableWithoutFeedback>
    </ScreenWrapper>
  );
};

export default RoomChat;