import { Request, Response } from 'express';
import { User } from '../models/User';
import { verifyPhoto } from '../services/photoVerification';

export const createProfile = async (req: Request, res: Response) => {
  try {
    const { clerkId, email, firstName, lastName, dateOfBirth, gender, lookingFor, location, languages, interests, bio } = req.body;

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
      bio
    });

    await user.save();
    res.status(201).json({ user });
  } catch (error) {
    console.error('Create profile error:', error);
    res.status(500).json({ message: 'Error creating profile' });
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

export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { photoUrl } = req.body;

    // Verify photo with OpenAI
    const verification = await verifyPhoto(photoUrl);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.photos.push(photoUrl);
    if (!user.profilePhoto) {
      user.profilePhoto = photoUrl;
    }

    user.photoVerificationStatus = verification.verified ? 'verified' : 'rejected';
    await user.save();

    res.json({ 
      user, 
      verification: {
        verified: verification.verified,
        reason: verification.reason
      }
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ message: 'Error uploading photo' });
  }
};
