// services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { Job, Message } from 'types';
interface SendMessagePayload {
  conversationId: string;
  message: string;
  files?: string[] | string;
  // work can be a single work id or an array when needed
  work?: string | string[] | Job;
  // tempId is used by clients for optimistic message reconciliation
  tempId?: string;
  // optional projectUpdates metadata
  projectUpdates?: any[];
  messageType: 'TEXT' | 'FILE' | 'LINK' | 'WORK' | 'LOCATION';
  location?: { latitude: number; longitude: number };
  mapsUrl?: string;
  replyTo?: string;
  expiresAt?: number;
}
class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;



  connect(serverUrl: string, token?: string | null, userId?: string | null) {
    if (!serverUrl) return null;

    try {
      this.userId = userId || null;

      // Log masked token for debugging
      try {
        const masked = token ? `${token.slice(0, 6)}...${token.slice(-6)}` : 'no-token';
        console.log('[SocketService] connecting', { serverUrl, token: masked, userId });
      } catch (e) {
        console.log('[SocketService] connecting, error logging token');
      }

      this.socket = io(serverUrl, {
        auth: { token: `Aoser ${token}` },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: false,
      });

      this.setupListeners();

      // Explicitly connect
      if (this.socket && typeof this.socket.connect === 'function') {
        this.socket.connect();
      }

      return this.socket;
    } catch (error) {
      console.log('Socket connection error:', error);
      throw error;
    }
  }


  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('error', (error) => {
      console.log('Socket errorss:', error);
    });

    this.socket.io.on("error", (error) => {
      console.log('Transport error:', error);
    });

    this.socket.on('connect_error', (error: any) => {
      console.log('Socket connection error:', error.message);
      // console.log('Full connect_error:', {
      //   message: error.message,
      //   description: error.description,
      //   context: error.context,
      //   type: error.type,
      //   data: error.data
      // });
    });
  }


  joinConversation(conversationId: string) {
    if (this.socket && this.socket.connected) {
      console.log('Joining conversation:', conversationId);
      this.socket.emit('conversation:join', conversationId);
    } else {
      console.warn('Cannot join conversation: socket not connected');
    }
  }

  sendMessage(
    payload: SendMessagePayload,
    ack?: (response: any) => void
  ) {

    if (!this.socket || !this.socket.connected) {
      console.log('Socket not connected');
      if (ack) ack({ ok: false, error: 'not_connected' });
      return;
    }

    try {
      console.log('[SocketService] Sending message:', payload);
      this.socket.emit('message:send', payload, (response: any) => {
        console.log('[SocketService] message:send ack:', response);
        if (ack) ack(response);
      });
    } catch (e) {
      console.log('[SocketService] Failed to send message:', e);
      if (ack) ack({ ok: false, error: 'emit_failed' });
    }
  }


  onMessageReceived(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on('message:send', callback);
    }
  }
  onMessageStatusUpdate(callback: (data: { conversationId: string; status: string }) => void) {
    if (this.socket) {
      this.socket.on('messages:status:update', callback);
    }
  }

  // joinRoom(roomId: string) {
  //   if (this.socket) {
  //     this.socket.emit('join_room', { roomId, userId: this.userId });
  //   }
  // }



  // Listen for typing indicator (matches your backend)

  typingCallback = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
    console.log('Received typing event:');
  }
  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void) {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }
  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    if (this.socket && this.socket.connected) {
      console.log('Emitting typing event:', { conversationId, isTyping });
      this.socket.emit('typing', conversationId, isTyping);
    }
  }
  onNotification(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('notification:send', callback);
    }
  }
  // Listen for unread count updates
  onUnreadCount(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('unread:count', callback);
    }
  }

  emitUnsendMessage(data: any) {
    if (this.socket) {
      this.socket.emit('message:unSendMyMessage', data);
    }
  }
  deleteMessageForme(data: any) {
    if (this.socket) {
      this.socket.emit('message:deleteForMe', data);
    }
  }

  updateMessage({messageId, message} : {messageId: string, message: any}) {
    if (this.socket) {
      this.socket.emit('message:update', messageId, message);
    }
  }
  
  deletChatroom(conversationId:string) {
    if (this.socket) {
      this.socket.emit('conversation:deleteChatRoomAndConversations', conversationId);
    }
  }
  unreadChatCount(totalChatUnread:string) {
    if (this.socket) {
      this.socket.emit('chat:messages:unread:count', totalChatUnread);
    }
  }

  markMessagesAsRead(conversationId: string){
    if(this.socket && this.socket.connected){
      console.log('Emitting typing event:', { conversationId });
      this.socket.emit('message:read', conversationId);
    }else{
      console.warn("Cannot mark message as read: socket not connected");
    }
  }
  // Register a listener for backend payment callback for a specific invoiceId
  onPaymentCallback(invoiceId: string, callback: (data: any) => void) {
    if (!invoiceId) return;
    const event = `paymentCallback:${invoiceId}`;
    console.log("callback in sortket", callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove listener for a specific payment callback event
  removePaymentCallback(invoiceId: string) {
    if (!invoiceId) return;
    const event = `paymentCallback:${invoiceId}`;
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Remove specific listeners
  removeListener(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      console.log('Socket disconnected manually');
    }
  }



  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }

}

export default new SocketService();