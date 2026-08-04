// services/socketService.ts
import { io, Socket } from 'socket.io-client';
import { Job, Message, NewOfferData } from 'types';
interface SendMessagePayload {
  conversationId: string;
  message?: string;
  files?: string[] | string;
  // work can be a single work id or an array when needed
  work?: string | string[] | Job;
  // tempId is used by clients for optimistic message reconciliation
  tempId?: string;
  // optional projectUpdates metadata
  projectUpdates?: any[];
  messageType?: 'TEXT' | 'FILE' | 'LINK' | 'WORK' | 'LOCATION' | "OFFERING_WORK";
  offeringWorkId?: string;
  location?: { latitude: number; longitude: number };
  mapsUrl?: string;
  replyTo?: string;
  expiresAt?: number;
}
interface SendMessagePayloadOffering {
  conversationId: string;
  message: string;
  files?: string[] | string;
  offeringWorkId?: string | string[];
  requestStatus: "PENDING" | "CONFIRM" | "REJECTED"
}
class SocketService {
  private socket: Socket | null = null;
   private userId: string | null = null;
  private serverUrl: string | null = null;
  private token: string | null = null;
  private connectionStatusCallback: ((connected: boolean) => void) | null = null;



  // connect(serverUrl: string, token?: string | null, userId?: string | null) {
  //   if (!serverUrl) return null;

  //   try {
  //     this.userId = userId || null;

  //     // Log masked token for debugging
  //     try {
  //       const masked = token ? `${token.slice(0, 6)}...${token.slice(-6)}` : 'no-token';
  //       console.log('[SocketService] connecting', { serverUrl, token: masked, userId });
  //     } catch (e) {
  //       console.log('[SocketService] connecting, error logging token');
  //     }

  //     this.socket = io(serverUrl, {
  //       auth: { token: `Aoser ${token}` },
  //       transports: ['websocket'],
  //       reconnection: true,
  //       reconnectionAttempts: 10,
  //       reconnectionDelay: 1000,
  //       autoConnect: false,
  //     });

  //     this.setupListeners();

  //     if (this.socket && !this.socket.connected) {
  //       this.socket.disconnect();
  //       this.socket = null;
  //     }
  //     // Explicitly connect
  //     if (this.socket && typeof this.socket.connect === 'function') {
  //       this.socket.connect();
  //     }

  //     return this.socket;
  //   } catch (error) {
  //     console.log('Socket connection error:', error);
  //     throw error;
  //   }
  // }

connect(serverUrl: string, token?: string | null, userId?: string | null) {
    if (!serverUrl) return null;

    try {
      // ✅ If already connected with same credentials, reuse the connection
      if (this.socket?.connected &&
          this.serverUrl === serverUrl &&
          this.userId === userId) {
        console.log('[SocketService] Already connected, reusing socket');
        return this.socket;
      }

      // ✅ If socket exists but disconnected, clean it up first
      if (this.socket) {
        console.log('[SocketService] Cleaning up old socket before reconnecting');
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.socket = null;
      }

      // Store credentials for reconnection
      this.userId = userId || null;
      this.serverUrl = serverUrl;
      this.token = token || null;

      const masked = token ? `${token.slice(0, 6)}...${token.slice(-6)}` : 'no-token';
      console.log('[SocketService] connecting', { serverUrl, token: masked, userId });

      // ✅ Create socket — let socket.io handle reconnection automatically
      this.socket = io(serverUrl, {
        auth: { token: `Aoser ${token}` },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        // ✅ Remove autoConnect: false — let it connect immediately
      });

      this.setupListeners();

      return this.socket;
    } catch (error) {
      console.log('[SocketService] Socket connection error:', error);
      throw error;
    }
  }
 // ✅ Add reconnect method for when app returns to foreground
  reconnect() {
    if (!this.serverUrl || !this.token || !this.userId) {
      console.log('[SocketService] Cannot reconnect — missing credentials');
      return null;
    }

    console.log('[SocketService] Reconnecting...');
    return this.connect(this.serverUrl, this.token, this.userId);
  }

  // private setupListeners() {
  //   if (!this.socket) return;

  //   this.socket.on('connect', () => {
  //     console.log('✅ Socket connected:', this.socket?.id);
  //   });

