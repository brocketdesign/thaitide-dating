import { Request, Response } from 'express';
import { User } from '../models/User';
import { Match } from '../models/Match';

export const swipeRight = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { targetUserId } = req.body;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has premium for unlimited likes
    if (!user.isPremium && user.likes.length >= 10) {
      return res.status(403).json({ message: 'Like limit reached. Upgrade to premium for unlimited likes.' });
    }

    // Add to likes
    if (!user.likes.some(id => id.toString() === targetUser._id.toString())) {
      user.likes.push(targetUser._id as any);
      await user.save();
    }

    // Check if it's a match (mutual like)
    if (targetUser.likes.some(id => id.toString() === user._id.toString())) {
      // Create match
      const match = new Match({
        user1: user._id,
        user2: targetUser._id
      });
      await match.save();

      // Add to matches
      user.matches.push(targetUser._id as any);
      targetUser.matches.push(user._id as any);
      await user.save();
      await targetUser.save();

      return res.json({ matched: true, match });
    }

    res.json({ matched: false });
  } catch (error) {
    console.error('Swipe right error:', error);
    res.status(500).json({ message: 'Error processing like' });
  }
};

export const swipeLeft = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { targetUserId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add to dislikes
    if (!user.dislikes.some(id => id.toString() === targetUserId)) {
      user.dislikes.push(targetUserId as any);
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Swipe left error:', error);
    res.status(500).json({ message: 'Error processing dislike' });
  }
};

export const getMatches = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('matches', '-likes -dislikes');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ matches: user.matches });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Error fetching matches' });
  }
};

export const getPotentialMatches = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { maxDistance = 50, minAge, maxAge } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Build query to exclude already liked/disliked users
    const excludedIds = [...user.likes, ...user.dislikes, ...user.matches, user._id];

    const query: any = {
      _id: { $nin: excludedIds },
      gender: user.lookingFor === 'both' ? { $in: ['male', 'female', 'other'] } : user.lookingFor
    };

    // Age filter
    if (minAge || maxAge) {
      const now = new Date();
      if (maxAge) {
        const minDate = new Date(now.getFullYear() - Number(maxAge), now.getMonth(), now.getDate());
        query.dateOfBirth = { ...query.dateOfBirth, $gte: minDate };
      }
      if (minAge) {
        const maxDate = new Date(now.getFullYear() - Number(minAge), now.getMonth(), now.getDate());
        query.dateOfBirth = { ...query.dateOfBirth, $lte: maxDate };
      }
    }

    // Geolocation search
    if (user.location && user.location.coordinates) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: user.location.coordinates
          },
          $maxDistance: Number(maxDistance) * 1000 // Convert km to meters
        }
      };
    }

    let potentialMatches = await User.find(query)
      .limit(20)
      .select('-likes -dislikes -matches');

    // Boost premium users with higher visibility
    potentialMatches = potentialMatches.sort((a, b) => b.visibility - a.visibility);

    res.json({ users: potentialMatches });
  } catch (error) {
    console.error('Get potential matches error:', error);
    res.status(500).json({ message: 'Error fetching potential matches' });
  }
};
