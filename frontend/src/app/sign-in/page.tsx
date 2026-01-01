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
      // Only clear if we're not in the middle of a Clerk redirect
      if (!window.location.search.includes('__clerk_db_jwt')) {
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('clerk-db-')) { // Only clear specific stale db items if needed
            localStorage.removeItem(key);
          }
        });
      }
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
