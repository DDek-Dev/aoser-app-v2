import { useQuery } from '@tanstack/react-query';
import { chatApi } from 'api/chatApi';
import { useAuth } from './useAuth';

export const useChats = (options?: { enabled?: boolean }) => {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: ['chats'],
    queryFn: () => chatApi.getChat_users(tokens?.accessToken || ''),
    enabled: (options?.enabled ?? true) && !!tokens?.accessToken,
  });
};

export const useChatRoom = (userId: string) => {
  const { tokens } = useAuth();
  return useQuery({
    queryKey: ['chatRoom', userId],
    queryFn: () => chatApi.getChatroom(tokens?.accessToken || '', userId),
    enabled: !!userId && !!tokens?.accessToken,
  });
};
export const useUnreadChats = () => {
  return useQuery({
    queryKey: ['chats', 'unread'],
    // queryFn: chatService.getUnread,
  });
};
export const useUnreadChatCount = (userId: string) => {
  const { tokens } = useAuth();

  return useQuery({
    queryKey: ['unreadchatCount' ,userId],
    queryFn: ()=> chatApi.getUnreadChatcount(tokens?.accessToken || ''),
    enabled: !!tokens?.accessToken && !!userId,
  });
};

export const useOnlineChats = () => {
  return useQuery({
    queryKey: ['chats', 'online'],
    // queryFn: chatService.getOnline,
  });
};

export const usePinnedChats = () => {
  return useQuery({
    queryKey: ['chats', 'pinned'],
    // queryFn: chatService.getPinned,
  });
};


