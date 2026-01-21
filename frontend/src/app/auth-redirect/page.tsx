'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { userApi } from '@/lib/api';

function AuthRedirectContent() {
  const { user, isLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Checking your profile...');
  const hasRedirected = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 10; // 10 retries at 500ms = 5 seconds max wait

  useEffect(() => {
    async function handleRedirect() {
      // Prevent multiple redirects
      if (hasRedirected.current) return;
      
      // Wait for Clerk to fully load
      if (!isLoaded) return;

      // Handle logout redirect
      const action = searchParams.get('action');
      if (action === 'logout') {
        hasRedirected.current = true;
        setStatus('Signing out...');
        router.push('/');
        return;
      }

      // Check if we're in the middle of a Clerk handshake
      const hasClerkParams = searchParams.has('__clerk_db_jwt') || 
                            searchParams.has('__clerk_status') ||
                            searchParams.has('__clerk_ticket');
      
      if (hasClerkParams) {
        // Let the handshake complete, don't redirect yet
        setStatus('Completing authentication...');
        return;
      }

      // If user is not available but isSignedIn is true, wait for user data to sync
      if (!user && isSignedIn) {
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          setStatus('Loading user data...');
          // Wait and let the effect re-run
          return;
        }
      }

      // If still no user after waiting and not signed in, redirect to sign-in
      if (!user && !isSignedIn) {
        // Give it a bit more time in case of race condition
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          setStatus('Verifying authentication...');
          return;
        }
        
        hasRedirected.current = true;
        setStatus('Redirecting to sign in...');
        router.push('/sign-in');
        return;
      }

      // User is available, check profile
      if (user) {
        try {
          setStatus('Checking your profile...');
          const response = await userApi.checkProfileExists(user.id);
          const { exists, isComplete, hasProfilePhoto } = response.data;

          hasRedirected.current = true;
          
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
          hasRedirected.current = true;
          // On error, assume we need onboarding
          setStatus('Setting up your profile...');
          router.push('/onboarding');
        }
      }
    }

    // Run the redirect logic
    handleRedirect();
    
    // Set up a polling interval for when user data is syncing
    const interval = setInterval(() => {
      if (!hasRedirected.current && retryCount.current < maxRetries) {
        handleRedirect();
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [user, isLoaded, isSignedIn, router, searchParams]);

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
