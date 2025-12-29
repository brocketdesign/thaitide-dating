'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import { FaHeart, FaComments, FaUser, FaStar, FaEnvelope } from 'react-icons/fa';
import { messageApi, userApi } from '@/lib/api';
import { socketService } from '@/lib/socket';
import toast from 'react-hot-toast';

export default function Navigation() {
  const pathname = usePathname();
  const { user: clerkUser, isLoaded } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  const isActive = (path: string) => {
    if (path === '/profile') {
      // Only highlight profile for exact match or /profile/edit, /profile/create
      // Not for /profile/[userId] which is viewing other users
      return pathname === '/profile' || pathname === '/profile/edit' || pathname === '/profile/create';
    }
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!dbUserId) return;
    
    try {
      const response = await messageApi.getUnreadCount(dbUserId);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [dbUserId]);

  useEffect(() => {
    async function initUser() {
      if (!isLoaded || !clerkUser) return;

      try {
        const profileResponse = await userApi.getProfileByClerkId(clerkUser.id);
        const userId = profileResponse.data.user._id;
        setDbUserId(userId);
        
        // Connect socket for real-time notifications
        socketService.connect(userId);
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    }

    initUser();
  }, [clerkUser, isLoaded]);

  useEffect(() => {
    if (!dbUserId) return;

    // Fetch initial unread count
    fetchUnreadCount();
    
    // Listen for real-time unread count updates
    const handleUnreadUpdate = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    };

    // Listen for message notifications to show toast
    const handleMessageNotification = (data: any) => {
      // Only show notification if not on the messages page for that match
      if (!pathname?.includes(`/messages/${data.matchId}`)) {
        toast(
          `💬 ${data.senderName}: ${data.message.content.substring(0, 50)}${data.message.content.length > 50 ? '...' : ''}`,
          {
            duration: 4000,
            position: 'top-right',
            style: {
              background: 'linear-gradient(to right, #ec4899, #8b5cf6)',
              color: 'white',
              fontWeight: '500',
            },
            icon: '💌',
          }
        );
      }
    };

    socketService.onUnreadCountUpdate(handleUnreadUpdate);
    socketService.onMessageNotification(handleMessageNotification);
    
    // Also poll every 30 seconds as backup
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      clearInterval(interval);
      socketService.removeListener('unread_count_update', handleUnreadUpdate);
      socketService.removeListener('message_notification', handleMessageNotification);
    };
  }, [dbUserId, pathname, fetchUnreadCount]);

  const navItems = [
    { path: '/discover', icon: <FaHeart />, label: 'Discover' },
    { path: '/matches', icon: <FaComments />, label: 'Connections' },
    { path: '/messages', icon: <FaEnvelope />, label: 'Messages', badge: unreadCount },
    { path: '/profile', icon: <FaUser />, label: 'Profile' },
    { path: '/premium', icon: <FaStar />, label: 'Premium' },
  ];

  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  // Don't show navigation on landing page, sign-in, sign-up, or onboarding
  if (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up' || pathname === '/onboarding') {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:top-0 md:bottom-auto z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around md:justify-between items-center h-16">
          {/* Logo - hidden on mobile */}
          <Link href="/discover" className="hidden md:block">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              ThaiTide
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-6 w-full md:w-auto justify-around md:justify-center">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`relative flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'text-pink-500'
                    : 'text-gray-600 hover:text-pink-500'
                }`}
              >
                <span className="relative text-xl">
                  {item.icon}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-5 h-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </span>
                <span className="text-xs md:text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* User Button - hidden on mobile */}
          <div className="hidden md:block">
            {hasClerkKey ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <FaUser className="text-gray-500 text-sm" />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
