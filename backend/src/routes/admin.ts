import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Match } from '../models/Match';
import { Message } from '../models/Message';
import { resetSeedProfiles, seedProfiles } from '../seed/seedProfiles';
import { createAIGeneratedProfile, startImageGeneration, checkImageGeneration } from '../services/aiProfileGenerator';

const router = Router();

// Reset all user connections (likes, dislikes, matches, profile visitors)
router.delete('/reset-connections', async (req: Request, res: Response) => {
  try {
    // Reset all users' connection arrays
    await User.updateMany(
      {},
      {
        $set: {
          likes: [],
          dislikes: [],
          matches: [],
          profileVisitors: []
        }
      }
    );

    // Delete all matches
    await Match.deleteMany({});

    res.json({
      success: true,
      message: 'All user connections have been reset (likes, dislikes, matches, profile visitors)'
    });
  } catch (error) {
    console.error('Error resetting connections:', error);
    res.status(500).json({ success: false, error: 'Failed to reset connections' });
  }
});

// Reset all messages
router.delete('/reset-messages', async (req: Request, res: Response) => {
  try {
    // Delete all messages
    const result = await Message.deleteMany({});

    // Reset lastMessageAt on all matches (in case matches still exist)
    await Match.updateMany({}, { $unset: { lastMessageAt: 1 } });

    res.json({
      success: true,
      message: `All messages have been deleted (${result.deletedCount} messages removed)`
    });
  } catch (error) {
    console.error('Error resetting messages:', error);
    res.status(500).json({ success: false, error: 'Failed to reset messages' });
  }
});

// Reset onboarding for a specific user (delete their profile)
router.delete('/reset-onboarding/:clerkId', async (req: Request, res: Response) => {
  try {
    const { clerkId } = req.params;

    // Find and delete the user's profile
    const user = await User.findOne({ clerkId });
    
    if (!user) {
      return res.json({
        success: true,
        message: 'No profile found - onboarding can start fresh'
      });
    }

    const userId = user._id;

    // Delete all matches involving this user
    await Match.deleteMany({
      $or: [{ user1: userId as any }, { user2: userId as any }]
    } as any);

    // Delete all messages involving this user
    await Message.deleteMany({
      $or: [{ senderId: userId as any }, { receiverId: userId as any }]
    } as any);

    // Remove this user from other users' likes, dislikes, matches arrays
    await User.updateMany(
      {},
      {
        $pull: {
          likes: userId,
          dislikes: userId,
          matches: userId,
          profileVisitors: { visitorId: userId }
        }
      }
    );

    // Delete the user profile
    await User.deleteOne({ clerkId });

    res.json({
      success: true,
      message: `Profile deleted for ${user.firstName}. Onboarding will restart on next page load.`
    });
  } catch (error) {
    console.error('Error resetting onboarding:', error);
    res.status(500).json({ success: false, error: 'Failed to reset onboarding' });
  }
});

// Reset seed profiles (delete and recreate test profiles)
router.post('/reset-seed', async (req: Request, res: Response) => {
  try {
    const reseedParam = req.query.reseed;
    const shouldReseed = Array.isArray(reseedParam)
      ? reseedParam[0] !== 'false'
      : reseedParam !== 'false';

    const resetSummary = await resetSeedProfiles();
    let seedSummary = null;

    if (shouldReseed) {
      seedSummary = await seedProfiles();
    }

    res.json({
      success: true,
      message: shouldReseed
        ? `Deleted ${resetSummary.deletedProfiles} seed profiles and recreated ${seedSummary?.insertedCount || 0} new profiles.`
        : `Deleted ${resetSummary.deletedProfiles} seed profiles. Auto-reseed disabled via ?reseed=false.`,
      deleted: resetSummary,
      seeded: seedSummary
    });
  } catch (error) {
    console.error('Error resetting seed profiles:', error);
    res.status(500).json({ success: false, error: 'Failed to reset seed profiles' });
  }
});

// Reset everything (connections + messages)
router.delete('/reset-all', async (req: Request, res: Response) => {
  try {
    // Reset all users' connection arrays
    await User.updateMany(
      {},
      {
        $set: {
          likes: [],
          dislikes: [],
          matches: [],
          profileVisitors: []
        }
      }
    );

    // Delete all matches
    const matchResult = await Match.deleteMany({});

    // Delete all messages
    const messageResult = await Message.deleteMany({});

    res.json({
      success: true,
      message: `Reset complete: ${matchResult.deletedCount} matches and ${messageResult.deletedCount} messages deleted`
    });
  } catch (error) {
    console.error('Error resetting all:', error);
    res.status(500).json({ success: false, error: 'Failed to reset all data' });
  }
});

// Generate a new AI profile
router.post('/generate-ai-profile', async (req: Request, res: Response) => {
  try {
    const { gender } = req.body;
    
    if (!gender || !['male', 'female'].includes(gender)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Gender must be "male" or "female"' 
      });
    }

    // Check if required API keys are configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'OpenAI API key not configured' 
      });
    }
    
    if (!process.env.NOVITA_API_KEY) {
      return res.status(400).json({ 
        success: false, 
        error: 'Novita API key not configured' 
      });
    }

    console.log(`🤖 Starting AI profile generation for ${gender}...`);
    
    // Generate the complete profile
    const profileData = await createAIGeneratedProfile(gender);
    
    // Save to database
    const user = new User(profileData);
    await user.save();
    
    console.log(`✅ AI profile created: ${user.firstName} ${user.lastName}`);

    res.json({
      success: true,
      message: `AI profile created: ${user.firstName} ${user.lastName}`,
      profile: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        gender: user.gender,
        city: user.location.city,
        bio: user.bio,
        profilePhoto: user.profilePhoto
      }
    });
  } catch (error: any) {
    console.error('Error generating AI profile:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate AI profile' 
    });
  }
});

// Check image generation task status
router.get('/check-image-task/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const result = await checkImageGeneration(taskId);
    
    res.json({
      success: true,
      status: result.task.status,
      progress: result.task.progress_percent,
      imageUrl: result.images?.[0]?.image_url || null
    });
  } catch (error: any) {
    console.error('Error checking image task:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to check image task' 
    });
  }
});

export default router;
