import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:5000`;
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
};

class SocketService {
  private socket: Socket | null = null;

  connect(userId: string) {
    if (!this.socket) {
      this.socket = io(getSocketUrl());
      
      this.socket.on('connect', () => {
        console.log('Socket connected');
        this.socket?.emit('register', userId);
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
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
    this.socket?.emit('send_message', data);
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
