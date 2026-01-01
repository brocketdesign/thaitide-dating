'use client';

import { useEffect, useState, Suspense } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { userApi } from '@/lib/api';

function AuthRedirectContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Checking your profile...');

  useEffect(() => {
    async function handleRedirect() {
      if (!isLoaded) return;

      // Handle logout redirect
      const action = searchParams.get('action');
      if (action === 'logout') {
        setStatus('Signing out...');
        router.push('/');
        return;
      }

      if (!user) {
        // If we're here but no user is found, it might be a race condition
        // Wait a moment before redirecting to sign-in to avoid infinite loops
        const timer = setTimeout(() => {
          setStatus('Redirecting to sign in...');
          router.push('/sign-in');
        }, 3000);
        return () => clearTimeout(timer);
      }

      try {
        setStatus('Checking your profile...');
        const response = await userApi.checkProfileExists(user.id);
        const { exists, isComplete, hasProfilePhoto } = response.data;

        // If profile exists and has a profile photo, onboarding is complete
        if (exists && (isComplete || hasProfilePhoto)) {
          setStatus('Welcome back! Redirecting to discover...');
          router.push('/discover');
        } else {
          // No profile or profile incomplete (no photo), go to onboarding
          setStatus('Setting up your profile...');
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        // On error, assume we need onboarding
        setStatus('Setting up your profile...');
        router.push('/onboarding');
      }
    }

    handleRedirect();
  }, [user, isLoaded, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}

export default function AuthRedirectPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthRedirectContent />
    </Suspense>
  );
}
