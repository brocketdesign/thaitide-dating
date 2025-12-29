'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaHeart, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { getImageUrl, matchApi, userApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    firstName: string;
    profilePhoto?: string;
    _id?: string;
  };
  matchedUser: {
    _id: string;
    firstName: string;
    profilePhoto?: string;
  };
  matchId: string;
}

export default function MatchModal({
  isOpen,
  onClose,
  currentUser,
  matchedUser,
  matchId,
}: MatchModalProps) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Delay showing content for entrance animation
      setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(false);
      setIsAnimating(false);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (isCreatingConversation) return;
    
    setIsCreatingConversation(true);
    try {
      if (!clerkUser) {
        toast.error('Please log in to send a message');
        return;
      }

      // Get current user ID from database
      const profileResponse = await userApi.getProfileByClerkId(clerkUser.id);
      const currentUserId = profileResponse.data.user._id;

      // Create or get conversation
      const response = await matchApi.getOrCreateConversation(currentUserId, matchedUser._id);
      const conversationMatchId = response.data.match._id;

      router.push(`/messages/${conversationMatchId}`);
      onClose();
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation. Please try again.');
      setIsCreatingConversation(false);
    }
  };

  const handleKeepSwiping = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Animated background with hearts */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-600/95 via-purple-600/95 to-pink-600/95 backdrop-blur-sm overflow-hidden">
        {/* Floating hearts animation */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-heart text-white/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
              fontSize: `${20 + Math.random() * 30}px`,
            }}
          >
            ❤️
          </div>
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-3 text-white/80 hover:text-white transition-colors"
      >
        <FaTimes className="text-2xl" />
      </button>

      {/* Content */}
      <div className={`relative z-10 flex flex-col items-center px-6 transition-all duration-500 ${
        showContent ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        {/* Title with sparkles */}
        <div className="text-center mb-8">
          <p className="text-white/80 text-lg mb-2">✨ Congratulations! ✨</p>
          <h1 className="text-5xl md:text-6xl font-extrabold text-white animate-pulse-slow">
            It's a Match!
          </h1>
        </div>

        {/* Profile cards with heart */}
        <div className="relative flex items-center justify-center mb-10">
          {/* Current user's profile */}
          <div className={`relative transition-all duration-700 delay-200 ${
            showContent ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'
          }`}>
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200">
              {currentUser.profilePhoto ? (
                <img
                  src={getImageUrl(currentUser.profilePhoto)}
                  alt={currentUser.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  👤
                </div>
              )}
            </div>
            <p className="text-white text-center mt-2 font-semibold text-lg">
              {currentUser.firstName}
            </p>
          </div>

          {/* Heart in the middle */}
          <div className={`relative mx-4 transition-all duration-500 delay-500 ${
            showContent ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}>
            <div className="relative">
              <FaHeart className="text-6xl md:text-7xl text-white drop-shadow-lg animate-heartbeat" />
              <FaHeart className="absolute inset-0 text-6xl md:text-7xl text-pink-300 blur-md animate-heartbeat" />
            </div>
          </div>

          {/* Matched user's profile */}
          <div className={`relative transition-all duration-700 delay-200 ${
            showContent ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'
          }`}>
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-gradient-to-br from-pink-200 to-purple-200">
              {matchedUser.profilePhoto ? (
                <img
                  src={getImageUrl(matchedUser.profilePhoto)}
                  alt={matchedUser.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl">
                  👤
                </div>
              )}
            </div>
            <p className="text-white text-center mt-2 font-semibold text-lg">
              {matchedUser.firstName}
            </p>
          </div>
        </div>

        {/* Match message */}
        <p className="text-white/90 text-center text-lg mb-8 max-w-md">
          You and <span className="font-bold">{matchedUser.firstName}</span> liked each other!<br />
          Start a conversation now 💕
        </p>

        {/* Action buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 w-full max-w-md transition-all duration-700 delay-700 ${
          showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
        }`}>
          <button
            onClick={handleSendMessage}
            disabled={isCreatingConversation}
            className="flex-1 flex items-center justify-center gap-3 bg-white text-pink-600 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane className="text-xl" />
            {isCreatingConversation ? 'Starting...' : 'Send a Message'}
          </button>
          <button
            onClick={handleKeepSwiping}
            className="flex-1 flex items-center justify-center gap-3 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-full font-bold text-lg border-2 border-white/30 hover:bg-white/30 hover:scale-105 transition-all"
          >
            Keep Swiping
          </button>
        </div>
      </div>

      {/* CSS for custom animations */}
      <style jsx global>{`
        @keyframes float-heart {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.2;
          }
          50% {
            transform: translateY(-30px) rotate(15deg);
            opacity: 0.4;
          }
        }
        
        @keyframes heartbeat {
          0%, 100% {
            transform: scale(1);
          }
          10%, 30% {
            transform: scale(1.15);
          }
          20% {
            transform: scale(1.1);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
          }
        }
        
        .animate-float-heart {
          animation: float-heart 5s ease-in-out infinite;
        }
        
        .animate-heartbeat {
          animation: heartbeat 1.2s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
