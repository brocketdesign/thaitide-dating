import { Request, Response } from 'express';
import * as analyticsService from '../services/analyticsService';

/**
 * Get user overview metrics
 * GET /api/analytics/users/overview
 */
export const getUsersOverview = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const data = await analyticsService.getUserOverview();
    const duration = Date.now() - startTime;

    console.log(`[Analytics] getUsersOverview took ${duration}ms`);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting users overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users overview'
    });
  }
};

/**
 * Get user demographics
 * GET /api/analytics/users/demographics
 */
export const getUsersDemographics = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const data = await analyticsService.getUserDemographics();
    const duration = Date.now() - startTime;

    console.log(`[Analytics] getUsersDemographics took ${duration}ms`);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting users demographics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users demographics'
    });
  }
};

/**
 * Get user growth over time
 * GET /api/analytics/users/growth?period=30d
 */
export const getUsersGrowth = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || '30d';
    const startTime = Date.now();
    const data = await analyticsService.getUserGrowth(period);
    const duration = Date.now() - startTime;

    console.log(`[Analytics] getUsersGrowth(${period}) took ${duration}ms`);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting users growth:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users growth'
    });
  }
};

/**
 * Get top users by activity
 * GET /api/analytics/users/top?metric=messages&limit=50
 */
export const getTopUsersByActivity = async (req: Request, res: Response) => {
  try {
    const metric = (req.query.metric as string) || 'messages';
    const limit = parseInt(req.query.limit as string) || 50;

    const startTime = Date.now();
    const data = await analyticsService.getTopUsers(metric, limit);
    const duration = Date.now() - startTime;

    console.log(`[Analytics] getTopUsers(${metric}, ${limit}) took ${duration}ms`);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error getting top users:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to fetch top users'
    });
  }
};

/**
 * Get filtered users list
 * GET /api/analytics/users/list?filters...
 */
export const getFilteredUsersList = async (req: Request, res: Response) => {
  try {
    const filters = {
      gender: req.query.gender as string,
      minAge: req.query.minAge ? parseInt(req.query.minAge as string) : undefined,
      maxAge: req.query.maxAge ? parseInt(req.query.maxAge as string) : undefined,
      country: req.query.country as string,
      city: req.query.city as string,
      isPremium: req.query.isPremium === 'true' ? true : req.query.isPremium === 'false' ? false : undefined,
      verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
      education: req.query.education as string,
      englishAbility: req.query.englishAbility as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string || 'createdAt',
      sortOrder: req.query.sortOrder as string || 'desc'
    };

    const pagination = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50
    };

    const startTime = Date.now();
    const data = await analyticsService.getFilteredUsers(filters, pagination);
    const duration = Date.now() - startTime;

    console.log(`[Analytics] getFilteredUsers took ${duration}ms`);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting filtered users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filtered users'
    });
  }
};

/**
 * Get message analytics
 * GET /api/analytics/messages/overview
 */
export const getMessagesOverview = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const data = await analyticsService.getMessageAnalytics();
    const duration = Date.now() - startTime;

    console.log(`[Analytics] getMessagesOverview took ${duration}ms`);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting messages overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages overview'
    });
  }
};

/**
 * Get match analytics
 * GET /api/analytics/matches/overview
 */
export const getMatchesOverview = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const data = await analyticsService.getMatchAnalytics();
    const duration = Date.now() - startTime;

    console.log(`[Analytics] getMatchesOverview took ${duration}ms`);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting matches overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches overview'
    });
  }
};

/**
 * Get engagement metrics
 * GET /api/analytics/engagement/overview
 */
export const getEngagementOverview = async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const data = await analyticsService.getEngagementMetrics();
    const duration = Date.now() - startTime;

    console.log(`[Analytics] getEngagementOverview took ${duration}ms`);

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting engagement overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engagement overview'
    });
  }
};

/**
 * Check if user is admin (for frontend to verify access)
 * GET /api/analytics/check-access
 */
export const checkAccess = async (req: Request, res: Response) => {
  // If this endpoint is reached, the user passed auth and admin middleware
  res.json({
    success: true,
    data: {
      isAdmin: true
    }
  });
};
