'use client';

import { useEffect } from 'react';
import { SignIn, useClerk } from '@clerk/nextjs';

export default function SignInPage() {
  const { loaded } = useClerk();
  
  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  // Clear any stale auth data on sign-in page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear Clerk-related items from storage to prevent stale sessions
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('clerk') || key.startsWith('__clerk')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('clerk') || key.startsWith('__clerk')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }, []);

  if (!hasClerkKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <h2 className="text-2xl font-bold mb-4">Sign In</h2>
          <p className="text-gray-600 mb-4">
            Please configure your Clerk API keys in the .env.local file to enable authentication.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <code className="text-sm">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...</code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <SignIn forceRedirectUrl="/auth-redirect" />
    </div>
  );
}
