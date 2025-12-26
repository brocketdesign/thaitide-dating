'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { FaHeart, FaComments, FaUser, FaStar } from 'react-icons/fa';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { path: '/discover', icon: <FaHeart />, label: 'Discover' },
    { path: '/matches', icon: <FaComments />, label: 'Matches' },
    { path: '/premium', icon: <FaStar />, label: 'Premium' },
  ];

  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  // Don't show navigation on landing page, sign-in, or sign-up
  if (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up') {
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
                className={`flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'text-pink-500'
                    : 'text-gray-600 hover:text-pink-500'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
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
