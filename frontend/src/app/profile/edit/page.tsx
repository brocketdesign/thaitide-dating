'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userApi, uploadApi, getImageUrl } from '@/lib/api';
import { FaArrowLeft, FaTrash, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';

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
    coordinates: [number, number];
    city?: string;
    country?: string;
  };
  languages: string[];
  interests: string[];
}

const AVAILABLE_INTERESTS = [
  'Travel', 'Music', 'Movies', 'Reading', 'Cooking', 'Fitness', 'Gaming',
  'Photography', 'Art', 'Dancing', 'Yoga', 'Hiking', 'Beach', 'Coffee',
  'Wine', 'Food', 'Sports', 'Nature', 'Fashion', 'Technology'
];

const AVAILABLE_LANGUAGES = [
  'English', 'Thai', 'Chinese', 'Japanese', 'Korean', 'Spanish', 'French',
  'German', 'Russian', 'Vietnamese', 'Indonesian', 'Hindi', 'Arabic'
];

export default function EditProfilePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [formData, setFormData] = useState({
    username: '',
    dateOfBirth: '',
    gender: '',
    lookingFor: '',
    bio: '',
    languages: [] as string[],
    interests: [] as string[],
    location: {
      coordinates: [0, 0] as [number, number],
      city: '',
      country: ''
    },
    profilePhoto: '',
    photos: [] as string[]
  });

  const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

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
        const profile: UserProfile = response.data.user;
        
        setUserId(profile._id);
        setFormData({
          username: profile.username || '',
          dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
          gender: profile.gender || '',
          lookingFor: profile.lookingFor || '',
          bio: profile.bio || '',
          languages: profile.languages || [],
          interests: profile.interests || [],
          location: {
            coordinates: profile.location?.coordinates || [0, 0],
            city: profile.location?.city || '',
            country: profile.location?.country || ''
          },
          profilePhoto: profile.profilePhoto || '',
          photos: profile.photos || []
        });
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        if (error.response?.status === 404) {
          router.push('/onboarding');
        } else {
          toast.error('Failed to load profile');
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [clerkUser, isLoaded, router, hasClerkKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await userApi.updateProfile(userId, formData);
      toast.success('Profile updated successfully!');
      router.push('/profile');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        toast.loading('Uploading and verifying photo...', { id: 'upload' });
        
        try {
          const response = await uploadApi.verifyAndUpload(base64);
          const photoUrl = response.data.photoUrl;
          
          // Add to photos array
          const newPhotos = [...formData.photos, photoUrl];
          
          // Set as profile photo if it's the first one
          const newProfilePhoto = formData.profilePhoto || photoUrl;
          
          setFormData({
            ...formData,
            photos: newPhotos,
            profilePhoto: newProfilePhoto
          });
          
          toast.success('Photo uploaded and verified!', { id: 'upload' });
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Failed to upload photo', { id: 'upload' });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to process image');
    }
  };

  const handleRemovePhoto = (photoUrl: string) => {
    const newPhotos = formData.photos.filter(p => p !== photoUrl);
    const newProfilePhoto = formData.profilePhoto === photoUrl 
      ? (newPhotos[0] || '') 
      : formData.profilePhoto;
    
    setFormData({
      ...formData,
      photos: newPhotos,
      profilePhoto: newProfilePhoto
    });
  };

  const handleSetProfilePhoto = (photoUrl: string) => {
    setFormData({
      ...formData,
      profilePhoto: photoUrl
    });
    toast.success('Profile photo updated!');
  };

  const toggleInterest = (interest: string) => {
    const newInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];
    setFormData({ ...formData, interests: newInterests });
  };

  const toggleLanguage = (language: string) => {
    const newLanguages = formData.languages.includes(language)
      ? formData.languages.filter(l => l !== language)
      : [...formData.languages, language];
    setFormData({ ...formData, languages: newLanguages });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pt-16 md:pt-20 pb-20 md:pb-4">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/profile"
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <FaArrowLeft className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photos Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Photos</h2>
            <p className="text-sm text-gray-500 mb-4">Add up to 6 photos. Tap a photo to set it as your profile picture.</p>
            
            {/* Photo Rules */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="text-amber-500 text-xl mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">Photo Rules</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• All photos must be clearly yourself only and good quality</li>
                    <li>• The photos must not be sexual/nude</li>
                    <li>• No children allowed in any photos</li>
                    <li>• Uploading photos of celebrities, fake photos or sex photos will result in an account ban</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={getImageUrl(photo)}
                    alt={`Photo ${index + 1}`}
                    className={`w-full h-full object-cover rounded-xl cursor-pointer transition-all ${
                      photo === formData.profilePhoto ? 'ring-4 ring-pink-500' : ''
                    }`}
                    onClick={() => handleSetProfilePhoto(photo)}
                  />
                  {photo === formData.profilePhoto && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-pink-500 text-white text-xs rounded-full">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaTrash className="text-xs" />
                  </button>
                </div>
              ))}
              
              {formData.photos.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-pink-500 hover:text-pink-500 transition-colors"
                >
                  <FaPlus className="text-2xl mb-1" />
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Info</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Looking For
                  </label>
                  <select
                    name="lookingFor"
                    value={formData.lookingFor}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">About You</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                placeholder="Tell others about yourself..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">{formData.bio.length}/500</p>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Location</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, city: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.location.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, country: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Interests</h2>
            <p className="text-sm text-gray-500 mb-4">Select your interests to help find better matches.</p>
            
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    formData.interests.includes(interest)
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Languages</h2>
            <p className="text-sm text-gray-500 mb-4">Select the languages you speak.</p>
            
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LANGUAGES.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => toggleLanguage(language)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    formData.languages.includes(language)
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <Link
              href="/profile"
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold text-center hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
