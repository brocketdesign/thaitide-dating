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
  // Always render ClerkProvider if the key is present, even during SSR/build
  const hasClerkKey = !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_'));

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

  // Fallback for when key is missing (e.g. during some build steps if env vars aren't loaded)
  // We still render children but wrapped in a fragment, which might cause issues if children use Clerk hooks.
  // However, since we're in a build environment, we should try to provide a mock context or just render nothing if it's critical.
  // For now, let's render the error message only if we're sure we're missing the key in a real environment.
  
  return (
    <>
      <Navigation />
      <Toaster position="top-right" />
      <AdminDebugMenu />
      <PWAInstaller />
      <div className="md:pt-16 pb-16 md:pb-0 flex items-center justify-center min-h-[50vh]">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200 max-w-md mx-4">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Configuration Error</h2>
          <p className="text-red-600">
            Missing Clerk Publishable Key. Please check your environment variables.
          </p>
        </div>
      </div>
    </>
  );
}
