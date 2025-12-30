'use client';

import dynamic from 'next/dynamic';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'react-hot-toast';
import PWAInstaller from '@/components/ui/PWAInstaller';
import { ReactNode } from 'react';

// Dynamically import components that use Clerk hooks to prevent SSR issues
const Navigation = dynamic(() => import('@/components/ui/Navigation'), { ssr: false });
const AdminDebugMenu = dynamic(() => import('@/components/ui/AdminDebugMenu'), { ssr: false });

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const hasClerkKey = typeof window !== 'undefined' && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  if (hasClerkKey) {
    return (
      <ClerkProvider>
        <Navigation />
        <Toaster position="top-right" />
        <AdminDebugMenu />
        <PWAInstaller />
        <div className="md:pt-16 pb-16 md:pb-0">
          {children}
        </div>
      </ClerkProvider>
    );
  }

  return (
    <>
      <Navigation />
      <Toaster position="top-right" />
      <AdminDebugMenu />
      <PWAInstaller />
      <div className="md:pt-16 pb-16 md:pb-0">
        {children}
      </div>
    </>
  );
}
