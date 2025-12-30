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
      // Check if a match/conversation already exists between these users
      let match = await Match.findOne({
        $or: [
          { user1: user._id, user2: targetUser._id },
          { user1: targetUser._id, user2: user._id }
        ]
      } as any);

      // Only create a new match if one doesn't exist
      if (!match) {
        match = new Match({
          user1: user._id,
          user2: targetUser._id
        });
        await match.save();
      }

      // Add to matches arrays if not already there
      if (!user.matches.some(id => id.toString() === targetUser._id.toString())) {
        user.matches.push(targetUser._id as any);
        await user.save();
      }
      if (!targetUser.matches.some(id => id.toString() === user._id.toString())) {
        targetUser.matches.push(user._id as any);
        await targetUser.save();
      }

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

    // Remove from likes if previously liked (unlike functionality)
    const likeIndex = user.likes.findIndex(id => id.toString() === targetUserId);
    if (likeIndex > -1) {
      user.likes.splice(likeIndex, 1);
    }

    // Add to dislikes
    if (!user.dislikes.some(id => id.toString() === targetUserId)) {
      user.dislikes.push(targetUserId as any);
      await user.save();
    }

    res.json({ success: true, wasUnliked: likeIndex > -1 });
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

    // Get the match IDs for each matched user
    const matchesWithMatchId = await Promise.all(
      (user.matches as any[]).map(async (matchedUser: any) => {
        const match = await Match.findOne({
          $or: [
            { user1: userId, user2: matchedUser._id },
            { user1: matchedUser._id, user2: userId }
          ]
        } as any);

        return {
          ...matchedUser.toObject(),
          matchId: match?._id
        };
      })
    );

    res.json({ matches: matchesWithMatchId });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Error fetching matches' });
  }
};

export const getPotentialMatches = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { 
      maxDistance = 200, 
      minAge, 
      maxAge,
      minHeight,
      maxHeight,
      minWeight,
      maxWeight,
      education,
      englishAbility,
      noChildren,
      wantsChildren,
      verifiedPhotosOnly = false
    } = req.query;

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

    // Height filter (in cm) - only apply if user has height set, or include users without height
    if (minHeight || maxHeight) {
      const heightConditions: any[] = [{ height: { $exists: false } }, { height: null }];
      if (minHeight && maxHeight) {
        heightConditions.push({ height: { $gte: Number(minHeight), $lte: Number(maxHeight) } });
      } else if (minHeight) {
        heightConditions.push({ height: { $gte: Number(minHeight) } });
      } else if (maxHeight) {
        heightConditions.push({ height: { $lte: Number(maxHeight) } });
      }
      query.$and = query.$and || [];
      query.$and.push({ $or: heightConditions });
    }

    // Weight filter (in kg) - only apply if user has weight set, or include users without weight
    if (minWeight || maxWeight) {
      const weightConditions: any[] = [{ weight: { $exists: false } }, { weight: null }];
      if (minWeight && maxWeight) {
        weightConditions.push({ weight: { $gte: Number(minWeight), $lte: Number(maxWeight) } });
      } else if (minWeight) {
        weightConditions.push({ weight: { $gte: Number(minWeight) } });
      } else if (maxWeight) {
        weightConditions.push({ weight: { $lte: Number(maxWeight) } });
      }
      query.$and = query.$and || [];
      query.$and.push({ $or: weightConditions });
    }

    // Education filter
    if (education && education !== 'any') {
      query.education = education;
    }

    // English ability filter
    if (englishAbility && englishAbility !== 'any') {
      query.englishAbility = englishAbility;
    }

    // Children preferences filter
    if (noChildren && noChildren !== 'any') {
      query.noChildren = noChildren;
    }

    if (wantsChildren && wantsChildren !== 'any') {
      query.wantsChildren = wantsChildren;
    }

    // Verified photos only filter
    if (verifiedPhotosOnly === 'true') {
      query.photoVerificationStatus = 'verified';
    }

    // Geolocation search - only apply if maxDistance > 0 (0 means any distance)
    if (user.location && user.location.coordinates && Number(maxDistance) > 0) {
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

// Get or create a conversation/match between two users (for messaging, separate from dating matches)
export const getOrCreateConversation = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { targetUserId } = req.body;

    const user = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if match already exists (check both directions to avoid duplicates)
    let match = await Match.findOne({
      $or: [
        { user1: userId, user2: targetUserId },
        { user1: targetUserId, user2: userId }
      ]
    } as any);

    if (match) {
      return res.json({ match, isNew: false });
    }

    // Create new match for messaging
    // No strict validation needed - users can message if they both exist
    match = new Match({
      user1: user._id,
      user2: targetUser._id
    });
    await match.save();

    res.json({ match, isNew: true });
  } catch (error) {
    console.error('Get or create conversation error:', error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
};

// Find match between two users
export const findMatchBetweenUsers = async (req: Request, res: Response) => {
  try {
    const { userId, targetUserId } = req.params;

    const match = await Match.findOne({
      $or: [
        { user1: userId, user2: targetUserId },
        { user1: targetUserId, user2: userId }
      ]
    } as any);

    if (match) {
      return res.json({ match, exists: true });
    }

    res.json({ match: null, exists: false });
  } catch (error) {
    console.error('Find match error:', error);
    res.status(500).json({ message: 'Error finding match' });
  }
};

// Get profiles the user has liked
export const getLikedProfiles = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('likes', 'username profilePhoto location dateOfBirth');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ profiles: user.likes });
  } catch (error) {
    console.error('Get liked profiles error:', error);
    res.status(500).json({ message: 'Error fetching liked profiles' });
  }
};

