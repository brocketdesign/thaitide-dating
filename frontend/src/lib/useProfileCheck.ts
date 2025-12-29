'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api';

export function useProfileCheck() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkProfile() {
      if (!isLoaded) return;
      
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await userApi.checkProfileExists(user.id);
        const { exists, isComplete: complete, hasProfilePhoto } = response.data;
        setProfileExists(exists);
        setIsComplete(complete || hasProfilePhoto);
        
        // Only redirect to onboarding if profile doesn't exist or is incomplete (no photo)
        if (!exists || (!complete && !hasProfilePhoto)) {
          router.push('/onboarding');
        }
      } catch (error) {
        // If error (e.g., backend not running), assume profile doesn't exist
        console.error('Error checking profile:', error);
        setProfileExists(false);
        setIsComplete(false);
        router.push('/onboarding');
      } finally {
        setIsChecking(false);
      }
    }

    checkProfile();
  }, [user, isLoaded, router]);

  return { profileExists, isComplete, isChecking, isLoaded };
}
