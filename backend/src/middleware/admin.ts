import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

/**
 * Admin authorization middleware
 * Checks if the authenticated user has admin role
 * Must be used after auth middleware
 */
export const admin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Ensure auth middleware ran first
    if (!req.auth || !req.auth.clerkId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Authentication required'
      });
    }

    // Fetch user from database
    const user = await User.findOne({ clerkId: req.auth.clerkId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admin access required'
      });
    }

    // User is admin, proceed
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authorization'
    });
  }
};
