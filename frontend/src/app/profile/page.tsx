'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userApi, getImageUrl } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { FaMapMarkerAlt, FaCalendarAlt, FaHeart, FaEdit, FaCheckCircle, FaCrown, FaCamera, FaGlobe, FaStar, FaSignOutAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useTranslation } from '@/lib/i18n';

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  profilePhoto?: string;
  photos: string[];
  bio?: string;
  dateOfBirth: string;
  gender: string;
  lookingFor: string;
  location: {
    city?: string;
    country?: string;
  };
  languages: string[];
  interests: string[];
  verified: boolean;
  photoVerificationStatus: 'pending' | 'verified' | 'rejected';
  isPremium: boolean;
  premiumUntil?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  // Custom sign out handler that properly clears all session data
  const handleSignOut = useCallback(async () => {
    if (signingOut) return;
    setSigningOut(true);
    
    try {
      // Disconnect socket first
      socketService.disconnect();
      
      // Clear local storage items related to auth
      if (typeof window !== 'undefined') {
        // Clear Clerk-related items
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('clerk') || key.startsWith('__clerk')) {
            localStorage.removeItem(key);
          }
        });
        
        // Clear session storage
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('clerk') || key.startsWith('__clerk')) {
            sessionStorage.removeItem(key);
          }
        });
      }
      
      // Perform Clerk sign out with redirect
      await signOut({ redirectUrl: '/' });
      
      // Force a hard navigation to clear any cached state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      setSigningOut(false);
      // Force redirect even on error
      window.location.href = '/';
    }
  }, [signOut, signingOut]);

  useEffect(() => {
    async function loadProfile() {
      if (!isLoaded) return;

      if (!clerkUser && hasClerkKey) {
        router.push('/sign-in');
        return;
      }

      try {
        const clerkId = clerkUser?.id || 'demo-user';
        const response = await userApi.getProfileByClerkId(clerkId);
        setProfile(response.data.user);
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        if (error.response?.status === 404) {
          router.push('/onboarding');
        } else {
          toast.error(t.errors.failedToLoad);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [clerkUser, isLoaded, router, hasClerkKey]);

  // Set document title to show profile owner's name when loaded
  useEffect(() => {
    const prevTitle = document.title;
    if (profile) {
      document.title = `@${profile.username} — Profile`;
    } else {
      document.title = 'Profile';
    }
    return () => {
      document.title = prevTitle;
    };
  }, [profile]);

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getVerificationBadge = () => {
    if (profile?.photoVerificationStatus === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
          <FaCheckCircle className="text-xs" />
          {t.common.verified}
        </span>
      );
    } else if (profile?.photoVerificationStatus === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
          {t.common.pendingVerification}
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center pt-16 md:pt-20 pb-20 md:pb-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center pt-16 md:pt-20 pb-20 md:pb-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.profile.notFound}</h2>
          <p className="text-gray-600 mb-6">{t.profile.notFoundMessage}</p>
          <Link
            href="/onboarding"
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-shadow"
          >
            {t.profile.createProfile}
          </Link>
        </div>
      </div>
    );
  }

  const allPhotos = profile.profilePhoto 
    ? [profile.profilePhoto, ...profile.photos.filter(p => p !== profile.profilePhoto)]
    : profile.photos;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pt-16 md:pt-20 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{t.profile.title}</h1>
        {/* Header Card with Photo */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* Photo Gallery */}
          <div className="relative">
            {allPhotos.length > 0 ? (
              <>
                <div className="aspect-[4/5] w-full">
                  <img
                    src={getImageUrl(allPhotos[activePhotoIndex])}
                    alt={`@${profile.username}'s photo`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Photo Indicators */}
                {allPhotos.length > 1 && (
                  <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 px-4">
                    {allPhotos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActivePhotoIndex(index)}
                        className={`h-1 rounded-full flex-1 max-w-12 transition-all ${
                          index === activePhotoIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
                {/* Navigation Buttons */}
                {allPhotos.length > 1 && (
                  <>
                    <button
                      onClick={() => setActivePhotoIndex(prev => prev > 0 ? prev - 1 : allPhotos.length - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setActivePhotoIndex(prev => prev < allPhotos.length - 1 ? prev + 1 : 0)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}
              </>
            ) : (
              <div className="aspect-[4/5] w-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                <div className="text-center">
                  <FaCamera className="text-6xl text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400">No photos yet</p>
                </div>
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute bottom-4 left-4 flex gap-2">
              {profile.isPremium && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full text-sm font-medium shadow-lg">
                  <FaCrown className="text-xs" />
                  {t.common.premium}
                </span>
              )}
              {getVerificationBadge()}
            </div>
          </div>

          {/* Profile Info */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  @{profile.username}, {calculateAge(profile.dateOfBirth)}
                </h1>
                {profile.location.city && (
                  <p className="text-gray-500 flex items-center gap-1 mt-1">
                    <FaMapMarkerAlt className="text-pink-500" />
                    {profile.location.city}{profile.location.country && `, ${profile.location.country}`}
                  </p>
                )}
              </div>
              <Link
                href="/profile/edit"
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                title="Edit Profile"
              >
                <FaEdit className="text-gray-600" />
              </Link>
            </div>

            {profile.bio && (
              <p className="text-gray-700 mb-4 leading-relaxed">{profile.bio}</p>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-100">
              <div className="text-center">
                <p className="text-sm text-gray-500">{t.onboarding.basic.gender}</p>
                <p className="font-medium text-gray-800 capitalize">{profile.gender}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">{t.profile.details.lookingFor}</p>
                <p className="font-medium text-gray-800 capitalize">{profile.lookingFor}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">{t.profile.memberSince}</p>
                <p className="font-medium text-gray-800">{new Date(profile.createdAt).getFullYear()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interests Section */}
        {profile.interests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaHeart className="text-pink-500" />
              {t.profile.interests}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 rounded-full text-sm border border-pink-100"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages Section */}
        {profile.languages.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FaGlobe className="text-purple-500" />
              {t.profile.languages}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map((language, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-100"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Premium Promotion */}
        {!profile.isPremium && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <FaStar className="text-2xl" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg">{t.profile.upgradeToPremium}</h3>
                <p className="text-white/90 text-sm">{t.premium.subtitle}</p>
              </div>
              <Link
                href="/premium"
                className="px-4 py-2 bg-white text-orange-500 rounded-full font-medium hover:shadow-lg transition-shadow"
              >
                {t.matches.premiumBanner.upgradeNow}
              </Link>
            </div>
          </div>
        )}

        {/* Premium Status */}
        {profile.isPremium && profile.premiumUntil && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-xl p-6 text-white mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full">
                <FaCrown className="text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{t.profile.premiumMember}</h3>
                <p className="text-white/90 text-sm">
                  {t.profile.premiumUntil} {formatDate(profile.premiumUntil)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sign Out Button - visible on mobile, hidden on desktop (desktop has it in nav) */}
        {hasClerkKey && (
          <div className="md:hidden bg-white rounded-2xl shadow-xl p-4 mb-6">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <FaSignOutAlt />
              <span>{signingOut ? t.common.loading : t.common.signOut}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
