'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { matchApi, userApi, getImageUrl } from '@/lib/api';
import { FaHeart, FaTimes, FaSlidersH, FaMapMarkerAlt, FaRulerVertical, FaWeight, FaCalendarAlt, FaSearch, FaChevronDown, FaUser, FaTh, FaSquare, FaRobot } from 'react-icons/fa';
import toast from 'react-hot-toast';
import MatchModal from '@/components/ui/MatchModal';
import { useTranslation } from '@/lib/i18n';

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
  height?: number;
  weight?: number;
  relationshipStatus?: string;
  lookingFor?: string;
  createdAt?: string;
  isAI?: boolean;
}

// Swipe Card Component
interface SwipeCardProps {
  user: User;
  onSwipe: (liked: boolean) => void;
  calculateAge: (dateOfBirth: string) => number;
  onViewProfile: () => void;
  isTop: boolean;
  translations: any;
}

function SwipeCard({ user, onSwipe, calculateAge, onViewProfile, isTop, translations }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isHorizontalDrag, setIsHorizontalDrag] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showLikeIndicator, setShowLikeIndicator] = useState(false);
  const [showNopeIndicator, setShowNopeIndicator] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);

  const SWIPE_THRESHOLD = 100;
  const ROTATION_FACTOR = 0.1;
  const HORIZONTAL_THRESHOLD = 10; // pixels before we consider it a horizontal drag

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!isTop) return;
    setIsDragging(true);
    setIsHorizontalDrag(false);
    setStartPos({ x: clientX, y: clientY });
  }, [isTop]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !isTop) return;
    
    const deltaX = clientX - startPos.x;
    const deltaY = clientY - startPos.y;
    
    // Determine if this is a horizontal drag
    if (!isHorizontalDrag) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      
      // Only consider it a drag if horizontal movement is greater than vertical
      if (absDeltaX > HORIZONTAL_THRESHOLD && absDeltaX > absDeltaY) {
        setIsHorizontalDrag(true);
      } else if (absDeltaY > absDeltaX) {
        // Vertical movement is greater, don't drag
        return;
      }
    }
    
    // Only update position if it's a horizontal drag
    if (isHorizontalDrag) {
      setPosition({ x: deltaX, y: 0 });
      
      // Show indicators based on swipe direction
      if (deltaX > 50) {
        setShowLikeIndicator(true);
        setShowNopeIndicator(false);
      } else if (deltaX < -50) {
        setShowLikeIndicator(false);
        setShowNopeIndicator(true);
      } else {
        setShowLikeIndicator(false);
        setShowNopeIndicator(false);
      }
    }
  }, [isDragging, isTop, startPos, isHorizontalDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging || !isTop) return;
    setIsDragging(false);
    setIsHorizontalDrag(false);
    
    if (position.x > SWIPE_THRESHOLD) {
      // Swipe right - like
      triggerSwipeAnimation('right');
    } else if (position.x < -SWIPE_THRESHOLD) {
      // Swipe left - nope
      triggerSwipeAnimation('left');
    } else {
      // Reset position
      setPosition({ x: 0, y: 0 });
      setShowLikeIndicator(false);
      setShowNopeIndicator(false);
    }
  }, [isDragging, isTop, position.x]);

  const triggerSwipeAnimation = (direction: 'left' | 'right') => {
    setIsExiting(true);
    setExitDirection(direction);
    setShowLikeIndicator(direction === 'right');
    setShowNopeIndicator(direction === 'left');
    
    // Animate card off screen
    const exitX = direction === 'right' ? window.innerWidth : -window.innerWidth;
    setPosition({ x: exitX, y: position.y });
    
    // Trigger the swipe action after animation
    setTimeout(() => {
      onSwipe(direction === 'right');
    }, 300);
  };

  // Button click handlers
  const handleLikeClick = () => {
    if (isExiting) return;
    triggerSwipeAnimation('right');
  };

  const handleNopeClick = () => {
    if (isExiting) return;
    triggerSwipeAnimation('left');
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    if (isDragging) handleEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  const rotation = position.x * ROTATION_FACTOR;
  const opacity = isExiting ? 0 : 1;

  // Format join date
  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    if (diffMonths < 1) return 'This month';
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    const years = Math.floor(diffMonths / 12);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };

  return (
    <div 
      className="absolute inset-0 flex flex-col"
      style={{
        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
        opacity: isTop ? opacity : 0.95,
        zIndex: isTop ? 10 : 5,
        scale: isTop ? 1 : 0.95,
      }}
    >
      {/* Card */}
      <div
        ref={cardRef}
        className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden flex-1 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${isExiting ? 'transition-all duration-300 ease-out' : isDragging ? '' : 'transition-all duration-200'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Scrollable content */}
        <div className="h-full overflow-y-auto overflow-x-hidden">
          {/* Photo with overlay info */}
          <div className="relative w-full aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
            {user.profilePhoto ? (
              <img
                src={getImageUrl(user.profilePhoto)}
                alt={user.firstName}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            ) : (
              <div className="text-6xl">👤</div>
            )}

            {/* Like Indicator */}
            <div
              className={`absolute top-8 left-8 z-20 transform -rotate-12 transition-all duration-200 ${
                showLikeIndicator ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <div className="bg-green-500/20 backdrop-blur-sm border-4 border-green-500 rounded-full p-4">
                <FaHeart className="text-green-500 text-4xl drop-shadow-lg" />
              </div>
            </div>

            {/* Nope Indicator */}
            <div
              className={`absolute top-8 right-8 z-20 transform rotate-12 transition-all duration-200 ${
                showNopeIndicator ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
              }`}
            >
              <div className="bg-red-500/20 backdrop-blur-sm border-4 border-red-500 rounded-full p-4">
                <FaTimes className="text-red-500 text-4xl drop-shadow-lg" />
              </div>
            </div>

            {/* Heart Animation Overlay */}
            {showLikeIndicator && isExiting && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <div className="animate-ping">
                  <FaHeart className="text-pink-500 text-8xl drop-shadow-lg" />
                </div>
                <FaHeart className="absolute text-pink-500 text-8xl drop-shadow-lg animate-pulse" />
              </div>
            )}

            {/* Skip Animation Overlay */}
            {showNopeIndicator && isExiting && (
              <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                <div className="animate-ping">
                  <FaTimes className="text-red-500 text-8xl drop-shadow-lg" />
                </div>
                <FaTimes className="absolute text-red-500 text-8xl drop-shadow-lg animate-pulse" />
              </div>
            )}

            {/* Gradient overlay for text readability */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

            {/* Basic info overlay on photo */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold drop-shadow-lg">
                  {user.firstName}, {calculateAge(user.dateOfBirth)}
                </h2>
                {user.isAI && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs rounded-full font-medium">
                    <FaRobot className="text-[10px]" />
                    AI
                  </span>
                )}
              </div>
              <p className="text-white/90 text-sm flex items-center gap-1 drop-shadow">
                <FaMapMarkerAlt className="text-pink-400" />
                {user.location.city}, {user.location.country}
              </p>
              {/* Scroll hint */}
              <div className="flex justify-center mt-2 animate-bounce">
                <FaChevronDown className="text-white/70" />
              </div>
            </div>
          </div>

          {/* Detailed info section - scrollable */}
          <div className="p-4 space-y-4">
            {/* Bio */}
            {user.bio && (
              <p className="text-gray-700 text-sm">{user.bio}</p>
            )}

            {/* Detail tags */}
            <div className="grid grid-cols-2 gap-2">
              {user.relationshipStatus && (
                <div className="flex items-center gap-2 bg-pink-50 px-3 py-2 rounded-lg">
                  <FaHeart className="text-pink-500 text-sm" />
                  <span className="text-sm text-gray-700 capitalize">{user.relationshipStatus}</span>
                </div>
              )}
              {user.location.city && (
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
                  <FaMapMarkerAlt className="text-blue-500 text-sm" />
                  <span className="text-sm text-gray-700">{user.location.city}</span>
                </div>
              )}
              {user.height && (
                <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
                  <FaRulerVertical className="text-green-500 text-sm" />
                  <span className="text-sm text-gray-700">{user.height} cm</span>
                </div>
              )}
              {user.weight && (
                <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg">
                  <FaWeight className="text-orange-500 text-sm" />
                  <span className="text-sm text-gray-700">{user.weight} kg</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
                <FaCalendarAlt className="text-purple-500 text-sm" />
                <span className="text-sm text-gray-700">{translations.discover.card.joined} {formatJoinDate(user.createdAt)}</span>
              </div>
              {user.lookingFor && (
                <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                  <FaSearch className="text-red-500 text-sm" />
                  <span className="text-sm text-gray-700 capitalize">{user.lookingFor}</span>
                </div>
              )}
            </div>

            {/* Interests */}
            {user.interests.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{translations.profile.interests}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {user.interests.map((interest, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* View Full Profile Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile();
              }}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
            >
              <FaUser />
              {translations.common.viewProfile}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card');
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [filters, setFilters] = useState({
    maxDistance: 0, // 0 means any distance
    minAge: 18,
    maxAge: 50,
    minHeight: 150,
    maxHeight: 200,
    minWeight: 40,
    maxWeight: 100,
    education: 'any',
    englishAbility: 'any',
    noChildren: 'any',
    wantsChildren: 'any',
    verifiedPhotosOnly: false
  });
  
  // Track seen user IDs to prevent duplicates
  const [seenUserIds, setSeenUserIds] = useState<Set<string>>(new Set());
  
  // Track liked and passed users for grid view visual indicators
  const [likedUserIds, setLikedUserIds] = useState<Set<string>>(new Set());
  const [passedUserIds, setPassedUserIds] = useState<Set<string>>(new Set());
  
  // Match modal state
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<User | null>(null);
  const [matchId, setMatchId] = useState<string>('');

  // Load view mode preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViewMode = localStorage.getItem('discoverViewMode') as 'card' | 'grid' | null;
      if (savedViewMode) {
        setViewMode(savedViewMode);
      }
    }
  }, []);

  // Save view mode preference to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('discoverViewMode', viewMode);
    }
  }, [viewMode]);

  // Check if user has completed profile
  useEffect(() => {
    async function checkProfile() {
      if (!isLoaded || !clerkUser) return;

      try {
        const response = await userApi.checkProfileExists(clerkUser.id);
        if (!response.data.exists) {
          router.push('/onboarding');
          return;
        }
        
        // Get the user's database ID
        const profileResponse = await userApi.getProfileByClerkId(clerkUser.id);
        setDbUserId(profileResponse.data.user._id);
        setCurrentUserProfile(profileResponse.data.user);
        setProfileChecked(true);
      } catch (error) {
        console.error('Profile check error:', error);
        router.push('/onboarding');
      }
    }

    checkProfile();
  }, [clerkUser, isLoaded, router]);

  useEffect(() => {
    if (profileChecked && dbUserId) {
      loadPotentialMatches(true);
    }
  }, [profileChecked, dbUserId]);

  const loadPotentialMatches = async (resetList = false) => {
    if (!dbUserId) return;
    
    try {
      setLoading(true);
      const response = await matchApi.getPotentialMatches(dbUserId, filters);
      const newUsers: User[] = response.data.users;
      
      if (resetList) {
        // Reset everything when filters change
        const uniqueNewUsers = newUsers.filter(user => !seenUserIds.has(user._id));
        setUsers(uniqueNewUsers);
        setCurrentIndex(0);
        setSeenUserIds(new Set());
      } else {
        // Append new users, filtering out duplicates and already seen users
        setUsers(prevUsers => {
          const existingIds = new Set(prevUsers.map(u => u._id));
          const uniqueNewUsers = newUsers.filter(
            user => !existingIds.has(user._id) && !seenUserIds.has(user._id)
          );
          return [...prevUsers, ...uniqueNewUsers];
        });
      }
    } catch (error) {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (liked: boolean) => {
    if (currentIndex >= users.length || !dbUserId) return;

    const currentUser = users[currentIndex];
    
    // Mark this user as seen to prevent duplicates
    setSeenUserIds(prev => new Set(prev).add(currentUser._id));

    try {
      if (liked) {
        const response = await matchApi.swipeRight(dbUserId, currentUser._id);
        if (response.data.matched) {
          // Show the match modal instead of a simple toast
          setMatchedUser(currentUser);
          setMatchId(response.data.match._id);
          setShowMatchModal(true);
        }
      } else {
        await matchApi.swipeLeft(dbUserId, currentUser._id);
      }

      // Move to next user
      setCurrentIndex(prev => prev + 1);

      // Load more users if running low
      if (currentIndex >= users.length - 3) {
        loadPotentialMatches(false);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to process swipe');
      }
    }
  };

  // Handle swipe action in grid mode
  const handleGridSwipe = async (userId: string, liked: boolean) => {
    if (!dbUserId) return;
    
    // Check if already acted on this user
    if (likedUserIds.has(userId) || passedUserIds.has(userId)) return;

    const targetUser = users.find(u => u._id === userId);
    if (!targetUser) return;

    // Mark this user as seen
    setSeenUserIds(prev => new Set(prev).add(userId));

    try {
      if (liked) {
        const response = await matchApi.swipeRight(dbUserId, userId);
        // Mark as liked visually
        setLikedUserIds(prev => new Set(prev).add(userId));
        if (response.data.matched) {
          setMatchedUser(targetUser);
          setMatchId(response.data.match._id);
          setShowMatchModal(true);
        }
      } else {
        await matchApi.swipeLeft(dbUserId, userId);
        // Mark as passed visually
        setPassedUserIds(prev => new Set(prev).add(userId));
      }

      // Load more users if running low on unacted cards
      const actedCount = likedUserIds.size + passedUserIds.size + 1;
      if (users.length - actedCount <= 4) {
        loadPotentialMatches(false);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to process action');
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

  if (!isLoaded || !profileChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
            {t.discover.title}
          </h1>
          <div className="flex items-center gap-2">
            {/* Layout Toggle */}
            <div className="flex bg-white rounded-full shadow-lg p-1">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'card'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'text-gray-500 hover:text-purple-600'
                }`}
                title={t.discover.layout?.card || 'Card View'}
              >
                <FaSquare className="text-sm" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                    : 'text-gray-500 hover:text-purple-600'
                }`}
                title={t.discover.layout?.grid || 'Grid View'}
              >
                <FaTh className="text-sm" />
              </button>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
            >
              <FaSlidersH className="text-purple-600" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg">{t.discover.filters.title}</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Distance */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {t.discover.filters.distance}: {filters.maxDistance === 0 ? t.discover.filters.anyLocation : `${filters.maxDistance} ${t.discover.filters.km}`}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={filters.maxDistance === 0}
                      onChange={(e) => setFilters({ ...filters, maxDistance: e.target.checked ? 0 : 50 })}
                      className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                    />
                    {t.discover.filters.anyLocation}
                  </label>
                </div>
                {filters.maxDistance !== 0 && (
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={filters.maxDistance}
                    onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
                    className="w-full"
                  />
                )}
              </div>

              {/* Age Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.discover.filters.ageRange}: {filters.minAge} - {filters.maxAge}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={filters.minAge}
                      onChange={(e) => setFilters({ ...filters, minAge: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Min age"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="18"
                      max="100"
                      value={filters.maxAge}
                      onChange={(e) => setFilters({ ...filters, maxAge: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Max age"
                    />
                  </div>
                </div>
              </div>

              {/* Verified Photos Only */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Verified Photos Only</label>
                <button
                  onClick={() => setFilters({ ...filters, verifiedPhotosOnly: !filters.verifiedPhotosOnly })}
                  className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                    filters.verifiedPhotosOnly ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      filters.verifiedPhotosOnly ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Height Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height: {filters.minHeight} - {filters.maxHeight} cm
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min="140"
                      max="220"
                      value={filters.minHeight}
                      onChange={(e) => setFilters({ ...filters, minHeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Min"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="140"
                      max="220"
                      value={filters.maxHeight}
                      onChange={(e) => setFilters({ ...filters, maxHeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* Weight Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight: {filters.minWeight} - {filters.maxWeight} kg
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      min="30"
                      max="150"
                      value={filters.minWeight}
                      onChange={(e) => setFilters({ ...filters, minWeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Min"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="30"
                      max="150"
                      value={filters.maxWeight}
                      onChange={(e) => setFilters({ ...filters, maxWeight: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                <select
                  value={filters.education}
                  onChange={(e) => setFilters({ ...filters, education: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="any">Any</option>
                  <option value="high-school">High School</option>
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                  <option value="phd">PhD</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* English Ability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">English Ability</label>
                <select
                  value={filters.englishAbility}
                  onChange={(e) => setFilters({ ...filters, englishAbility: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="any">Any</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="fluent">Fluent</option>
                  <option value="native">Native</option>
                </select>
              </div>

              {/* Children Preferences */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Has Children</label>
                  <select
                    value={filters.noChildren}
                    onChange={(e) => setFilters({ ...filters, noChildren: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="any">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Wants Children</label>
                  <select
                    value={filters.wantsChildren}
                    onChange={(e) => setFilters({ ...filters, wantsChildren: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="any">Any</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => loadPotentialMatches(true)}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow mt-6"
              >
                {t.common.apply}
              </button>
            </div>
          </div>
        )}

        {/* Card View Mode */}
        {viewMode === 'card' && (
          <div className="relative h-[580px] mb-4 overflow-hidden">
            {/* Next card (behind) */}
            {users[currentIndex + 1] && (
              <SwipeCard
                key={users[currentIndex + 1]._id}
                user={users[currentIndex + 1]}
                onSwipe={() => {}}
                calculateAge={calculateAge}
                onViewProfile={() => {}}
                isTop={false}
                translations={t}
              />
            )}
            {/* Current card (top) */}
            {users[currentIndex] && (
              <SwipeCard
                key={users[currentIndex]._id}
                user={users[currentIndex]}
                onSwipe={handleSwipe}
                calculateAge={calculateAge}
                onViewProfile={() => router.push(`/profile/${users[currentIndex]._id}`)}
                isTop={true}
                translations={t}
              />
            )}

            {/* Empty State - No more profiles */}
            {currentIndex >= users.length && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-2">{t.discover.noMoreProfiles}</h3>
                  <p className="text-gray-600 mb-6">
                    {t.discover.checkBackLater}
                  </p>
                  <button
                    onClick={() => setShowFilters(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    {t.discover.adjustFilters}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Grid View Mode */}
        {viewMode === 'grid' && (
          <div className="mb-4">
            {users.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {users.slice(currentIndex).map((user) => {
                  const isLiked = likedUserIds.has(user._id);
                  const isPassed = passedUserIds.has(user._id);
                  const isActedOn = isLiked || isPassed;
                  
                  return (
                    <div
                      key={user._id}
                      className={`bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all ${
                        isPassed ? 'grayscale' : ''
                      }`}
                      onClick={() => router.push(`/profile/${user._id}`)}
                    >
                      {/* Photo */}
                      <div className="relative aspect-[3/4] bg-gradient-to-br from-pink-100 to-purple-100">
                        {user.profilePhoto ? (
                          <img
                            src={getImageUrl(user.profilePhoto)}
                            alt={user.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                        )}
                        
                        {/* Liked overlay with heart */}
                        {isLiked && (
                          <div className="absolute inset-0 bg-pink-500/30 flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-4">
                              <FaHeart className="text-pink-500 text-3xl" />
                            </div>
                          </div>
                        )}
                        
                        {/* Passed overlay with X */}
                        {isPassed && (
                          <div className="absolute inset-0 bg-gray-500/30 flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-4">
                              <FaTimes className="text-gray-600 text-3xl" />
                            </div>
                          </div>
                        )}
                        
                        {/* Gradient overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent"></div>
                        {/* Info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                          <div className="flex items-center gap-1">
                            <h3 className="font-bold text-sm truncate">
                              {user.firstName}, {calculateAge(user.dateOfBirth)}
                            </h3>
                            {user.isAI && (
                              <span className="flex items-center gap-0.5 px-1 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[8px] rounded-full font-medium">
                                <FaRobot className="text-[6px]" />
                                AI
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/80 flex items-center gap-1 truncate">
                            <FaMapMarkerAlt className="text-pink-400 flex-shrink-0" />
                            {user.location.city}
                          </p>
                        </div>
                      </div>
                      {/* Action buttons - hide if already acted on */}
                      {!isActedOn && (
                        <div className="flex justify-center gap-2 p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGridSwipe(user._id, false);
                            }}
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                          >
                            <FaTimes className="text-red-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGridSwipe(user._id, true);
                            }}
                            className="w-10 h-10 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center hover:shadow-lg transition-shadow"
                          >
                            <FaHeart className="text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold mb-2">{t.discover.noMoreProfiles}</h3>
                <p className="text-gray-600 mb-6">
                  {t.discover.checkBackLater}
                </p>
                <button
                  onClick={() => setShowFilters(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  {t.discover.adjustFilters}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Match Modal */}
      {currentUserProfile && matchedUser && (
        <MatchModal
          isOpen={showMatchModal}
          onClose={() => setShowMatchModal(false)}
          currentUser={{
            firstName: currentUserProfile.firstName,
            profilePhoto: currentUserProfile.profilePhoto,
          }}
          matchedUser={{
            _id: matchedUser._id,
            firstName: matchedUser.firstName,
            profilePhoto: matchedUser.profilePhoto,
          }}
          matchId={matchId}
        />
      )}
    </div>
  );
}
