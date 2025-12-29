'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { matchApi, userApi, getImageUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { FaHeart, FaEye, FaUsers, FaLock, FaCrown } from 'react-icons/fa';
import { useTranslation } from '@/lib/i18n';

interface Profile {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  location: {
    city?: string;
    country?: string;
  };
  isBlurred?: boolean;
  matchId?: string; // Match ID for navigating to messages
}

type TabType = 'matches' | 'liked' | 'likes' | 'visitors';

export default function MatchesPage() {
  const router = useRouter();
  const { user: clerkUser, isLoaded } = useUser();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('matches');
  const [matches, setMatches] = useState<Profile[]>([]);
  const [likedProfiles, setLikedProfiles] = useState<Profile[]>([]);
  const [likesReceived, setLikesReceived] = useState<Profile[]>([]);
  const [visitors, setVisitors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [visitorsCount, setVisitorsCount] = useState(0);

  useEffect(() => {
    if (isLoaded && clerkUser) {
      initUser();
    }
  }, [isLoaded, clerkUser]);

  useEffect(() => {
    if (dbUserId) {
      loadTabData(activeTab);
    }
  }, [activeTab, dbUserId]);

  const initUser = async () => {
    try {
      const profileResponse = await userApi.getProfileByClerkId(clerkUser!.id);
      setDbUserId(profileResponse.data.user._id);
      setIsPremium(profileResponse.data.user.isPremium);
    } catch (error) {
      toast.error('Failed to load user profile');
    }
  };

  const loadTabData = async (tab: TabType) => {
    if (!dbUserId) return;
    
    try {
      setLoading(true);
      
      switch (tab) {
        case 'matches':
          const matchesResponse = await matchApi.getMatches(dbUserId);
          setMatches(matchesResponse.data.matches || []);
          break;
        case 'liked':
          const likedResponse = await matchApi.getLikedProfiles(dbUserId);
          setLikedProfiles(likedResponse.data.profiles || []);
          break;
        case 'likes':
          const likesResponse = await matchApi.getWhoLikedMe(dbUserId);
          setLikesReceived(likesResponse.data.profiles || []);
          setLikesCount(likesResponse.data.count || 0);
          break;
        case 'visitors':
          const visitorsResponse = await matchApi.getProfileVisitors(dbUserId);
          setVisitors(visitorsResponse.data.profiles || []);
          setVisitorsCount(visitorsResponse.data.count || 0);
          break;
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (profile: Profile) => {
    if (profile.isBlurred) {
      router.push('/premium');
      return;
    }
    
    if (activeTab === 'matches' && profile.matchId) {
      router.push(`/messages/${profile.matchId}`);
    } else {
      router.push(`/profile/${profile._id}`);
    }
  };

  const tabs = [
    { id: 'matches' as TabType, label: t.matches.tabs.matches, icon: FaUsers, count: matches.length },
    { id: 'liked' as TabType, label: t.matches.tabs.liked, icon: FaHeart, count: likedProfiles.length },
    { id: 'likes' as TabType, label: t.matches.tabs.likesMe, icon: FaHeart, count: likesCount, premium: true },
    { id: 'visitors' as TabType, label: t.matches.tabs.visitors, icon: FaEye, count: visitorsCount, premium: true },
  ];

  const getCurrentProfiles = () => {
    switch (activeTab) {
      case 'matches': return matches;
      case 'liked': return likedProfiles;
      case 'likes': return likesReceived;
      case 'visitors': return visitors;
      default: return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'matches': return { emoji: t.matches.empty.matches.emoji, title: t.matches.empty.matches.title, message: t.matches.empty.matches.message };
      case 'liked': return { emoji: t.matches.empty.liked.emoji, title: t.matches.empty.liked.title, message: t.matches.empty.liked.message };
      case 'likes': return { emoji: t.matches.empty.likes.emoji, title: t.matches.empty.likes.title, message: t.matches.empty.likes.message };
      case 'visitors': return { emoji: t.matches.empty.visitors.emoji, title: t.matches.empty.visitors.title, message: t.matches.empty.visitors.message };
      default: return { emoji: '💕', title: '', message: '' };
    }
  };

  if (!isLoaded || !clerkUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  const currentProfiles = getCurrentProfiles();
  const emptyState = getEmptyMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-6">
          {t.matches.title}
        </h1>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all flex-1 min-w-[120px] justify-center ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className={activeTab === tab.id ? 'text-white' : 'text-pink-500'} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-pink-100 text-pink-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.premium && !isPremium && (
                  <FaCrown className="text-yellow-400 text-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Premium banner for locked features */}
        {(activeTab === 'likes' || activeTab === 'visitors') && !isPremium && currentProfiles.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <FaCrown className="text-4xl" />
              <div>
                <h3 className="font-bold text-lg">{t.matches.premiumBanner.title}</h3>
                <p className="text-white/90">{t.matches.premiumBanner.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/premium')}
              className="bg-white text-orange-500 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition-colors"
            >
              {t.matches.premiumBanner.upgradeNow}
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">{t.common.loading}</p>
            </div>
          </div>
        ) : currentProfiles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">{emptyState.emoji}</div>
            <h3 className="text-2xl font-bold mb-2">{emptyState.title}</h3>
            <p className="text-gray-600 mb-6">{emptyState.message}</p>
            <button
              onClick={() => router.push('/discover')}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              {t.nav.discover}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentProfiles.map((profile) => (
              <div
                key={profile._id}
                onClick={() => handleProfileClick(profile)}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 relative ${
                  profile.isBlurred ? 'group' : ''
                }`}
              >
                <div className="aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center relative">
                  {profile.profilePhoto ? (
                    <img
                      src={getImageUrl(profile.profilePhoto)}
                      alt={profile.firstName}
                      className={`w-full h-full object-cover ${profile.isBlurred ? 'blur-lg' : ''}`}
                    />
                  ) : (
                    <div className={`text-6xl ${profile.isBlurred ? 'blur-lg' : ''}`}>👤</div>
                  )}
                  
                  {profile.isBlurred && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="text-center text-white">
                        <FaLock className="text-3xl mx-auto mb-2" />
                        <p className="text-sm font-medium">Premium Only</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-lg font-bold truncate">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  {profile.location && (
                    <p className="text-gray-600 text-sm truncate">
                      📍 {profile.location.city}{profile.location.country && `, ${profile.location.country}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
