'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaCrown, FaLock, FaShieldAlt, FaCheck } from 'react-icons/fa';
import { SiStripe } from 'react-icons/si';
import { getImageUrl } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface PremiumMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherUser: {
    _id: string;
    firstName: string;
    profilePhoto?: string;
  };
  subscriptionPrice?: string;
  countdown: number; // Countdown in seconds passed from parent
  canSendMessage: boolean; // Whether countdown has finished
  onSendNow?: () => void; // Callback when user clicks "Send Now" after countdown
}

export default function PremiumMessageModal({
  isOpen,
  onClose,
  otherUser,
  subscriptionPrice = '$9.99',
  countdown,
  canSendMessage,
  onSendNow,
}: PremiumMessageModalProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setTimeout(() => setShowContent(true), 100);
    } else {
      setShowContent(false);
      setIsAnimating(false);
    }
  }, [isOpen]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleSubscribe = () => {
    router.push('/premium');
    onClose();
  };

  const handleSendNow = () => {
    if (canSendMessage && onSendNow) {
      onSendNow();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
          showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 pt-8 pb-16 px-6">
          {/* Decorative circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-16 -translate-y-16" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-8 -translate-y-8" />
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
          >
            <FaTimes className="text-xl" />
          </button>

          {/* Lock Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <FaLock className="text-2xl text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center">
            {t.premiumMessage?.messageLimit || 'Message Limit Reached'}
          </h2>
        </div>

        {/* Profile Section - Overlapping */}
        <div className="relative -mt-12 flex justify-center">
          <div className="relative">
            {/* Profile Photo with animated border */}
            <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-spin-slow">
              <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {otherUser.profilePhoto ? (
                    <img
                      src={getImageUrl(otherUser.profilePhoto)}
                      alt={otherUser.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {otherUser.firstName.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Crown badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <FaCrown className="text-white text-sm" />
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="px-6 pt-6 pb-4 text-center">
          {/* Countdown Message or Ready to Send */}
          {canSendMessage ? (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <FaCheck className="text-3xl text-white" />
                </div>
              </div>
              <p className="text-gray-700 text-lg mb-2">
                {t.premiumMessage?.readyToMessage || 'Ready to message'} {otherUser.firstName}!
              </p>
              <button
                onClick={handleSendNow}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mb-6"
              >
                {t.premiumMessage?.sendNow || 'Send Message Now'}
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-700 text-lg mb-2">
                {(t.premiumMessage?.messageIn || 'Message {username} in').replace('{username}', otherUser.firstName)}
              </p>
              
              {/* Countdown Timer */}
              <div className="flex justify-center items-center gap-2 mb-6">
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 text-white px-6 py-3 rounded-2xl shadow-lg">
                  <span className="text-3xl font-bold font-mono tracking-wider">
                    {formatTime(countdown)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            <span className="text-gray-400 text-sm font-medium">
              {t.premiumMessage?.or || 'or'}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
          </div>

          {/* Subscription Offer */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 mb-4 border border-purple-100">
            <h3 className="text-xl font-bold text-gray-800 mb-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
                {subscriptionPrice}
              </span>
              <span className="text-gray-600 text-base font-medium">
                /{t.premiumMessage?.month || 'month'}
              </span>
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              {t.premiumMessage?.cancelAnytime || 'Cancel anytime'}
            </p>

            {/* Subscribe Button */}
            <button
              onClick={handleSubscribe}
              className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FaCrown className="text-yellow-300" />
              {t.premiumMessage?.subscribe || 'Subscribe to Premium'}
            </button>

            {/* Benefits Preview */}
            <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {t.premiumMessage?.unlimitedMessages || 'Unlimited messages'}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {t.premiumMessage?.noWaiting || 'No waiting'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer - Stripe security */}
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
            <FaShieldAlt className="text-green-500" />
            <span>{t.premiumMessage?.securePayment || 'Secure payment handled by'}</span>
            <SiStripe className="text-indigo-600 text-lg" />
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
