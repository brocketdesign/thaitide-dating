'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { matchApi } from '@/lib/api';
import { FaHeart, FaTimes, FaSlidersH } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  bio?: string;
  location: {
    city?: string;
    country?: string;
  };
  dateOfBirth: string;
  interests: string[];
}

export default function DiscoverPage() {
  const { user: clerkUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 50,
    minAge: 18,
    maxAge: 50
  });

  useEffect(() => {
    loadPotentialMatches();
  }, []);

  const loadPotentialMatches = async () => {
    try {
      setLoading(true);
      // In production, you'd get the userId from your database based on clerkId
      const userId = 'temp-user-id'; // This would come from your user profile
      const response = await matchApi.getPotentialMatches(userId, filters);
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (currentIndex >= users.length) return;

    const currentUser = users[currentIndex];
    const userId = 'temp-user-id'; // This would come from your user profile

    try {
      if (liked) {
        const response = await matchApi.swipeRight(userId, currentUser._id);
        if (response.data.matched) {
          toast.success('🎉 It\'s a match!', {
            duration: 3000,
            icon: '❤️'
          });
        }
      } else {
        await matchApi.swipeLeft(userId, currentUser._id);
      }

      setCurrentIndex(currentIndex + 1);

      // Load more users if running low
      if (currentIndex >= users.length - 3) {
        loadPotentialMatches();
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to process swipe');
      }
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding matches...</p>
        </div>
      </div>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
            Discover
          </h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
          >
            <FaSlidersH className="text-purple-600" />
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Max Distance: {filters.maxDistance} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={filters.maxDistance}
                  onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Min Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={filters.minAge}
                    onChange={(e) => setFilters({ ...filters, minAge: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Max Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={filters.maxAge}
                    onChange={(e) => setFilters({ ...filters, maxAge: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <button
                onClick={loadPotentialMatches}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-semibold"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Profile Card */}
        {currentUser ? (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
            {/* Photo */}
            <div className="h-96 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
              {currentUser.profilePhoto ? (
                <img
                  src={currentUser.profilePhoto}
                  alt={currentUser.firstName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl">👤</div>
              )}
            </div>

            {/* Info */}
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">
                {currentUser.firstName} {currentUser.lastName}, {calculateAge(currentUser.dateOfBirth)}
              </h2>
              <p className="text-gray-600 mb-4">
                📍 {currentUser.location.city}, {currentUser.location.country}
              </p>
              {currentUser.bio && (
                <p className="text-gray-700 mb-4">{currentUser.bio}</p>
              )}
              {currentUser.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentUser.interests.map((interest, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-bold mb-2">No more profiles!</h3>
            <p className="text-gray-600 mb-6">
              Check back later for new matches or adjust your filters
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Adjust Filters
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {currentUser && (
          <div className="flex justify-center gap-6">
            <button
              onClick={() => handleSwipe(false)}
              className="w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
            >
              <FaTimes className="text-red-500 text-2xl" />
            </button>
            <button
              onClick={() => handleSwipe(true)}
              className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
            >
              <FaHeart className="text-white text-2xl" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