// Get profiles who liked the user
export const getWhoLikedMe = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find users who have this user in their likes array
    const usersWhoLikedMe = await User.find({
      likes: userId,
      _id: { $nin: user.matches } // Exclude already matched users
    } as any).select('username profilePhoto location dateOfBirth isPremium');

    // If user is not premium, blur the results (only show count or limited info)
    if (!user.isPremium) {
      res.json({ 
        profiles: usersWhoLikedMe.map(u => ({
          _id: u._id,
          username: '???',
          profilePhoto: u.profilePhoto,
          location: u.location,
          isBlurred: true
        })),
        count: usersWhoLikedMe.length,
        isPremiumFeature: true
      });
    } else {
      res.json({ profiles: usersWhoLikedMe, count: usersWhoLikedMe.length });
    }
  } catch (error) {
    console.error('Get who liked me error:', error);
    res.status(500).json({ message: 'Error fetching profiles who liked you' });
  }
};

// Get profile visitors
export const getProfileVisitors = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get unique visitor IDs, sorted by most recent visit
    const visitorIds = user.profileVisitors
      .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
      .map(v => v.visitorId);

    // Remove duplicates keeping most recent
    const uniqueVisitorIds = [...new Set(visitorIds.map(id => id.toString()))];

    const visitors = await User.find({
      _id: { $in: uniqueVisitorIds }
    }).select('username profilePhoto location dateOfBirth');

    // If user is not premium, blur the results
    if (!user.isPremium) {
      res.json({ 
        profiles: visitors.map(v => ({
          _id: v._id,
          username: '???',
          profilePhoto: v.profilePhoto,
          location: v.location,
          isBlurred: true
        })),
        count: visitors.length,
        isPremiumFeature: true
      });
    } else {
      res.json({ profiles: visitors, count: visitors.length });
    }
  } catch (error) {
    console.error('Get profile visitors error:', error);
    res.status(500).json({ message: 'Error fetching profile visitors' });
  }
};

// Record a profile visit
export const recordProfileVisit = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { visitorId } = req.body;

    // Don't record self-visits
    if (userId === visitorId) {
      return res.json({ success: true });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add visit record
    user.profileVisitors.push({
      visitorId: visitorId as any,
      visitedAt: new Date()
    });

    // Keep only last 100 visits to prevent unbounded growth
    if (user.profileVisitors.length > 100) {
      user.profileVisitors = user.profileVisitors.slice(-100);
    }

    await user.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Record profile visit error:', error);
    res.status(500).json({ message: 'Error recording profile visit' });
  }
};

// Check interaction status between users (liked/passed)
export const getInteractionStatus = async (req: Request, res: Response) => {
  try {
    const { userId, targetUserId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hasLiked = user.likes.some(id => id.toString() === targetUserId);
    const hasPassed = user.dislikes.some(id => id.toString() === targetUserId);

    res.json({ hasLiked, hasPassed, hasInteracted: hasLiked || hasPassed });
  } catch (error) {
    console.error('Get interaction status error:', error);
    res.status(500).json({ message: 'Error fetching interaction status' });
  }
};

// Get match details with populated user info
export const getMatchDetails = async (req: Request, res: Response) => {
  try {
    const { matchId } = req.params;
    const { currentUserId } = req.query;

    const match = await Match.findById(matchId)
      .populate('user1', 'username profilePhoto dateOfBirth gender location updatedAt isAI bio interests')
      .populate('user2', 'username profilePhoto dateOfBirth gender location updatedAt isAI bio interests');

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const user1 = match.user1 as any;
    const user2 = match.user2 as any;
    
    // Determine which user is the "other" user
    const otherUser = currentUserId && (user1._id.toString() === currentUserId) ? user2 : user1;
    const currentUser = currentUserId && (user1._id.toString() === currentUserId) ? user1 : user2;

    // Calculate age from dateOfBirth
    const calculateAge = (dob: Date) => {
      const today = new Date();
      const birthDate = new Date(dob);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    res.json({
      match: {
        _id: match._id,
        user1: match.user1,
        user2: match.user2,
        createdAt: match.createdAt,
        lastMessageAt: match.lastMessageAt
      },
      otherUser: {
        _id: otherUser._id,
        username: otherUser.username,
        profilePhoto: otherUser.profilePhoto,
        age: calculateAge(otherUser.dateOfBirth),
        gender: otherUser.gender,
        location: otherUser.location,
        lastSeen: otherUser.updatedAt,
        isAI: otherUser.isAI || false,
        bio: otherUser.bio,
        interests: otherUser.interests
      },
      currentUser: {
        _id: currentUser._id,
        username: currentUser.username
      }
    });
  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({ message: 'Error fetching match details' });
  }
};
