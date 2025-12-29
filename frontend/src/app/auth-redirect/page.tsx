'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api';

export default function AuthRedirectPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState('Checking your profile...');

  useEffect(() => {
    async function handleRedirect() {
      if (!isLoaded) return;

      if (!user) {
        // Not authenticated, redirect to sign-in
        router.push('/sign-in');
        return;
      }

      try {
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
  }, [user, isLoaded, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
