'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { messageApi, matchApi, userApi, getImageUrl } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { FaPaperPlane, FaArrowLeft, FaCircle } from 'react-icons/fa';
import { IoMdMale, IoMdFemale } from 'react-icons/io';
import { HiLocationMarker } from 'react-icons/hi';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
  isNew?: boolean; // For animation
}

interface OtherUser {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  location?: {
    city?: string;
    country?: string;
  };
  lastSeen: string;
}

export default function MessagesPage() {
  const params = useParams();
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const matchId = params.matchId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      if (!isLoaded || !clerkUser) return;
      
      try {
        // Get the database user ID from Clerk ID
        const profileResponse = await userApi.getProfileByClerkId(clerkUser.id);
        const dbUserId = profileResponse.data.user._id;
        setCurrentUserId(dbUserId);
        
        // Store in localStorage for consistency
        localStorage.setItem('userId', dbUserId);
        
        // Ensure conversation exists or create it
        // First, get match details to find the other user
        try {
          const response = await matchApi.getMatchDetails(matchId, dbUserId);
          setOtherUser(response.data.otherUser);
        } catch (error: any) {
          // If match details fail, the match might not exist yet
          // Try to create the conversation with the target user from URL params
          console.log('Match details failed, attempting to create conversation');
        }
      } catch (error) {
        console.error('Failed to load match details:', error);
        toast.error('Failed to load chat');
      }
    }
    
    init();
  }, [matchId, clerkUser, isLoaded]);

  useEffect(() => {
    if (!currentUserId) return;
    
    loadMessages();
    
    // Connect to socket
    const socket = socketService.connect(currentUserId);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.matchId === matchId) {
        setMessages((prev) => [...prev, { ...data.message, isNew: true }]);
        
        // Mark the incoming message as read since user is viewing the conversation
        if (data.message.receiverId === currentUserId) {
          socketService.emitMarkAsRead({ matchId, userId: currentUserId });
        }
      }
    };

    const handleTyping = (data: any) => {
      if (data.matchId === matchId && data.userId !== currentUserId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 3000);
      }
    };

    const handleMessageSent = (data: any) => {
      if (data.message) {
        // Replace optimistic message with real message from server
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id.toString().startsWith('temp-')
              ? { ...data.message, isNew: false }
              : msg
          )
        );
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onTyping(handleTyping);
    socketService.onMessageSent(handleMessageSent);

    return () => {
      socketService.removeListener('new_message', handleNewMessage);
      socketService.removeListener('user_typing', handleTyping);
      socketService.removeListener('message_sent', handleMessageSent);
    };
  }, [matchId, currentUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageApi.getMessages(matchId);
      setMessages(response.data.messages);
      
      // Mark all messages in this conversation as read via socket for real-time badge update
      if (currentUserId) {
        socketService.emitMarkAsRead({ matchId, userId: currentUserId });
      }
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const receiverId = otherUser?._id || 'receiver-id';
    const messageContent = newMessage.trim();
    
    // Clear input immediately for better UX
    setNewMessage('');
    setSending(true);

    // Optimistic update - add message immediately with animation
    const optimisticMessage: Message = {
      _id: `temp-${Date.now()}`,
      senderId: currentUserId,
      receiverId,
      content: messageContent,
      createdAt: new Date().toISOString(),
      read: false,
      isNew: true
    };
    
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      socketService.sendMessage({
        matchId,
        senderId: currentUserId,
        receiverId,
        content: messageContent
      });
      // The message_sent event handler will replace the temp message with the real one from the server
    } catch (error) {
      toast.error('Failed to send message');
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleTypingEvent = () => {
    const receiverId = otherUser?._id || 'receiver-id';
    socketService.emitTyping({
      matchId,
      userId: currentUserId,
      receiverId
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'Online now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getGenderIcon = (gender: string) => {
    if (gender === 'male') return <IoMdMale className="text-blue-500" />;
    if (gender === 'female') return <IoMdFemale className="text-pink-500" />;
    return null;
  };

  if (!isLoaded || (loading && !otherUser)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen md:h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-br from-pink-50 via-white to-purple-50 md:mt-16">
      <div className="max-w-4xl mx-auto h-full flex flex-col overflow-hidden">
        {/* Enhanced Header */}
        <div className="flex-shrink-0 bg-white shadow-md px-4 py-3 flex items-center gap-4 border-b border-gray-100">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaArrowLeft className="text-gray-600 text-lg" />
          </button>
          
          {otherUser && (
            <div 
              className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
              onClick={() => router.push(`/profile/${otherUser._id}`)}
            >
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-pink-400 to-purple-500 p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-white">
                    {otherUser.profilePhoto ? (
                      <Image
                        src={getImageUrl(otherUser.profilePhoto)}
                        alt={otherUser.firstName}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-white text-lg font-semibold">
                        {otherUser.firstName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                {/* Online indicator */}
                {formatLastSeen(otherUser.lastSeen) === 'Online now' && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-800 truncate">
                    {otherUser.firstName}
                  </h2>
                  <span className="text-gray-500">{otherUser.age}</span>
                  {getGenderIcon(otherUser.gender)}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  {otherUser.location?.city && (
                    <span className="flex items-center gap-1 truncate">
                      <HiLocationMarker className="text-pink-500 flex-shrink-0" />
                      <span className="truncate">
                        {otherUser.location.city}
                        {otherUser.location.country && `, ${otherUser.location.country}`}
                      </span>
                    </span>
                  )}
                  <span className="flex items-center gap-1 flex-shrink-0">
                    <FaCircle 
                      className={`text-[8px] ${
                        formatLastSeen(otherUser.lastSeen) === 'Online now' 
                          ? 'text-green-500' 
                          : 'text-gray-400'
                      }`} 
                    />
                    {formatLastSeen(otherUser.lastSeen)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-3">
          {messages.length === 0 && !loading && (
            <div className="text-center text-gray-500 mt-10">
              <p className="text-lg">Say hello to {otherUser?.firstName || 'your match'}! 👋</p>
              <p className="text-sm mt-2">Start a conversation</p>
            </div>
          )}
          
          {messages.map((message, index) => {
            const isOwn = message.senderId === currentUserId || 
                          (typeof message.senderId === 'object' && (message.senderId as any)?._id === currentUserId);
            const showTimestamp = index === 0 || 
              new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000;
            
            return (
              <div key={message._id}>
                {showTimestamp && (
                  <div className="text-center text-xs text-gray-400 my-4">
                    {new Date(message.createdAt).toLocaleDateString([], { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                <div
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${
                    message.isNew ? 'animate-message-in' : ''
                  }`}
                >
                  <div
                    className={`max-w-[75%] md:max-w-md px-4 py-2.5 rounded-2xl transform transition-all duration-300 ${
                      isOwn
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 shadow-md rounded-bl-md'
                    } ${message.isNew ? 'scale-100' : ''}`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-pink-100' : 'text-gray-400'}`}>
                      {new Date(message.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {typing && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white px-4 py-3 rounded-2xl shadow-md rounded-bl-md">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4 pb-safe">
          <form onSubmit={sendMessage} className="flex gap-3 items-end">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleTypingEvent}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                newMessage.trim() && !sending
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg hover:scale-105 active:scale-95'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <FaPaperPlane 
                className={`text-white transition-transform duration-300 ${
                  sending ? 'translate-x-1 -translate-y-1' : ''
                }`} 
              />
            </button>
          </form>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes messageIn {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-message-in {
          animation: messageIn 0.3s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        .pb-safe {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}
