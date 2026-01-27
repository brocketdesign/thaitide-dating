import { Router } from 'express';
import { auth } from '../middleware/auth';
import { admin } from '../middleware/admin';
import * as analyticsController from '../controllers/analyticsController';

const router = Router();

// Protect ALL analytics routes with authentication and authorization middleware
router.use(auth, admin);

// User Analytics
router.get('/users/overview', analyticsController.getUsersOverview);
router.get('/users/demographics', analyticsController.getUsersDemographics);
router.get('/users/growth', analyticsController.getUsersGrowth);
router.get('/users/top', analyticsController.getTopUsersByActivity);
router.get('/users/list', analyticsController.getFilteredUsersList);

// Message Analytics
router.get('/messages/overview', analyticsController.getMessagesOverview);

// Match Analytics
router.get('/matches/overview', analyticsController.getMatchesOverview);

// Engagement Analytics
router.get('/engagement/overview', analyticsController.getEngagementOverview);

// Admin access check
router.get('/check-access', analyticsController.checkAccess);

export default router;
