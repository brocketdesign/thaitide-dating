import { Request, Response } from 'express';
import { User } from '../models/User';
import { verifyUploadedPhoto } from '../services/photoVerification';

export const createProfile = async (req: Request, res: Response) => {
  try {
    const { 
      clerkId, email, firstName, lastName, dateOfBirth, gender, lookingFor, 
      location, languages, interests, bio, profilePhoto,
      height, weight, education, englishAbility, noChildren, wantsChildren 
    } = req.body;

    const existingUser = await User.findOne({ clerkId });
    if (existingUser) {
      return res.status(400).json({ message: 'Profile already exists' });
    }

    const user = new User({
      clerkId,
      email,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      lookingFor,
      location,
      languages: languages || [],
      interests: interests || [],
      bio,
      profilePhoto,
      photos: profilePhoto ? [profilePhoto] : [],
      height,
      weight,
      education,
      englishAbility,
      noChildren,
      wantsChildren
    });

    await user.save();
    res.status(201).json({ user });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ message: 'Error creating profile' });
  }
};

export const getProfileByClerkId = async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId }).select('-likes -dislikes');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile by clerkId error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const checkProfileExists = async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.params;
    const user = await User.findOne({ clerkId }).select('_id profilePhoto');
    
    // Profile is complete if user exists AND has a profile photo
    const exists = !!user;
    const isComplete = exists && !!user.profilePhoto;
    
    res.json({ exists, isComplete, hasProfilePhoto: !!user?.profilePhoto });
  } catch (error) {
    console.error('Check profile exists error:', error);
    res.status(500).json({ message: 'Error checking profile' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-likes -dislikes');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Don't allow updating certain fields
    delete updates.clerkId;
    delete updates.email;
    delete updates.isPremium;
    delete updates.verified;

    // Ensure location has the correct GeoJSON format
    if (updates.location && !updates.location.type) {
      updates.location = {
        type: 'Point',
        coordinates: updates.location.coordinates,
        city: updates.location.city,
        country: updates.location.country
      };
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

export const addPhoto = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { image } = req.body; // base64 image

    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }

    // Verify photo with OpenAI
    const verification = await verifyUploadedPhoto(image);

    if (!verification.verified) {
      return res.status(400).json({
        message: verification.reason || 'Photo verification failed',
        verification
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Process and save the image using the upload service
    // For now, we'll assume the image is already processed and saved
    // In production, this should integrate with the upload service
    const photoUrl = `/uploads/photo_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    user.photos.push(photoUrl);
    if (!user.profilePhoto) {
      user.profilePhoto = photoUrl;
    }

    user.photoVerificationStatus = 'verified';
    await user.save();

    res.json({ 
      user, 
      photoUrl,
      verification: {
        verified: verification.verified,
        reason: verification.reason
      }
    });
  } catch (error) {
    console.error('Add photo error:', error);
    res.status(500).json({ message: 'Error adding photo' });
  }
};

export const setProfilePhoto = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { photoUrl } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the photo exists in user's photos
    if (!user.photos.includes(photoUrl)) {
      return res.status(400).json({ message: 'Photo not found in user photos' });
    }

    user.profilePhoto = photoUrl;
    await user.save();

    res.json({ user });
  } catch (error) {
    console.error('Set profile photo error:', error);
    res.status(500).json({ message: 'Error setting profile photo' });
  }
};

export const removePhoto = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { photoUrl } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove from photos array
    user.photos = user.photos.filter(p => p !== photoUrl);

    // If removing the profile photo, set a new one or clear it
    if (user.profilePhoto === photoUrl) {
      user.profilePhoto = user.photos.length > 0 ? user.photos[0] : '';
    }

    await user.save();

    res.json({ user });
  } catch (error) {
    console.error('Remove photo error:', error);
    res.status(500).json({ message: 'Error removing photo' });
  }
};
