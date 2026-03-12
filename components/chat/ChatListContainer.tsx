import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useAuth } from 'hooks/useAuth';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  StatusBar,
  SafeAreaView,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message } from 'types';
import ChatMessageItem from './ChatMessageItem';
import { useTranslation } from 'react-i18next';

interface ChatListContainerProps {
  messages: Message[];

  onUpdateMessages: (messages: Message) => void;
  onCopyMessage?: (message: string) => void;
  onReplyToMessage?: (message: Message) => void;
  onAIResponse?: (message: Message) => void;
  keyboardHeight?: number;
  flatListRef?: React.RefObject<FlatList<any> | null>;
  contentContainerStyle?: any;
  onFetchPage?: (skip: number, limit: number) => Promise<Message[]>;
  pageSize?: number;
}

const ChatListContainer: React.FC<ChatListContainerProps> = ({
  messages,
  onUpdateMessages,
  onCopyMessage,
  onReplyToMessage,
  onAIResponse,
  keyboardHeight = 0,
  flatListRef,
  contentContainerStyle,
  onFetchPage,
  pageSize: propPageSize,
}) => {
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const internalFlatListRef = useRef<FlatList>(null);
  const finalFlatListRef = flatListRef || internalFlatListRef;

  // internal pagination state
  const [internalMessages, setInternalMessages] = useState<Message[] | null>(null);
  const [skip, setSkip] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = propPageSize || 20;

  const { user } = useAuth();
  const currentUserId = user?._id;

  // Control refs for auto-scroll behavior
  const initialLoadedRef = useRef(false);
  const isAtBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);
  const isLoadingMoreRef = useRef(false);

  // Decide which message source to use
  const sourceMessages = internalMessages !== null ? internalMessages : messages;

  const getMessageId = (m: any): string | null => {
    const id = m?._id || m?.tempId || m?.id;
    return id ? String(id) : null;
  };

  const getReplyId = (replyTo: any): string => {
    if (!replyTo) return '';
    if (typeof replyTo === 'string') return replyTo;
    return String(replyTo?._id || '');
  };

  const isSameOptimisticMessage = (existing: any, incoming: any): boolean => {
    if (!existing?.pending) return false;
    if (!incoming) return false;
    if (String(existing?.sender || '') !== String(incoming?.sender || '')) return false;
    if (String(existing?.messageType || '') !== String(incoming?.messageType || '')) return false;
    if (String(existing?.message || '') !== String(incoming?.message || '')) return false;
    if (getReplyId(existing?.replyTo) !== getReplyId(incoming?.replyTo)) return false;

    const existingFiles = Array.isArray(existing?.files) ? existing.files.length : 0;
    const incomingFiles = Array.isArray(incoming?.files) ? incoming.files.length : 0;
    if (existingFiles !== incomingFiles) return false;

    const existingWorkId = existing?.work?._id || existing?.work;
    const incomingWorkId = incoming?.work?._id || incoming?.work;
    if (String(existingWorkId || '') !== String(incomingWorkId || '')) return false;

    const existingOfferingId = existing?.offeringWorkId?._id || existing?.offeringWorkId;
    const incomingOfferingId = incoming?.offeringWorkId?._id || incoming?.offeringWorkId;
    if (String(existingOfferingId || '') !== String(incomingOfferingId || '')) return false;

    return true;
  };

  const getMessageSortTime = (m: any): number => {
    if (m?.createdAt) {
      const timestamp = new Date(m.createdAt).getTime();
      if (!Number.isNaN(timestamp)) return timestamp;
    }
    const tempId = String(m?.tempId || '');
    const match = tempId.match(/temp_(\d+)/);
    if (match?.[1]) return Number(match[1]);
    return 0;
  };

  // Memoize sorted messages (newest-first for inverted list)
  const sortedMessages = useMemo(() => {
    const list = [...(sourceMessages || [])].sort(
      (a, b) => getMessageSortTime(b) - getMessageSortTime(a)
    );
    const seen = new Set<string>();
    const out: Message[] = [];
    list.forEach((m, idx) => {
      const anyM: any = m as any;
      const key = anyM._id || anyM.tempId || anyM.id || `${anyM.createdAt || ''}-${anyM.sender || ''}-${idx}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(m);
      }
    });
    return out;
  }, [sourceMessages]);

  const { t } = useTranslation();
  // Smart auto-scroll logic
  useEffect(() => {
    const currentLength = sortedMessages.length;
    const prevLength = prevMessagesLengthRef.current;

    // Case 1: Initial load - scroll to bottom once
    if (!initialLoadedRef.current && currentLength > 0) {
      initialLoadedRef.current = true;
      const timeout = setTimeout(() => {
        try {
          finalFlatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        } catch {
          // try {
          //   finalFlatListRef.current?.scrollToEnd({ animated: false });
          // } catch {}
        }
      }, 100);
      prevMessagesLengthRef.current = currentLength;
      return () => clearTimeout(timeout);
    }

    // Case 2: Loading more old messages - don't scroll
    if (isLoadingMoreRef.current) {
      prevMessagesLengthRef.current = currentLength;
      return;
    }

    // Case 3: No new messages - do nothing
    if (currentLength === prevLength) {
      return;
    }

    // Case 4: New message added
    if (currentLength > prevLength) {
      const newestMessage = sortedMessages[0] as any; // newest message is first in array
      const senderId = newestMessage?.sender;

      const shouldStickToBottom = isAtBottomRef.current;
      const isSelfMessage = senderId && currentUserId && String(senderId) === String(currentUserId);

      // Only auto-scroll for self message, or if user is already at bottom.
      if (isSelfMessage || shouldStickToBottom) {
        const timeout = setTimeout(() => {
          try {
            finalFlatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          } catch {
            // try {
            //   finalFlatListRef.current?.scrollToEnd({ animated: true });
            // } catch {}
          }
        }, 100);
        prevMessagesLengthRef.current = currentLength;
        return () => clearTimeout(timeout);
      }

      // If user is reading older messages, don't auto-scroll
      prevMessagesLengthRef.current = currentLength;
      return;
    }

    // Update previous length
    prevMessagesLengthRef.current = currentLength;
  }, [sortedMessages, currentUserId]);

  // Load initial page if onFetchPage is provided
  useEffect(() => {
    if (typeof onFetchPage !== 'function') return;
    let mounted = true;
    (async () => {
      try {
        setIsLoadingMore(true);
        isLoadingMoreRef.current = true;
        const first = await onFetchPage(0, pageSize);
        if (!mounted) return;
        setInternalMessages(first || []);
        setSkip((first || []).length || 0);
        setHasMore((first || []).length >= pageSize);
      } catch (e) {
        console.warn('ChatListContainer initial page load failed', e);
      } finally {
        if (mounted) {
          setIsLoadingMore(false);
          isLoadingMoreRef.current = false;
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [onFetchPage, pageSize]);

  // Merge live external messages into internalMessages
  useEffect(() => {
    try {
      setInternalMessages(prev => {
        if (prev === null) return prev;
        const next = [...prev];
        let changed = false;

        const indexById = new Map<string, number>();
        next.forEach((m, idx) => {
          const id = getMessageId(m);
          if (id) indexById.set(id, idx);
        });

        for (const incoming of messages || []) {
          const incomingId = getMessageId(incoming);

          if (incomingId && indexById.has(incomingId)) {
            const existingIdx = indexById.get(incomingId)!;
            if (next[existingIdx] !== incoming) {
              next[existingIdx] = incoming;
              changed = true;
            }
            continue;
          }

          const optimisticIdx = next.findIndex(m => isSameOptimisticMessage(m as any, incoming as any));
          if (optimisticIdx !== -1) {
            const oldId = getMessageId(next[optimisticIdx]);
            next[optimisticIdx] = incoming;
            changed = true;
            if (oldId) indexById.delete(oldId);
            if (incomingId) indexById.set(incomingId, optimisticIdx);
            continue;
          }

          next.unshift(incoming);
          changed = true;
          indexById.clear();
          next.forEach((m, idx) => {
            const id = getMessageId(m);
            if (id) indexById.set(id, idx);
          });
        }

        return changed ? next : prev;
      });
    } catch (e) {
      // ignore merge errors
    }
  }, [messages]);


  // Keyboard handling - only scroll if user is at bottom
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          try {
            finalFlatListRef.current?.scrollToOffset({ offset: 0, animated: true });
          } catch {
            // ignore
          }
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Load more older messages
  const handleLoadMore = async () => {
    if (typeof onFetchPage !== 'function' || internalMessages === null) return;
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      isLoadingMoreRef.current = true;
      const next = await onFetchPage(skip, pageSize);
      if (next && next.length > 0) {
        setInternalMessages(prev => [...(prev || []), ...(next || [])]);
        setSkip(prev => prev + next.length);
        if (next.length < pageSize) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (e) {
      console.warn('ChatListContainer load more failed', e);
    } finally {
      setIsLoadingMore(false);
      // Add a small delay before allowing auto-scroll again
      setTimeout(() => {
        isLoadingMoreRef.current = false;
      }, 500);
    }
  };

  const handleEnterDeleteMode = useCallback(() => {
    setIsDeleteMode(true);
  }, []);

  const handleExitDeleteMode = useCallback(() => {
    setIsDeleteMode(false);
    setSelectedMessages(new Set());
  }, []);

  const handleToggleSelect = useCallback((messageId: string) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedMessages.size === messages.length) {
      setSelectedMessages(new Set());
    } else {
      const getId = (m: any) => m._id || m.id || '';
      setSelectedMessages(new Set(messages.map(msg => getId(msg))));
    }
  }, [messages, selectedMessages.size]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedMessages.size === 0) return;

    Alert.alert(
      t('chat.chatContainer.Delete_Messages'),
      t('chat.chatContainer.are_you_sure'),

      // `Are you sure you want to delete ${selectedMessages.size} message${selectedMessages.size > 1 ? 's' : ''}?`,
      [
        { text: t('chat.list.cancel'), style: 'cancel' },
        {
          text: t('chat.chatContainer.delete'),
          style: 'destructive',
          onPress: () => {
            const getId = (m: any) => m._id || m.id || '';
            const updatedMessages = messages.filter(msg => !selectedMessages.has(getId(msg)));
            // onUpdateMessages(updatedMessages);
            handleExitDeleteMode();
          },
        },
      ]
    );
  }, [selectedMessages, messages, onUpdateMessages, handleExitDeleteMode]);



  const renderDeleteModeHeader = () => {
    if (!isDeleteMode) return null;

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#f3f4f6',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleExitDeleteMode}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151' }}>
            {selectedMessages.size} selected
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={handleSelectAll}
            style={{ marginRight: 16 }}
          >
            <Text style={{ fontSize: 16, color: '#3b82f6', fontWeight: '500' }}>
              {selectedMessages.size === messages.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteSelected}
            disabled={selectedMessages.size === 0}
            style={{
              backgroundColor: selectedMessages.size > 0 ? '#ef4444' : '#d1d5db',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color="white"
              style={{ marginRight: 4 }}
            />
            <Text style={{ color: 'white', fontWeight: '500' }}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const normalized = {
      ...item,
      _id: (item as any)._id || (item as any).tempId || (item as any).id
    } as any;

    return (
      <ChatMessageItem
        item={normalized}

        onUpdateMessage={onUpdateMessages}
        onCopyMessage={onCopyMessage}
        onReplyToMessage={onReplyToMessage}
        onAIResponse={onAIResponse}
        // onDeleteMessage={handleSingleMessageDelete}
        isDeleteMode={isDeleteMode}
        onToggleSelect={handleToggleSelect}
        onEnterDeleteMode={handleEnterDeleteMode}
      />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'f3f4f6' }}>
      <StatusBar
        barStyle={isDeleteMode ? 'dark-content' : 'default'}
        backgroundColor={isDeleteMode ? '#f3f4f6' : 'white'}
      />

      {renderDeleteModeHeader()}

      <FlatList
        ref={finalFlatListRef}
        data={sortedMessages}
        keyExtractor={(item, index) => {
          const anyItem: any = item as any;
          return anyItem._id || anyItem.tempId || anyItem.id || `${anyItem.createdAt || ''}-${anyItem.sender || ''}-${index}`;
        }}
        contentContainerStyle={contentContainerStyle || {
          paddingHorizontal: 6,
          paddingBottom: 20,
          // For inverted list, top padding renders near the input side.
          // Keep this stable; using keyboardHeight here creates a large gap.
          paddingTop: 80,
        }}
        renderItem={renderMessage}
        showsVerticalScrollIndicator={false}
        onScroll={({ nativeEvent }) => {
          try {
            const { contentOffset } = nativeEvent as any;
            // In inverted lists, offset ~0 means user is at latest messages (bottom of chat UI).
            isAtBottomRef.current = (contentOffset?.y || 0) <= 80;
          } catch (e) {
            // ignore
          }
        }}
        scrollEventThrottle={16}
        inverted={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        removeClippedSubviews={true}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

export default ChatListContainer;
