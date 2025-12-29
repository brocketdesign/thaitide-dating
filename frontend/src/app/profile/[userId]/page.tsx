'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { userApi, matchApi, getImageUrl } from '@/lib/api';
import { FaArrowLeft, FaHeart, FaTimes, FaEnvelope, FaMapMarkerAlt, FaPaperPlane } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  photos?: string[];
  bio?: string;
  location: {
    city?: string;
    country?: string;
  };
  dateOfBirth: string;
  interests: string[];
  occupation?: string;
  education?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const userId = params.userId as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isMatched, setIsMatched] = useState(false);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [startingConversation, setStartingConversation] = useState(false);

  useEffect(() => {
    async function init() {
      if (!isLoaded || !clerkUser) return;

      try {
        // Get current user's database ID
        const profileResponse = await userApi.getProfileByClerkId(clerkUser.id);
        const currentUserId = profileResponse.data.user._id;
        setDbUserId(currentUserId);
        
        // Load the profile being viewed
        const response = await userApi.getProfile(userId);
        setProfile(response.data.user);

        // Record profile visit (don't block on this)
        if (currentUserId !== userId) {
          matchApi.recordProfileVisit(userId, currentUserId).catch(() => {
            // Silently fail - not critical
          });
        }

        // Check if already matched
        const matchResponse = await matchApi.findMatchBetweenUsers(currentUserId, userId);
        if (matchResponse.data.exists && matchResponse.data.match) {
          setIsMatched(true);
          setMatchId(matchResponse.data.match._id);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [userId, clerkUser, isLoaded]);

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

  const handleSwipe = async (liked: boolean) => {
    if (!dbUserId || !profile) return;

    try {
      if (liked) {
        const response = await matchApi.swipeRight(dbUserId, profile._id);
        if (response.data.matched) {
          setIsMatched(true);
          setMatchId(response.data.matchId);
          toast.success('🎉 It\'s a match!', {
            duration: 3000,
            icon: '❤️'
          });
        } else {
          toast.success('Like sent!');
          router.back();
        }
      } else {
        await matchApi.swipeLeft(dbUserId, profile._id);
        toast('Passed', { icon: '👋' });
        router.back();
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to process action');
      }
    }
  };

  const handleMessage = () => {
    if (matchId) {
      router.push(`/messages/${matchId}`);
    }
  };

  const handleStartConversation = async () => {
    if (!dbUserId || !profile) return;
    
    setStartingConversation(true);
    try {
      const response = await matchApi.getOrCreateConversation(dbUserId, profile._id);
      const { match } = response.data;
      
      if (match) {
        setMatchId(match._id);
        setIsMatched(true);
        router.push(`/messages/${match._id}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    } finally {
      setStartingConversation(false);
    }
  };

  const allPhotos = profile ? [profile.profilePhoto, ...(profile.photos || [])].filter(Boolean) : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h3 className="text-2xl font-bold mb-2">Profile not found</h3>
          <button
            onClick={() => router.back()}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaArrowLeft className="text-gray-700 text-xl" />
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-800">
            {profile.firstName}'s Profile
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Photo Gallery */}
        <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="h-96 md:h-[500px] bg-gradient-to-br from-pink-100 to-purple-100">
            {allPhotos.length > 0 ? (
              <img
                src={getImageUrl(allPhotos[currentPhotoIndex] || '')}
                alt={profile.firstName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">👤</div>
            )}
          </div>
          
          {/* Photo indicators */}
          {allPhotos.length > 1 && (
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 px-4">
              {allPhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`h-1 flex-1 max-w-12 rounded-full transition-colors ${
                    index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Photo navigation */}
          {allPhotos.length > 1 && (
            <>
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
                className="absolute left-0 top-0 bottom-0 w-1/3"
              />
              <button
                onClick={() => setCurrentPhotoIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
                className="absolute right-0 top-0 bottom-0 w-1/3"
              />
            </>
          )}
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-gray-800">
              {profile.firstName} {profile.lastName}
              <span className="text-2xl font-normal text-gray-600 ml-2">
                {calculateAge(profile.dateOfBirth)}
              </span>
            </h2>
            <p className="text-gray-600 flex items-center mt-2">
              <FaMapMarkerAlt className="mr-2 text-pink-500" />
              {profile.location.city}, {profile.location.country}
            </p>
          </div>

          {profile.occupation && (
            <p className="text-gray-700 mb-2">
              💼 {profile.occupation}
            </p>
          )}

          {profile.education && (
            <p className="text-gray-700 mb-4">
              🎓 {profile.education}
            </p>
          )}

          {profile.bio && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2">About</h3>
              <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {profile.interests && profile.interests.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest, i) => (
                  <span
                    key={i}
                    className="px-4 py-2 bg-gradient-to-r from-pink-100 to-purple-100 text-pink-700 rounded-full text-sm font-medium"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bottom-20 left-0 right-0 px-4 md:static md:px-0">
          <div className="max-w-2xl mx-auto">
            {isMatched ? (
              <button
                onClick={handleMessage}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-shadow"
              >
                <FaEnvelope className="text-xl" />
                Send Message
              </button>
            ) : (
              <div className="space-y-3">
                {/* Send Message Button */}
                <button
                  onClick={handleStartConversation}
                  disabled={startingConversation}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-shadow disabled:opacity-50"
                >
                  {startingConversation ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Starting conversation...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="text-xl" />
                      Send Message
                    </>
                  )}
                </button>
                
                {/* Like/Pass Buttons */}
                <div className="flex justify-center gap-6 bg-white/80 backdrop-blur-sm py-4 px-6 rounded-2xl shadow-xl">
                  <button
                    onClick={() => handleSwipe(false)}
                    className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform border-2 border-gray-100"
                  >
                    <FaTimes className="text-red-500 text-2xl" />
                  </button>
                  <button
                    onClick={() => handleSwipe(true)}
                    className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <FaHeart className="text-white text-2xl" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
