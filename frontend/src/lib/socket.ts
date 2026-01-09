import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
  console.log('Socket URL from env:', process.env.NEXT_PUBLIC_SOCKET_URL);
  console.log('Final socket URL:', url);
  return url;
};

class SocketService {
  private socket: Socket | null = null;

  connect(userId: string) {
    if (!this.socket) {
      console.log('Connecting to socket URL:', getSocketUrl());
      this.socket = io(getSocketUrl(), {
        transports: ['polling', 'websocket'],
        upgrade: true,
        rememberUpgrade: true,
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      this.socket.on('connect', () => {
        console.log('Socket connected successfully');
        this.socket?.emit('register', userId);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });
    }
    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(data: {
    matchId: string;
    senderId: string;
    receiverId: string;
    content: string;
  }) {
    console.log('Sending message via socket:', data);
    console.log('Socket connected:', this.socket?.connected);
    if (this.socket?.connected) {
      this.socket.emit('send_message', data);
    } else {
      console.error('Socket not connected, cannot send message');
    }
  }

  onNewMessage(callback: (data: any) => void) {
    this.socket?.on('new_message', callback);
  }

  onMessageSent(callback: (data: any) => void) {
    this.socket?.on('message_sent', callback);
  }

  onTyping(callback: (data: any) => void) {
    this.socket?.on('user_typing', callback);
  }

  onMessageNotification(callback: (data: any) => void) {
    this.socket?.on('message_notification', callback);
  }

  onUnreadCountUpdate(callback: (data: { unreadCount: number }) => void) {
    this.socket?.on('unread_count_update', callback);
  }

  onConversationRead(callback: (data: { matchId: string; unreadCount: number }) => void) {
    this.socket?.on('conversation_read', callback);
  }

  onMessageError(callback: (data: { error: string }) => void) {
    this.socket?.on('message_error', callback);
  }

  emitTyping(data: { matchId: string; userId: string; receiverId: string }) {
    this.socket?.emit('typing', data);
  }

  emitMarkAsRead(data: { matchId: string; userId: string }) {
    this.socket?.emit('mark_as_read', data);
  }

  removeListener(event: string, callback?: any) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }
}

export const socketService = new SocketService();
