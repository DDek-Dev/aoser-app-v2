import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, FlatList, Modal, TouchableOpacity, Alert } from 'react-native'
import ChatItem from './ChatItem'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { FreelancerStackParamList } from 'types/navigation'
import { useChats } from 'hooks/useChat'
import ChatItemSkeleton from 'skeletonScreens/ChatItemSkeleton'
import ScreenWrapper from 'components/ui/ScreenWrapper'
import { useAuth } from 'hooks/useAuth'
import { getOtherParticipant } from 'utils/chatHelpers'
import SocketService from 'service/soctketService'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

const SERVER_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function ChatScreen() {
  const [search, setSearch] = useState('')
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [showOptionsModal, setShowOptionsModal] = useState(false)

  const navigator = useNavigation<NativeStackNavigationProp<FreelancerStackParamList>>()
  const queryClient = useQueryClient()

  const { data: chat, isLoading, refetch } = useChats()
  const { user, tokens, isLoadingAuth } = useAuth()
  const { t } = useTranslation();
  const currentUserId = user?._id;


  // Listen for navigation focus - refetch when returning from chat
  useEffect(() => {
    const unsubscribe = navigator.addListener('focus', () => {
      console.log('ChatScreen focused - refetching chats')
      refetch()
    })

    return unsubscribe
  }, [navigator, refetch])

  // Real-time sorting: most recent message first (updates whenever chat data changes)
  const sortedChats = useMemo(() => {
    if (!chat) return []

    console.log('Sorting chats by most recent message...')

    return [...chat].sort((a, b) => {
      // Pinned chats always on top
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1

      // Sort by updatedAt (most recent first) - this ensures newest messages show at top
      const dateA = new Date(a.updatedAt).getTime()
      const dateB = new Date(b.updatedAt).getTime()

      return dateB - dateA // Descending order: newest first
    })
  }, [chat]) // Re-sorts whenever chat data changes

  const filteredChats = useMemo(() => {
    if (!sortedChats) return []

    if (!search.trim()) return sortedChats

    const searchLower = search.toLowerCase().trim()

    return sortedChats.filter((chat) => {
      const otherParticipant = getOtherParticipant(chat, currentUserId as string)

      const firstName = otherParticipant?.firstName?.toLowerCase() || ''
      const lastName = otherParticipant?.lastName?.toLowerCase() || ''
      const fullName = `${firstName} ${lastName}`.trim()

      const lastMessage = chat.lastMessage?.message?.toLowerCase() || ''

      return (
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        fullName.includes(searchLower) ||
        lastMessage.includes(searchLower)
      )
    })
  }, [sortedChats, search, currentUserId])

  // Socket connection and real-time listeners
  useEffect(() => {
    if (!tokens?.accessToken || !user?._id || !SERVER_URL) return

    try {
      SocketService.connect(SERVER_URL, tokens.accessToken, user._id)
      console.log('Socket connected for chat list')

      // Listen for new messages - updates chat list order
      const handleNewMessage = (message: any) => {
        console.log('New message received in chat list:', message)

        // Optimistically update the chat list and re-sort
        queryClient.setQueryData(['chats'], (oldData: any) => {
          if (!oldData) return oldData

          // Update the chat with new message
          const updatedChats = oldData.map((chat: any) => {
            if (chat._id === message.conversation) {
              return {
                ...chat,
                lastMessage: message,
                updatedAt: message.createdAt || new Date().toISOString(),
                unreadCount: message.sender !== user._id
                  ? (chat.unreadCount || 0) + 1
                  : chat.unreadCount
              }
            }
            return chat
          })

          // Re-sort to move chat with new message to top
          return updatedChats.sort((a: any, b: any) => {
            // Pinned chats always on top
            if (a.pinned && !b.pinned) return -1
            if (!a.pinned && b.pinned) return 1

            // Sort by updatedAt (most recent first)
            const dateA = new Date(a.updatedAt).getTime()
            const dateB = new Date(b.updatedAt).getTime()
            return dateB - dateA
          })
        })

        // Refetch to ensure data consistency
        setTimeout(() => refetch(), 500)
      }

      // Listen for message status updates
      const handleMessageStatusUpdate = (data: any) => {
        console.log('Message status updated:', data)

        // Update chat list to reflect read status
        queryClient.setQueryData(['chats'], (oldData: any) => {
          if (!oldData) return oldData

          return oldData.map((chat: any) => {
            if (chat._id === data.conversationId && data.status === 'READ') {
              return {
                ...chat,
                unreadCount: 0, // Reset unread count when messages are read
                lastMessage: chat.lastMessage ? {
                  ...chat.lastMessage,
                  status: 'READ'
                } : null
              }
            }
            return chat
          })
        })

        refetch()
      }

      // Listen for unread count updates
      const handleUnreadCount = (data: any) => {
        console.log('Unread count updated:', data)
        queryClient.invalidateQueries({ queryKey: ['chats'] })
        refetch()
      }

      // Register listeners
      SocketService.onMessageReceived(handleNewMessage)
      SocketService.onMessageStatusUpdate(handleMessageStatusUpdate)
      SocketService.onUnreadCount(handleUnreadCount)

      return () => {
        SocketService.removeListener('message:send')
        SocketService.removeListener('messages:status:update')
        SocketService.removeListener('unread:count')
      }
    } catch (error) {
      console.log('Socket connection error:', error)
    }
  }, [tokens?.accessToken, user?._id, refetch, queryClient])

  // Handle chat press - mark as read and navigate
  const handleChatPress = (chatId: string, otherParticipantId: string) => {
    // Mark messages as read via socket
    SocketService.markMessagesAsRead(chatId)

    // Optimistically update unread count and updatedAt in UI
    queryClient.setQueryData(['chats'], (oldData: any) => {
      if (!oldData) return oldData

      const updatedChats = oldData.map((chat: any) => {
        if (chat._id === chatId) {
          return {
            ...chat,
            unreadCount: 0,
            updatedAt: new Date().toISOString() // Update timestamp when opening chat
          }
        }
        return chat
      })

      // Re-sort to move opened chat to top
      return updatedChats.sort((a: any, b: any) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        const dateA = new Date(a.updatedAt).getTime()
        const dateB = new Date(b.updatedAt).getTime()
        return dateB - dateA
      })
    })

    // Navigate to chat room
    navigator.navigate('RoomChat', { userId: otherParticipantId })
  }

  // Handle long press on chat item
  const handleLongPress = (chatId: string) => {
    setSelectedChatId(chatId)
    setShowOptionsModal(true)
  }

  // Handle delete chat
  const handleDelete = async () => {
    if (!selectedChatId) return

    try {
      Alert.alert(
        t('chat.list.deleteChatTitle'),
        t('chat.list.deleteChatMessage'),
        [
          {
            text: t('chat.list.cancel'),
            style: 'cancel',
            onPress: () => {
              setShowOptionsModal(false)
              setSelectedChatId(null)
            }
          },
          {
            text: t('chat.list.deleteChat'),
            style: 'destructive',
            onPress: async () => {
              setShowOptionsModal(false)

              // Optimistically remove from UI
              queryClient.setQueryData(['chats'], (oldData: any) => {
                if (!oldData) return oldData
                return oldData.filter((chat: any) => chat._id !== selectedChatId)
              })

              // Send delete request via socket
              try {
                SocketService.deletChatroom(selectedChatId)
                console.log('Delete chat request sent:', selectedChatId)

                setTimeout(() => {
                  refetch()
                }, 1000)
              } catch (error) {
                console.log('Error deleting chat:', error)
                Alert.alert(t('chat.chatroom.error'), t('chat.list.deleteError'))
                refetch()
              }

              setSelectedChatId(null)
            },
          },
        ]
      )
    } catch (error) {
      console.log('Error in delete handler:', error)
      Alert.alert(t('chat.chatroom.error'), t('chat.list.deleteError'))
    }
  }

  // Show loading skeleton
  if (isLoading || !user || isLoadingAuth) {
    return (
      <View className="flex-1 bg-surface">
        <View className="bg-white pt-12 pb-4 px-4 rounded-b-2xl">
          <View className='flex-row items-center mb-3'>
            <MaterialIcons name='chevron-left' size={28} color='#3B82F6' onPress={() => navigator.goBack()} />
            <Text className="text-primary text-heading ">{t('chat.list.title')}</Text>
          </View>
          <View className="flex-row items-center bg-white rounded-full border border-gray-300 px-4 mb-1">
            <Ionicons name="search-outline" size={20} color="#333" />
            <View className="ml-2 text-base text-gray-600 flex-1 py-4">
              <Text className="text-gray-400">{t('chat.list.searchPlaceholder')}</Text>
            </View>
          </View>
        </View>
        <FlatList
          data={Array(9).fill(0)}
          keyExtractor={(_, i) => `skeleton-${i}`}
          renderItem={() => <ChatItemSkeleton />}
        />
      </View>
    )
  }

  // Show empty state
  if (!chat || chat.length === 0) {
    return (
      <View className="flex-1 bg-surface">
        <View className="bg-white pt-12 pb-4 px-4 rounded-b-2xl">
          <View className='flex-row items-center mb-3'>
            <MaterialIcons name='chevron-left' size={28} color='#3B82F6' onPress={() => navigator.goBack()} />
            <Text className="text-primary text-heading ">{t('chat.list.title')}</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
          <Text className="text-gray-500 text-lg mt-4 text-center">
            {t('chat.list.noChatsYet')}
          </Text>
          <Text className="text-gray-400 text-sm mt-2 text-center">
            {t('chat.list.startConversation')}
          </Text>
        </View>
      </View>
    )
  }



  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="bg-white pt-12 pb-4 px-4 rounded-b-2xl">
        <View className='flex-row items-center mb-3'>
          <MaterialIcons name='chevron-left' size={28} color='#3B82F6' onPress={() => navigator.goBack()} />
          <Text className="text-primary text-heading ">{t('chat.list.title')}</Text>
        </View>
        <View className='flex-row '>


          <View className='flex-1'>
            <View className="flex-row items-center bg-white rounded-full border border-gray-300 px-4 mb-1">
              <Ionicons name="search-outline" size={20} color="#333" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                className="ml-2 text-base text-gray-600 flex-1 py-4"
                placeholder={t('chat.list.searchPlaceholder')}
                placeholderTextColor="#999"
                returnKeyType="search"
              />
            </View>
          </View>
        </View>
      </View>

      <ScreenWrapper safeEdges={['bottom']}>
        {filteredChats.length === 0 ? (
          <View className="flex-1 justify-start mt-12 items-center px-8">
            <Ionicons name="search-outline" size={80} color="#ccc" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              {t('chat.list.noChatsFound')}
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
              {t('chat.list.tryDifferentKeywords')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => {
              const otherParticipant = item.participants.find(p => p._id !== currentUserId) || item.participants[0]
              if (!item._id || !otherParticipant || item._id === undefined) return null;


              return (
                <ChatItem
                  _id={item._id}
                  participants={otherParticipant}
                  createdAt={item.createdAt}
                  updatedAt={item.updatedAt}
                  lastMessage={item.lastMessage}
                  unreadCount={item.unreadCount}
                  pinned={item.pinned}
                  online={item.online}
                  unread={item.unread}
                  onPress={() => handleChatPress(item._id, otherParticipant._id)}
                  onLongPress={() => handleLongPress(item._id)}
                />
              )
            }}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </ScreenWrapper>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowOptionsModal(false)
          setSelectedChatId(null)
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => {
            setShowOptionsModal(false)
            setSelectedChatId(null)
          }}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              width: '80%',
              maxWidth: 300,
              overflow: 'hidden',
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
              <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                {t('chat.list.chatOptions')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDelete}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
              }}
            >
              <Ionicons
                name="trash-outline"
                size={24}
                color="#ef4444"
                style={{ marginRight: 12 }}
              />
              <Text style={{ fontSize: 16, color: '#ef4444' }}>
                {t('chat.list.deleteChat')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setShowOptionsModal(false)
                setSelectedChatId(null)
              }}
              style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: '#eee',
                backgroundColor: '#f9f9f9',
              }}
            >
              <Text style={{ fontSize: 16, textAlign: 'center', color: '#666' }}>
                {t('chat.list.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}