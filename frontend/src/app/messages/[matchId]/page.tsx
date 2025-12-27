'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { messageApi } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface Message {
  _id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export default function MessagesPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = 'temp-user-id'; // This would come from your user profile

  useEffect(() => {
    loadMessages();
    
    // Connect to socket
    const socket = socketService.connect(currentUserId);

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.matchId === matchId) {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    const handleTyping = (data: any) => {
      if (data.matchId === matchId && data.userId !== currentUserId) {
        setTyping(true);
        setTimeout(() => setTyping(false), 3000);
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onTyping(handleTyping);

    return () => {
      socketService.removeListener('new_message', handleNewMessage);
      socketService.removeListener('user_typing', handleTyping);
    };
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await messageApi.getMessages(matchId);
      setMessages(response.data.messages);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const receiverId = 'receiver-id'; // This should be the other user's ID from the match

    socketService.sendMessage({
      matchId,
      senderId: currentUserId,
      receiverId,
      content: newMessage
    });

    setNewMessage('');
  };

  const handleTyping = () => {
    const receiverId = 'receiver-id';
    socketService.emitTyping({
      matchId,
      userId: currentUserId,
      receiverId
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-md p-4">
          <h2 className="text-xl font-bold text-gray-800">Chat</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl ${
                  message.senderId === currentUserId
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'bg-white text-gray-800 shadow-md'
                }`}
              >
                <p>{message.content}</p>
                <p className={`text-xs mt-1 ${message.senderId === currentUserId ? 'text-pink-100' : 'text-gray-500'}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-2 rounded-2xl shadow-md">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleTyping}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
            >
              <FaPaperPlane className="text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
