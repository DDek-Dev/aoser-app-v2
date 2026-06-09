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
  Alert,
  KeyboardAvoidingView,
  Pressable,
  Modal,
  StyleSheet,
  findNodeHandle,
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
import { MediaFile, Message, OptimisticMessage, Job, ProjectUpdateData } from 'types';
import { useMessageActions } from 'hooks/useMessageActions';
import { publicWorkKeys } from 'hooks/usePublicWork';
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
  const { userId: partnerId, workData } = route.params;
  const { tokens, user, isLoadingAuth } = useAuth();
  const currentUserId = user?._id || '';

  const { data: chat, isLoading } = useChatRoom(partnerId);
  // const { data: appliedWorks, isLoading: isLoadingApplied } = useGetAllAppliedWork();
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

  const [showDurationModal, setShowDurationModal] = useState(false);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isWorkData, setWorkData] = useState<boolean>(true);
  const [updateTo, setUpdateTo] = useState<Message | null>(null);

  // Default upload size limits
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

  // Refs
  const textInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<any>(null);
  const remoteTypingTimeoutsRef = useRef<Record<string, any>>({});
  const initializedConversationRef = useRef<string | null>(null);
  const { t } = useTranslation();
  const {
    handleCopyMessage,
    // handleReplyToMessage,
    handleAIResponse,
  } = useMessageActions();

  const fetchMessagesPage = useCallback(
    async (skip: number, limit: number) => {
      try {
        if (!tokens?.accessToken || !partnerId) return [];
        const res = await chatApi.getChatroom(tokens.accessToken, partnerId, skip, limit);
        return res?.conversationMessages || [];
      } catch (e: any) {
        // Avoid noisy logs for expected rate limiting; let the UI keep existing data.
        const status = e?.response?.status;
        if (status !== 429) {
          console.log('Failed to fetch messages:', e);
        }
        return [];
      }
    },
    [tokens?.accessToken, partnerId]
  );


  const handleReplyToMessage = useCallback((message: Message) => {

    setReplyTo(message)
    return message
  }, []);

  const handleUpdateMessage = useCallback((message: Message) => {

    setUpdateTo(message)
    return message
  }, []);
  // console.log('replto', replyTo)

  const getOptimisticTimestamp = useCallback(() => new Date().toISOString(), []);

  const clearRemoteTypingTimeout = useCallback((userId: string) => {
    const timeout = remoteTypingTimeoutsRef.current[userId];
    if (timeout) {
      clearTimeout(timeout);
      delete remoteTypingTimeoutsRef.current[userId];
    }
  }, []);

  const scheduleRemoteTypingClear = useCallback((userId: string) => {
    clearRemoteTypingTimeout(userId);
    remoteTypingTimeoutsRef.current[userId] = setTimeout(() => {
      setTypingUsers(prev => prev.filter(id => id !== userId));
      delete remoteTypingTimeoutsRef.current[userId];
    }, 3500);
  }, [clearRemoteTypingTimeout]);

  const markCurrentConversationRead = useCallback(() => {
    if (!chat?.conversation?._id || !user?._id) return;
    SocketService.markMessagesAsRead(chat.conversation._id);
  }, [chat?.conversation?._id, user?._id]);

  // console.log('chat', JSON.stringify(chat, null, 2))

  useEffect(() => {
    if (!chat?.conversation?._id) return;

    if (initializedConversationRef.current !== chat.conversation._id) {
      initializedConversationRef.current = chat.conversation._id;
      setMessages(chat.conversationMessages || []);
      return;
    }

    // Merge any fresh API messages without removing local optimistic state
    setMessages(prev => {
      const existingIds = new Set(
        prev.map(m => (m as any)._id || (m as any).tempId).filter(Boolean)
      );
      const incoming = (chat.conversationMessages || []).filter(m => {
        const id = (m as any)._id || (m as any).tempId;
        return id && !existingIds.has(id);
      });
      if (incoming.length === 0) return prev;
      return [...prev, ...incoming];
    });
  }, [chat?.conversation?._id, chat?.conversationMessages]);

  useEffect(() => {
    if (updateTo) {
      setMessage(updateTo.message);
    } else if (!replyTo) {
      setMessage('');
    }
  }, [updateTo, replyTo]);


  // Prefetch work payloads used in chat messages
  useEffect(() => {

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

  }, [chat?.conversationMessages, queryClient]);


  // Socket connection and event listeners
  useEffect(() => {
    if (!SERVER_URL || !tokens?.accessToken || !chat?.conversation?._id) return;

    const conversationId = chat.conversation._id;

    try {
      // Connect socket
      SocketService.connect(SERVER_URL, tokens.accessToken, user?._id || null);

      // Wait a bit for connection, then join
      const joinTimeout = setTimeout(() => {
        if (SocketService.isConnected()) {
          SocketService.joinConversation(conversationId);
          markCurrentConversationRead();
        }
      }, 500);

      // Listen for new messages
      const handleNewMessage = (newMessage: Message & { tempId?: string }) => {
        const incomingSenderId = String((newMessage as any)?.sender || '');
        const currentUserId = String(user?._id || '');

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

          // Fallback: replace a matching pending optimistic message from this user
          const tempIndex = prev.findIndex(m => {
            const optimistic = m as OptimisticMessage;
            return optimistic.pending
              && optimistic.sender === newMessage.sender
              && optimistic.messageType === newMessage.messageType
              && (optimistic.message || '') === (newMessage.message || '');
          });
          if (tempIndex !== -1 && incomingSenderId === currentUserId) {
            const updated = [...prev];
            updated[tempIndex] = newMessage;
            return updated;
          }

          return [...prev, newMessage];
        });

        // Auto-mark as read when a new message comes from the other participant
        if (incomingSenderId && incomingSenderId !== currentUserId) {
          markCurrentConversationRead();
        }
      };

      // Listen for message status updates
      const handleStatusUpdate = (data: any) => {
        const payloadConversationId = String(data?.conversationId || data?.conversation || '');
        if (payloadConversationId !== conversationId) return;
        const nextStatus = data?.status as 'SENT' | 'DELIVERED' | 'READ' | undefined;
        if (!nextStatus) return;

        const messageIds: string[] = Array.isArray(data?.messageIds)
          ? data.messageIds.map((id: any) => String(id))
          : data?.messageId
            ? [String(data.messageId)]
            : [];

        setMessages(prev =>
          prev.map(msg =>
            messageIds.length > 0
              ? (messageIds.includes(String(msg._id || '')) ? { ...msg, status: nextStatus } : msg)
              : (
                String(msg.sender || '') === String(user?._id || '') && msg.status !== 'READ'
                  ? { ...msg, status: nextStatus }
                  : msg
              )
          )
        );
      };

      // Listen for typing indicators
      const handleTyping = (data: any) => {
        const typingUserId = String(data?.userId || data?.senderId || data?.sender || '');
        const isTyping = Boolean(data?.isTyping ?? data?.typing);
        if (!typingUserId || typingUserId === String(user?._id || '')) return;

        if (isTyping) {
          setTypingUsers(prev => (prev.includes(typingUserId) ? prev : [...prev, typingUserId]));
          scheduleRemoteTypingClear(typingUserId);
          return;
        }

        clearRemoteTypingTimeout(typingUserId);
        setTypingUsers(prev => prev.filter(id => id !== typingUserId));
      };

      SocketService.onMessageReceived(handleNewMessage);
      SocketService.onMessageStatusUpdate(handleStatusUpdate);
      SocketService.onTyping(handleTyping);

      return () => {
        clearTimeout(joinTimeout);
        setTypingUsers([]);
        Object.keys(remoteTypingTimeoutsRef.current).forEach(id => clearRemoteTypingTimeout(id));
        SocketService.removeListener('message:send');
        SocketService.removeListener('messages:status:update');
        SocketService.removeListener('typing');
      };
    } catch (err) {
      console.log('Socket error:', err);
    }
  }, [
    SERVER_URL,
    tokens?.accessToken,
    user?._id,
    chat?.conversation?._id,
    markCurrentConversationRead,
    clearRemoteTypingTimeout,
    scheduleRemoteTypingClear,
  ]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      markCurrentConversationRead();
    });
    return unsubscribe;
  }, [navigation, markCurrentConversationRead]);

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

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      Object.keys(remoteTypingTimeoutsRef.current).forEach(id => clearRemoteTypingTimeout(id));
    };
  }, [clearRemoteTypingTimeout]);



  // Handlers
  const handleShowOptions = () => {
    setFileOptionsVisible(!fileOptionsVisible);
    if (!fileOptionsVisible) {
      Keyboard.dismiss();
      textInputRef.current?.blur();
    }
  };

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    textInputRef.current?.blur();
  }, []);

  const handleScreenTouchCapture = useCallback(
    (e: any) => {
      // When the file options menu is open, a dedicated overlay handles outside taps.
      // Avoid closing it here or it can unmount before option `onPress` runs.
      if (fileOptionsVisible) return false;

      const target = e?.nativeEvent?.target;
      const textInputState = (TextInput as any)?.State;
      const focusedInput = textInputState?.currentlyFocusedInput?.();

      // `currentlyFocusedField()` is deprecated; only call it as a fallback for older RN.
      let focusedHandle: number | null = null;
      if (focusedInput) {
        focusedHandle = findNodeHandle(focusedInput) as number | null;
      } else if (!textInputState?.currentlyFocusedInput && textInputState?.currentlyFocusedField) {
        focusedHandle = textInputState.currentlyFocusedField();
      }

      const messageInputHandle = textInputRef.current
        ? (findNodeHandle(textInputRef.current) as number | null)
        : null;

      const isTouchOnInput =
        (messageInputHandle != null && target != null && messageInputHandle === target) ||
        (focusedHandle != null && target != null && focusedHandle === target);

      // Dismiss keyboard when tapping outside the message input.
      if ((focusedHandle != null || keyboardHeight > 0) && !isTouchOnInput) {
        dismissKeyboard();
      }

      return false;
    },
    [dismissKeyboard, fileOptionsVisible, keyboardHeight]
  );

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
    setShowDurationModal(true);
  };

  const handleDurationSelect = () => {
    setShowDurationModal(false);
    shareLocation();
  };


  const shareLocation = async () => {
    if (!chat?.conversation?._id || !currentUserId) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Alert.alert(t('chat.chatroom.permissionNeeded') || 'Permission needed', t('chat.chatroom.locationPermissionMessage') || 'Location permission is required to share your location.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const { latitude, longitude } = pos.coords;
      const expiresAt = Date.now();
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: OptimisticMessage = {
        tempId,
        createdAt: getOptimisticTimestamp(),
        conversation: chat.conversation._id,
        sender: currentUserId,
        message: ``,
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
            // Alert.alert(t('chat.chatroom.error') || 'Error', t('chat.chatroom.failedToShareLocation') || 'Failed to share location');
          }
        }
      );

    } catch (err) {
      console.log('shareLocation error', err);
      // Alert.alert(t('chat.chatroom.error') || 'Error', t('chat.chatroom.failedToShareLocation') || 'Failed to share location');
    }

    setFileOptionsVisible(false);
  };



  const sendProjectMessage = (selectedProjects: Job[], updatedData?: ProjectUpdateData[]) => {

    const isOffering = updatedData && updatedData.length > 0;

    if (!isOffering) {
      if (!chat?.conversation?._id || !currentUserId) return;
      selectedProjects.forEach((project, idx) => {
        const workId = project;
        const tempId = `temp_${Date.now()}_${idx}`;

        // ✅ CACHE THE WORK DATA IMMEDIATELY (so it never needs to fetch)
        queryClient.setQueryData(
          publicWorkKeys.detail(workId),
          project // You already have the full work object here!
        );

        const optimisticMessage: OptimisticMessage = {
          tempId,
          createdAt: getOptimisticTimestamp(),
          conversation: chat.conversation._id,
          sender: currentUserId,
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
            tempId,
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
                textBody: `${t('chat.chatroom.failedToSendProject')} ${project?.workTitle || workId}`,
              });
            }
          }
        );
      });

    } else {
      if (!chat?.conversation?._id || !currentUserId) return;
      updatedData.forEach((project, idx) => {
        const workId = project;
        const tempId = `temp_${Date.now()}_${idx}`;
        const optimisticMessage: OptimisticMessage = {
          tempId,
          createdAt: getOptimisticTimestamp(),
          conversation: chat.conversation._id,
          sender: currentUserId,
          offeringWorkId: workId.offeringWorkId as any,
          message: '',
          isUnSend: false,
          messageType: 'OFFERING_WORK',
          status: 'SENT',
          pending: true,
        };

        setMessages(prev => [...prev, optimisticMessage as Message]);

        SocketService.sendMessage(
          {
            conversationId: chat.conversation._id,
            tempId,
            message: optimisticMessage.message,
            offeringWorkId: workId.offeringWorkId,
            messageType: 'OFFERING_WORK',
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
                textBody: `${t('chat.chatroom.failedToSendProject')}`,
              });
            }
          }
        );
      });
    }
  };


  const handleSendWorkData = () => {
    try {
      if (isWorkData && workData) {
        console.log('sending updated work data', workData)
        if (!chat?.conversation?._id || !currentUserId) return;

        const tempId = `temp_${Date.now()}`;

        // ✅ CACHE THE WORK DATA IMMEDIATELY (so it never needs to fetch)
        queryClient.setQueryData(
          publicWorkKeys.detail(workData),
          workData // You already have the full work object here!
        );

        const optimisticMessage: OptimisticMessage = {
          tempId: tempId,
          createdAt: getOptimisticTimestamp(),
          conversation: chat.conversation._id,
          sender: currentUserId,
          message: '',
          isUnSend: false,
          work: workData,
          messageType: 'WORK',
          status: 'SENT',
          pending: true,
        };

        setMessages(prev => [...prev, optimisticMessage as Message]);

        SocketService.sendMessage(
          {
            conversationId: chat.conversation._id,
            tempId,
            message: optimisticMessage.message,
            work: workData,
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
                textBody: `${t('chat.chatroom.failedToSendProject')} ${workData?.workTitle || workData}`,
              });
            }
          }
        );

      }
    } catch (err) {
      console.log('handleSendWorkData error', err);
    }
  };


  // SEND MEDIA FUCNTION 
  const sendMediaMessage = async (mediaFiles: MediaFile[], textMessage: string) => {
    if (!chat?.conversation?._id || !currentUserId) return;
    setIsFileSending(true);
    // Build file metadata for presigned URL request
    const fileMeta = mediaFiles.map(f => ({
      name: f.name || `file_${Date.now()}`,
      type: f.mimeType || 'application/octet-stream',
      size: f.size,
    }));

    // Validate sizes before requesting presigned URLs
    const oversized = mediaFiles
      .map((f, idx) => ({ f, idx }))
      .filter(({ f }) => {
        const isVideo = f.type === 'video' || f.mimeType?.startsWith('video/');
        const size = f.size || 0;
        // console.log('File blob size:', size);
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
      createdAt: getOptimisticTimestamp(),
      conversation: chat.conversation._id,
      sender: currentUserId,
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
      // Upload in small batches to reduce peak memory/network usage
      const concurrency = 3;
      for (let i = 0; i < presigned.length; i += concurrency) {
        const batch = presigned.slice(i, i + concurrency);
        await Promise.all(batch.map((p, idx) =>
          uploadFileToUrl(p.url, mediaFiles[i + idx].uri, p.contentType || fileMeta[i + idx].type)
        ));
      }
      setIsFileSending(false);
    } catch (err) {
      console.log('File upload failed', err);
      // Alert.alert('Upload failed', 'One or more file uploads failed.');
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
          // Alert.alert('Error', 'Failed to send files');
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
    if (!message.trim() || !chat?.conversation?._id || !currentUserId) return;

    if (isWorkData && workData) {
      handleSendWorkData();
    }
    setWorkData(false);
    setReplyTo(null);
    // Check if we're updating an existing message
    if (updateTo) {
      handleNewUpdateMessage();
      return;
    }
    const tempId = `temp_${Date.now()}`;

    // Optimistic UI
    const optimisticMessage: OptimisticMessage = {
      tempId,
      createdAt: getOptimisticTimestamp(),
      conversation: chat.conversation._id,
      sender: currentUserId,
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
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send via socket
    SocketService.sendMessage(
      {
        conversationId: chat.conversation._id,
        tempId,
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

          Toast.show({
            type: ALERT_TYPE.DANGER,
            title: t('chat.chatroom.error'),
            textBody: t('chat.chatroom.failedToSendMessage'),
          });

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
      typingTimeoutRef.current = setTimeout(() => {
        if (!chat?.conversation?._id) return;
        SocketService.sendTypingIndicator(chat.conversation._id, false);
      }, 3000);

    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      SocketService.sendTypingIndicator(chat.conversation._id, false);
    }
  };

  ;

  const handleCloseMediaPreview = () => {
    setShowMediaPreview(false);
    setSelectedMedia([]);
    setMessage('');
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



  if (isLoadingAuth || !user?._id || isLoading || !chat) {
    return <MessagelistSkeleton />;

  }

  // console.log('all nedia:', allMedia);
  const displayMessages = (messages && messages.length > 0)
    ? messages
    : (chat?.conversationMessages || []);

  return (
    <ScreenWrapper safeEdges={['bottom']} style={{ flex: 1 }}>
      <View className="flex-1" onStartShouldSetResponderCapture={handleScreenTouchCapture}>
        {/* Header */}
        <View className="flex-row pt-12 justify-between items-center px-4 py-3  bg-primary">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <MaterialIcons name="chevron-left" size={32} color="#E5E7EB" />
          </TouchableOpacity>

          <Pressable className='flex-row items-center gap-2'
            disabled={chat.userProfile.businessType === 'AOSER_ADMIN'}
            onPress={() => {
              if (chat.userProfile.businessType === 'CUSTOMER') {
                navigation.navigate('CustomerProfile', { userId: chat.userProfile._id })
              } else if ((chat.userProfile.businessType === 'FREELANCER')) {
                navigation.navigate('AuthFreelancerProfile', { userId: chat.userProfile._id })
              }
            }}>



            <View className="">
              <Text className="text-body text-surface font-bold">
                {chat.userProfile.firstName} {chat.userProfile.lastName || ''}
              </Text>
              {typingUsers.length > 0 && (
                <Text className="text-sm text-surface text-right">{t('chat.chatroom.typing')}</Text>
              )}
              {/* <Text className="text-sm text-primary">{t('chat.chatroom.typing')}</Text> */}
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={{
              flex: 1,
              opacity: chatFadeAnim,

              // paddingBottom: keyboardHeight > 0 ? 20 : 0,
              marginBottom: Platform.OS === 'ios' ? 24 : 20,
            }}
            className={'bg-black/5'}
          >
            <ChatListContainer
              key={chat?.conversation?._id || partnerId}
              messages={displayMessages}
              onUpdateMessages={handleUpdateMessage}
              onCopyMessage={handleCopyMessage}
              onReplyToMessage={handleReplyToMessage}
              onAIResponse={handleAIResponse}
              keyboardHeight={keyboardHeight}
              flatListRef={flatListRef}
              onFetchPage={fetchMessagesPage}
              pageSize={20}

            />
          </Animated.View>
        </KeyboardAvoidingView>

        {/* =====================
          This is popup choose time for send location 
          ========================= */}

        <Modal
          transparent={true}
          visible={showDurationModal}
          animationType="fade"
          onRequestClose={() => setShowDurationModal(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 justify-center items-center"
            onPress={() => setShowDurationModal(false)}
          >
            <Pressable
              className="bg-surface rounded-xl p-5 w-[80%] max-w-[400px]"
              onPress={(e) => e.stopPropagation()}
            >
              <Text className="text-subheading text-text mb-2 text-center">
                <Ionicons
                  name="location-outline"
                  size={24}
                  color='#EF4444'
                />
                {t('chat.chatroom.shareLocation') || 'Share location'}
              </Text>
              {/* <Text className="text-body text-textSecondary mb-5 text-center">
                  {t('chat.chatroom.chooseDuration') || 'How long should this location be shared?'}
                </Text> */}

              <TouchableOpacity
                className="p-4 mt-4 rounded-lg bg-primary mb-2.5 items-center active:opacity-70"
                onPress={() => handleDurationSelect()}
              >
                <Text className="text-body text-surface font-medium">{t('chat.chatroom.send')}</Text>
              </TouchableOpacity>

              {/* <TouchableOpacity
                  className="p-4 rounded-lg bg-background mb-2.5 items-center active:opacity-70"
                  onPress={() => handleDurationSelect(60)}
                >
                  <Text className="text-body text-text font-medium">60 {t('common.min')}</Text>
                </TouchableOpacity> */}
              {/* 
                <TouchableOpacity
                  className="p-4 rounded-lg bg-background mb-2.5 items-center active:opacity-70"
                  onPress={() => handleDurationSelect(8 * 60)}
                >
                  <Text className="text-body text-text font-medium">8 {t('common.hour')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="p-4 rounded-lg bg-background mb-2.5 items-center active:opacity-70"
                  onPress={() => handleDurationSelect(24 * 60)}
                >
                  <Text className="text-body text-text font-medium">24 {t('common.hour')}</Text>
                </TouchableOpacity> */}

              <TouchableOpacity
                className="p-4 rounded-lg bg-transparent border border-border items-center active:opacity-70"
                onPress={() => setShowDurationModal(false)}
              >
                <Text className="text-body text-textSecondary ">
                  {t('common.cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {fileOptionsVisible && (
          <Pressable
            style={[StyleSheet.absoluteFill, { zIndex: 40, elevation: 40 }]}
            onPressIn={() => setFileOptionsVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close file options"
          />
        )}

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
          className="px-4 py-4 bg-surface "
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
              {/* Reply label */}
              <Text className='text-xs font-semibold text-gray-500 mb-1'>
                {t('chat.chatroom.replyingTo')}
              </Text>
              <View className='flex-row items-start justify-between'>
                <View className='flex-1 mr-2'>
                  {replyTo.messageType === 'WORK' && (

                    <>
                      <View>

                        <View className="flex-row items-center">
                          <View className="bg-blue-300 rounded-full p-2 mr-2">
                            <Ionicons name="document-text" size={16} color="white" />
                          </View>
                          <Text className="text-primary font-bold text-sm">
                            {replyTo?.work?.workTitle}
                          </Text>
                        </View>
                        <View>
                          <Text numberOfLines={1}>{replyTo?.work?.description}</Text>
                        </View>
                        <View className="flex-row mt-1 gap-2">
                          <Text className="text-primary font-bold">
                            {new Intl.NumberFormat().format(replyTo?.work?.budget as number)}

                          </Text>
                          <Text className="text-warning font-bold">{replyTo?.work?.currency}</Text>
                        </View>
                      </View>

                    </>
                  )}

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
          {isWorkData && workData && (
            <View className='mx-4 mb-2 p-3 rounded-lg bg-border border-l-4 border-blue-500'>
              {/* Reply label */}
              <Text className='text-xs font-semibold text-gray-500 mb-1'>
                {t('chat.chatroom.replyingTo')}
              </Text>
              <View className='flex-row items-start justify-between'>
                <View>

                  <View className="flex-row items-center">
                    <View className="bg-blue-300 rounded-full p-2 mr-2">
                      <Ionicons name="document-text" size={16} color="white" />
                    </View>
                    <Text className="text-primary font-bold text-sm">
                      {workData?.workTitle}
                    </Text>
                  </View>

                  <View>
                    <Text numberOfLines={1}>{workData?.description}</Text>
                  </View>
                  <View className="flex-row mt-1 gap-2">
                    <Text className="text-primary font-bold">
                      {new Intl.NumberFormat().format(workData?.budget as number)}
                    </Text>
                    <Text className="text-warning font-bold">{workData?.currency}</Text>
                  </View>
                </View>

                {/* Close button */}
                <Pressable
                  onPress={() => setWorkData(false)}
                  className='p-1 rounded-full bg-gray-200 active:bg-gray-300'
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color="#6B7280" />
                </Pressable>
              </View>
            </View>
          )}
          <View className="flex-row items-end">
            <Pressable
              onPress={handleShowOptions}
              className={`mr-3 mb-2 w-10 h-10 rounded-full items-center justify-center border ${fileOptionsVisible ? 'bg-primary border-primary' : 'border-gray-300'
                }`}
            >
              {/* <Text
                  className={`text-body font-bold ${fileOptionsVisible ? 'text-white' : 'text-primary'
                    }`}
                >
                  +
                </Text> */}
              <Ionicons name='add-outline' size={24} color={fileOptionsVisible ? '#fff' : '#3B82F6'} />
            </Pressable>


            <TextInput
              ref={textInputRef}
              className="flex-1 bg-background px-4  rounded-2xl text-body text-text"
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
                minHeight: 53,
                maxHeight: 120,
                lineHeight: 20,
                paddingTop: Platform.OS === 'ios' ? 12 : 12,
                paddingBottom: Platform.OS === 'ios' ? 12 : 12,
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
          userProfileId={chat.userProfile._id}
          onClose={() => setShowProjectSelection(false)}
          onProjectsSelect={sendProjectMessage}
          user={user}

        />

      </View>
    </ScreenWrapper>
  );
};

export default RoomChat;
