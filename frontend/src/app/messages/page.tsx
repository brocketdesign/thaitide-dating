'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { messageApi, userApi, getImageUrl } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { FaCircle, FaRobot } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';

interface Conversation {
  matchId: string;
  user: {
    _id: string;
    username: string;
    profilePhoto?: string;
    location?: {
      city?: string;
      country?: string;
    };
    isAI?: boolean;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
    read: boolean;
  } | null;
  unreadCount: number;
  createdAt: string;
}

export default function MessagesListPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  const fetchConversations = useCallback(async (userId: string) => {
    try {
      const response = await messageApi.getConversations(userId);
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (!isLoaded || !clerkUser) return;

      try {
        const profileResponse = await userApi.getProfileByClerkId(clerkUser.id);
        const userId = profileResponse.data.user._id;
        setDbUserId(userId);
        
        // Connect socket for real-time updates
        socketService.connect(userId);
        
        await fetchConversations(userId);
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast.error(t.errors.failedToLoad);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [clerkUser, isLoaded, fetchConversations]);

  // Listen for real-time message updates
  useEffect(() => {
    if (!dbUserId) return;

    // Handle new messages - update conversation list in real-time
    const handleNewMessage = (data: any) => {
      setConversations(prevConversations => {
        // Find the conversation for this match - ensure string comparison
        const messageMatchId = data.matchId?.toString();
        const conversationIndex = prevConversations.findIndex(
          conv => conv.matchId.toString() === messageMatchId
        );

        if (conversationIndex === -1) {
          // New conversation - refetch all conversations
          fetchConversations(dbUserId);
          return prevConversations;
        }

        // Update existing conversation
        const updatedConversations = [...prevConversations];
        const conversation = { ...updatedConversations[conversationIndex] };
        
        // Update last message
        conversation.lastMessage = {
          content: data.message.content,
          createdAt: data.message.createdAt,
          isFromMe: data.message.senderId?.toString() === dbUserId,
          read: data.message.read || false
        };

        // Increment unread count if message is not from current user
        if (data.message.senderId?.toString() !== dbUserId) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }

        updatedConversations[conversationIndex] = conversation;

        // Move the updated conversation to the top
        updatedConversations.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt || a.createdAt;
          const bTime = b.lastMessage?.createdAt || b.createdAt;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        return updatedConversations;
      });
    };

    // Handle message sent confirmation - update conversation list
    const handleMessageSent = (data: any) => {
      if (!data.message) return;
      
      // The matchId is stored inside the message object
      const messageMatchId = data.message.matchId?.toString() || data.matchId;
      
      setConversations(prevConversations => {
        const conversationIndex = prevConversations.findIndex(
          conv => conv.matchId.toString() === messageMatchId
        );

        if (conversationIndex === -1) {
          // Conversation not found - refetch to get updated list
          fetchConversations(dbUserId!);
          return prevConversations;
        }

        const updatedConversations = [...prevConversations];
        const conversation = { ...updatedConversations[conversationIndex] };
        
        conversation.lastMessage = {
          content: data.message.content,
          createdAt: data.message.createdAt,
          isFromMe: true,
          read: false
        };

        updatedConversations[conversationIndex] = conversation;

        // Move to top
        updatedConversations.sort((a, b) => {
          const aTime = a.lastMessage?.createdAt || a.createdAt;
          const bTime = b.lastMessage?.createdAt || b.createdAt;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        return updatedConversations;
      });
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageSent(handleMessageSent);

    // Handle conversation read event - clear unread badge for that conversation
    const handleConversationRead = (data: { matchId: string; unreadCount: number }) => {
      setConversations(prevConversations => {
        const conversationIndex = prevConversations.findIndex(
          conv => conv.matchId.toString() === data.matchId?.toString()
        );

        if (conversationIndex === -1) return prevConversations;

        const updatedConversations = [...prevConversations];
        updatedConversations[conversationIndex] = {
          ...updatedConversations[conversationIndex],
          unreadCount: data.unreadCount
        };

        return updatedConversations;
      });
    };

    socketService.onConversationRead(handleConversationRead);

    return () => {
      socketService.removeListener('new_message', handleNewMessage);
      socketService.removeListener('message_sent', handleMessageSent);
      socketService.removeListener('conversation_read', handleConversationRead);
    };
  }, [dbUserId, fetchConversations]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return t.common.yesterday;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 40) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-8">
          {t.messages.title}
        </h1>

        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-2xl font-bold mb-2">{t.messages.noConversations}</h3>
            <p className="text-gray-600 mb-6">
              {t.messages.noConversationsMessage}
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {t.messages.startMatching}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden divide-y divide-gray-100">
            {conversations.map((conversation) => (
              <div
                key={conversation.matchId}
                onClick={() => router.push(`/messages/${conversation.matchId}`)}
                className="flex items-center gap-4 p-4 hover:bg-pink-50 cursor-pointer transition-colors"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
                    {conversation.user.profilePhoto ? (
                      <img
                        src={getImageUrl(conversation.user.profilePhoto)}
                        alt={conversation.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold text-gray-800 ${conversation.unreadCount > 0 ? 'font-bold' : ''}`}>
                        @{conversation.user.username}
                      </h3>
                      {conversation.user.isAI && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] rounded-full font-medium">
                          <FaRobot className="text-[8px]" />
                          AI
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage ? (
                    <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                      {conversation.lastMessage.isFromMe && (
                        <span className="text-gray-400">{t.messages.you}: </span>
                      )}
                      {truncateMessage(conversation.lastMessage.content)}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      {t.messages.startConversation} 👋
                    </p>
                  )}
                </div>

                {/* Unread indicator */}
                {conversation.unreadCount > 0 && (
                  <FaCircle className="text-pink-500 text-xs flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