  //   this.socket.on('disconnect', (reason) => {
  //     console.log('❌ Socket disconnected:', reason);
  //   });

  //   this.socket.on('error', (error) => {
  //     console.log('Socket errorss:', error);
  //   });

  //   this.socket.io.on("error", (error) => {
  //     console.log('Transport error:', error);
  //   });

  //   this.socket.on('connect_error', (error: any) => {
  //     console.log('Socket connection error:', error.message);
  //     // console.log('Full connect_error:', {
  //     //   message: error.message,
  //     //   description: error.description,
  //     //   context: error.context,
  //     //   type: error.type,
  //     //   data: error.data
  //     // });
  //   });
  // }


  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
      this.connectionStatusCallback?.(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.connectionStatusCallback?.(false);
      // ✅ If server kicked us, manually reconnect
      if (reason === 'io server disconnect') {
        this.socket?.connect();
      }
    });

    this.socket.on('error', (error) => {
      console.log('Socket error:', error);
    });

    this.socket.io.on('error', (error) => {
      console.log('Transport error:', error);
    });

    this.socket.on('connect_error', (error: any) => {
      console.log('[SocketService] connect_error:', error.message);
      this.connectionStatusCallback?.(false);
    });
  }

  joinConversation(conversationId: string) {
    if (this.socket && this.socket.connected) {
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
        console.log('[SocketService] message:send ack:', JSON.stringify(response, null, 2));
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
  // onUnreadCount(callback: (data: any) => void) {
  //   if (this.socket) {
  //     this.socket.on('unread:count', callback);
  //   }
  // }

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

  updateMessage({ messageId, message }: { messageId: string, message: any }) {
    if (this.socket) {
      this.socket.emit('message:update', messageId, message);
    }
  }
  // Inside your SocketService class
  updateOfferingWork(data: NewOfferData) {
    if (this.socket) {

      console.log('Emitting updateOfferingWork event with data:', data);
      // Must match the backend listener string exactly
      this.socket.emit('message:update:offeringWork', data, (response: any) => {
        if (response.ok) {
          console.log("Success in socket:", response.message);
        } else {
          console.log("Error from backend:", response.error);
        }
      });
    }
  }
  deletChatroom(conversationId: string) {
    if (this.socket) {
      this.socket.emit('conversation:deleteChatRoomAndConversations', conversationId);
    }
  }
  markMessagesAsRead(conversationId: string) {
    if (this.socket && this.socket.connected) {
      console.log('Emitting typing event:', { conversationId });
      this.socket.emit('message:read', conversationId);
    } else {
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
// socketService.ts — one method, correct event name
onUnreadCount(callback: (totalChatUnread: number) => void) {
  if (this.socket) {
    this.socket.on('chat:messages:unread:count', callback);
  }
}

requestUnreadCount() {
  if (this.socket && this.socket.connected) {
    this.socket.emit('chat:messages:unread:count:get');
  }
}

// Realtime connection status — fires immediately with the current state,
// then again on every connect / disconnect / connect_error.
onConnectionStatus(callback: (connected: boolean) => void) {
  this.connectionStatusCallback = callback;
  if (this.socket) {
    callback(this.socket.connected);
  }
}

// =====================================================================
// Notification realtime events (bell badge)
// =====================================================================

// Bell badge — fires on connect, on every new notification, and after read/view.
// Payload: { notificationUnreadCount: number, isViewed: boolean }
onNotificationUnreadCount(callback: (data: { notificationUnreadCount: number; isViewed: boolean }) => void) {
  if (this.socket) {
    this.socket.on('notification:unread:count', callback);
  }
}

// The notification document itself — use it for a toast, or to prepend to the list.
onNewNotification(callback: (notification: any) => void) {
  if (this.socket) {
    this.socket.on('notification:new', callback);
  }
}

// Ask the server to re-send notification:unread:count (app resume / pull-to-refresh).
requestNotificationUnreadCount() {
  if (this.socket && this.socket.connected) {
    this.socket.emit('notification:unread:count:get');
  }
}

  // Remove a specific listener (or all for the event if no callback is given).
  // Passing the callback is important when multiple components listen to the
  // same event — socket.off(event) without a callback removes every handler,
  // including ones registered by other screens (e.g. the floating chat
  // button's badge listener gets dropped when ChatScreen unmounts).
  removeListener(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
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