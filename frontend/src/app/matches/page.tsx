'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { matchApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface Match {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  location: {
    city?: string;
    country?: string;
  };
}

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const userId = 'temp-user-id'; // This would come from your user profile
      const response = await matchApi.getMatches(userId);
      setMatches(response.data.matches);
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-8">
          Your Matches
        </h1>

        {matches.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">💕</div>
            <h3 className="text-2xl font-bold mb-2">No matches yet</h3>
            <p className="text-gray-600 mb-6">
              Start swiping to find your perfect match!
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Start Discovering
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div
                key={match._id}
                onClick={() => router.push(`/messages/${match._id}`)}
                className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-shadow"
              >
                <div className="h-64 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                  {match.profilePhoto ? (
                    <img
                      src={match.profilePhoto}
                      alt={match.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">👤</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold mb-1">
                    {match.firstName} {match.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    📍 {match.location.city}, {match.location.country}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
