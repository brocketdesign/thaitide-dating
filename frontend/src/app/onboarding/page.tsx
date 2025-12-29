'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { userApi, uploadApi, getImageUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { FaHeart, FaUser, FaMapMarkerAlt, FaPen, FaCamera, FaCheck, FaArrowRight, FaArrowLeft, FaUpload, FaShieldAlt, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

const STORAGE_KEY = 'onboarding_state';

const THAI_CITIES = [
  'Bangkok', 'Chiang Mai', 'Pattaya', 'Phuket', 'Krabi', 'Hua Hin', 
  'Koh Samui', 'Chiang Rai', 'Udon Thani', 'Khon Kaen', 'Nakhon Ratchasima',
  'Hat Yai', 'Surat Thani', 'Ayutthaya', 'Sukhothai', 'Other'
];

const INTERESTS = [
  '🎬 Movies', '🎵 Music', '✈️ Travel', '🍜 Food', '💪 Fitness', 
  '📚 Reading', '🎮 Gaming', '📸 Photography', '🎨 Art', '🌿 Nature',
  '🏖️ Beach', '🛍️ Shopping', '☕ Coffee', '🍷 Wine', '🎤 Karaoke',
  '🧘 Yoga', '🏃 Running', '🎾 Sports', '🐕 Pets', '🎭 Culture'
];

const LANGUAGES = [
  'Thai', 'English', 'Chinese', 'Japanese', 'Korean', 'German', 
  'French', 'Spanish', 'Russian', 'Other'
];

type Step = 'welcome' | 'basic' | 'looking-for' | 'location' | 'about' | 'preferences' | 'photos' | 'complete';

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  lookingFor: string;
  relationshipGoal: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  bio: string;
  interests: string[];
  languages: string[];
  height: string;
  weight: string;
  education: string;
  englishAbility: string;
  noChildren: string;
  wantsChildren: string;
  profilePhoto: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoVerified, setPhotoVerified] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    lookingFor: '',
    relationshipGoal: '',
    location: {
      city: '',
      country: 'Thailand',
      coordinates: [100.5018, 13.7563] // Default: Bangkok
    },
    bio: '',
    interests: [],
    languages: ['Thai', 'English'],
    height: '',
    weight: '',
    education: '',
    englishAbility: '',
    noChildren: 'any',
    wantsChildren: 'any',
    profilePhoto: ''
  });

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const { step, data, photoVerified: savedPhotoVerified, photoPreview: savedPhotoPreview } = JSON.parse(savedState);
        setCurrentStep(step);
        setProfileData(data);
        setPhotoVerified(savedPhotoVerified);
        setPhotoPreview(savedPhotoPreview);
        toast.success('Welcome back! Continuing from where you left off.');
      } catch (error) {
        console.error('Failed to restore onboarding state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      step: currentStep,
      data: profileData,
      photoVerified,
      photoPreview
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [currentStep, profileData, photoVerified, photoPreview]);

  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

  // Check if user already has a profile
  useEffect(() => {
    async function checkExistingProfile() {
      if (!isLoaded || !user) {
        setCheckingProfile(false);
        return;
      }

      try {
        const response = await userApi.checkProfileExists(user.id);
        if (response.data.exists) {
          // User already has a profile, redirect to discover
          router.push('/discover');
          return;
        }
      } catch (error) {
        // Profile doesn't exist or API error, continue with onboarding
        console.log('No existing profile found, continuing with onboarding');
      }
      
      setCheckingProfile(false);
    }

    checkExistingProfile();
  }, [user, isLoaded, router]);

  // Pre-fill with Clerk data
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      }));
    }
  }, [user]);

  const steps: Step[] = ['welcome', 'basic', 'looking-for', 'location', 'about', 'preferences', 'photos', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex) / (steps.length - 1)) * 100;

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await userApi.createProfile({
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress || '',
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        lookingFor: profileData.lookingFor,
        location: {
          type: 'Point',
          coordinates: profileData.location.coordinates,
          city: profileData.location.city,
          country: profileData.location.country
        },
        bio: profileData.bio,
        interests: profileData.interests,
        languages: profileData.languages,
        profilePhoto: profileData.profilePhoto,
        height: profileData.height ? parseInt(profileData.height) : undefined,
        weight: profileData.weight ? parseInt(profileData.weight) : undefined,
        education: profileData.education || undefined,
        englishAbility: profileData.englishAbility || undefined,
        noChildren: profileData.noChildren,
        wantsChildren: profileData.wantsChildren
      });

      // Clear saved state from localStorage on successful completion
      localStorage.removeItem(STORAGE_KEY);
      
      toast.success('Profile created successfully! 🎉');
      setCurrentStep('complete');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const toggleLanguage = (language: string) => {
    setProfileData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be less than 5MB');
      return;
    }

    setPhotoUploading(true);
    setPhotoError(null);
    setPhotoVerified(false);

    try {
      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setPhotoPreview(base64);

      // Verify and upload
      const response = await uploadApi.verifyAndUpload(base64);
      
      if (response.data.success) {
        setProfileData(prev => ({ ...prev, profilePhoto: response.data.photoUrl }));
        setPhotoPreview(getImageUrl(response.data.photoUrl));
        setPhotoVerified(true);
        toast.success('Photo verified successfully! ✓');
      } else {
        setPhotoError(response.data.message || 'Photo verification failed');
        setPhotoPreview(null);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to upload photo';
      setPhotoError(errorMessage);
      setPhotoPreview(null);
      toast.error(errorMessage);
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoVerified(false);
    setPhotoError(null);
    setProfileData(prev => ({ ...prev, profilePhoto: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!hasClerkKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md">
          <h2 className="text-2xl font-bold mb-4">Onboarding</h2>
          <p className="text-gray-600 mb-4">
            Please configure your Clerk API keys to enable onboarding.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Progress Bar */}
      {currentStep !== 'welcome' && currentStep !== 'complete' && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-200 z-50">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen flex flex-col justify-center">
        {/* Welcome Step */}
        {currentStep === 'welcome' && (
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-8">
              <FaHeart className="text-white text-4xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              Welcome to ThaiTide! 🌊
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Let's create your profile and help you find your perfect match
            </p>
            <div className="space-y-4 text-left max-w-md mx-auto mb-8">
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <FaUser className="text-pink-500" />
                </div>
                <span className="text-gray-700">Tell us about yourself</span>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <FaHeart className="text-purple-500" />
                </div>
                <span className="text-gray-700">Share what you're looking for</span>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaCamera className="text-blue-500" />
                </div>
                <span className="text-gray-700">Add your best photos</span>
              </div>
            </div>
            <button
              onClick={nextStep}
              className="px-12 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              Get Started <FaArrowRight />
            </button>
          </div>
        )}

        {/* Basic Info Step */}
        {currentStep === 'basic' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                <FaUser className="text-pink-500 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Basic Info</h2>
                <p className="text-gray-500">Let's start with the basics</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Birthday *
                </label>
                <input
                  type="date"
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                />
                <p className="text-sm text-gray-500 mt-1">You must be 18+ to use ThaiTide</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I am a *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'male', label: '👨 Man' },
                    { value: 'female', label: '👩 Woman' },
                    { value: 'other', label: '🌈 Other' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfileData({ ...profileData, gender: option.value })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        profileData.gender === option.value
                          ? 'border-pink-500 bg-pink-50 text-pink-600'
                          : 'border-gray-200 hover:border-pink-300'
                      }`}
                    >
                      <span className="text-lg font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <FaArrowLeft /> Back
              </button>
              <button
                onClick={nextStep}
                disabled={!profileData.firstName || !profileData.lastName || !profileData.dateOfBirth || !profileData.gender}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                Continue <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* Looking For Step */}
        {currentStep === 'looking-for' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FaHeart className="text-purple-500 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Looking For</h2>
                <p className="text-gray-500">Tell us about your ideal match</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  I'm interested in *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'male', label: '👨 Men' },
                    { value: 'female', label: '👩 Women' },
                    { value: 'both', label: '💕 Both' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfileData({ ...profileData, lookingFor: option.value })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        profileData.lookingFor === option.value
                          ? 'border-purple-500 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-lg font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What are you looking for? *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'relationship', label: '💑 Serious Relationship', icon: '💍' },
                    { value: 'casual', label: '😊 Casual Dating', icon: '🌸' },
                    { value: 'friendship', label: '🤝 New Friends', icon: '👋' },
                    { value: 'unsure', label: '🤷 Not Sure Yet', icon: '❓' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfileData({ ...profileData, relationshipGoal: option.value })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        profileData.relationshipGoal === option.value
                          ? 'border-purple-500 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <span className="text-lg font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <FaArrowLeft /> Back
              </button>
              <button
                onClick={nextStep}
                disabled={!profileData.lookingFor || !profileData.relationshipGoal}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                Continue <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* Location Step */}
        {currentStep === 'location' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaMapMarkerAlt className="text-blue-500 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Your Location</h2>
                <p className="text-gray-500">Help us find matches near you</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select your city *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {THAI_CITIES.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setProfileData({ 
                        ...profileData, 
                        location: { ...profileData.location, city } 
                      })}
                      className={`p-3 rounded-xl border-2 transition-all text-sm ${
                        profileData.location.city === city
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={profileData.location.country}
                  onChange={(e) => setProfileData({ 
                    ...profileData, 
                    location: { ...profileData.location, country: e.target.value } 
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Thailand">🇹🇭 Thailand</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="Australia">🇦🇺 Australia</option>
                  <option value="Germany">🇩🇪 Germany</option>
                  <option value="France">🇫🇷 France</option>
                  <option value="Japan">🇯🇵 Japan</option>
                  <option value="South Korea">🇰🇷 South Korea</option>
                  <option value="China">🇨🇳 China</option>
                  <option value="Other">🌍 Other</option>
                </select>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl">
                <p className="text-sm text-blue-700">
                  📍 Your exact location is never shared. Only your city will be visible to other users.
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <FaArrowLeft /> Back
              </button>
              <button
                onClick={nextStep}
                disabled={!profileData.location.city}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                Continue <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* About Step */}
        {currentStep === 'about' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaPen className="text-green-500 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">About You</h2>
                <p className="text-gray-500">Let your personality shine!</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={4}
                  maxLength={500}
                  placeholder="Tell potential matches about yourself... What makes you unique? What are you passionate about?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                />
                <p className="text-sm text-gray-500 mt-1 text-right">{profileData.bio.length}/500</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Your Interests (select up to 5)
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      disabled={!profileData.interests.includes(interest) && profileData.interests.length >= 5}
                      className={`px-4 py-2 rounded-full transition-all text-sm ${
                        profileData.interests.includes(interest)
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">{profileData.interests.length}/5 selected</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Languages you speak
                </label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((language) => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => toggleLanguage(language)}
                      className={`px-4 py-2 rounded-full transition-all text-sm ${
                        profileData.languages.includes(language)
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <FaArrowLeft /> Back
              </button>
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all inline-flex items-center gap-2"
              >
                Continue <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* Preferences Step */}
        {currentStep === 'preferences' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <FaUser className="text-indigo-500 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Your Details</h2>
                <p className="text-gray-500">Help potential matches learn more about you</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Height & Weight */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    min="140"
                    max="220"
                    value={profileData.height}
                    onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                    placeholder="e.g., 170"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="150"
                    value={profileData.weight}
                    onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                    placeholder="e.g., 65"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Education
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { value: 'high-school', label: '🎓 High School' },
                    { value: 'bachelor', label: '📚 Bachelor' },
                    { value: 'master', label: '🏆 Master' },
                    { value: 'phd', label: '👨‍🎓 PhD' },
                    { value: 'other', label: '📖 Other' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfileData({ ...profileData, education: option.value })}
                      className={`p-3 rounded-xl border-2 transition-all text-sm ${
                        profileData.education === option.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* English Ability */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  English Ability
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'beginner', label: '🌱 Beginner' },
                    { value: 'intermediate', label: '📈 Intermediate' },
                    { value: 'fluent', label: '💬 Fluent' },
                    { value: 'native', label: '🇬🇧 Native' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setProfileData({ ...profileData, englishAbility: option.value })}
                      className={`p-3 rounded-xl border-2 transition-all text-sm ${
                        profileData.englishAbility === option.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                          : 'border-gray-200 hover:border-indigo-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Children */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you have children?
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'yes', label: '👨‍👩‍👧‍👦 Yes' },
                      { value: 'no', label: '✖️ No' },
                      { value: 'any', label: '❓ Prefer not to say' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProfileData({ ...profileData, noChildren: option.value })}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left font-medium ${
                          profileData.noChildren === option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Do you want children?
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'yes', label: '👶 Yes' },
                      { value: 'no', label: '✖️ No' },
                      { value: 'any', label: '❓ Prefer not to say' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setProfileData({ ...profileData, wantsChildren: option.value })}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left font-medium ${
                          profileData.wantsChildren === option.value
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <FaArrowLeft /> Back
              </button>
              <button
                onClick={nextStep}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all inline-flex items-center gap-2"
              >
                Continue <FaArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* Photos Step */}
        {currentStep === 'photos' && (
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <FaCamera className="text-orange-500 text-xl" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Add Photos</h2>
                <p className="text-gray-500">Show your best self!</p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaShieldAlt className="text-blue-500 text-xl mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800">Photo Verification</h4>
                  <p className="text-sm text-blue-700">
                    All photos are automatically verified using AI to ensure safety. 
                    We check that your photo is appropriate and shows a clear, visible face of an adult.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Upload Area */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                  id="photo-upload"
                />
                
                {!photoPreview ? (
                  <label
                    htmlFor="photo-upload"
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                      photoUploading 
                        ? 'border-orange-300 bg-orange-50' 
                        : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'
                    }`}
                  >
                    {photoUploading ? (
                      <div className="text-center">
                        <FaSpinner className="text-4xl text-orange-500 animate-spin mx-auto mb-3" />
                        <p className="text-orange-600 font-medium">Verifying your photo...</p>
                        <p className="text-sm text-orange-500 mt-1">This may take a few seconds</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FaUpload className="text-4xl text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium">Click to upload a photo</p>
                        <p className="text-sm text-gray-400 mt-1">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </label>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className={`w-64 h-64 rounded-2xl object-cover shadow-lg ${
                          photoUploading ? 'opacity-50' : ''
                        }`}
                      />
                      
                      {photoUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-2xl">
                          <div className="text-center text-white">
                            <FaSpinner className="text-3xl animate-spin mx-auto mb-2" />
                            <p className="font-medium">Verifying...</p>
                          </div>
                        </div>
                      )}
                      
                      {photoVerified && !photoUploading && (
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <FaCheck className="text-white text-lg" />
                        </div>
                      )}
                    </div>
                    
                    {photoVerified && (
                      <div className="mt-4 flex items-center gap-2 text-green-600">
                        <FaShieldAlt />
                        <span className="font-medium">Photo verified successfully!</span>
                      </div>
                    )}
                    
                    {!photoUploading && (
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="mt-4 px-4 py-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove and try another
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Error Display */}
              {photoError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FaExclamationTriangle className="text-red-500 text-xl mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800">Photo Not Accepted</h4>
                      <p className="text-sm text-red-700">{photoError}</p>
                      <p className="text-sm text-red-600 mt-2">Please try uploading a different photo.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Tips */}
              <div className="bg-orange-50 p-4 rounded-xl">
                <h4 className="font-semibold text-orange-800 mb-2">📸 Photo Requirements</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>✓ Clear, recent photo showing your face</li>
                  <li>✓ Face must be clearly visible (no sunglasses or masks)</li>
                  <li>✓ You must be 18 or older</li>
                  <li>✓ Solo photos only (no group photos)</li>
                  <li>✗ No inappropriate or explicit content</li>
                  <li>✗ No cartoons, drawings, or AI-generated images</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-2"
              >
                <FaArrowLeft /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !photoVerified}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    Complete Profile <FaCheck />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && (
          <div className="text-center animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <FaCheck className="text-white text-4xl" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              You're All Set! 🎉
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your profile is ready. Time to find your perfect match!
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="px-12 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all inline-flex items-center gap-2"
            >
              Start Discovering <FaHeart />
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
