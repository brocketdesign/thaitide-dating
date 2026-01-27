import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';

// Extend Express Request to include auth information
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        clerkId: string;
      };
    }
  }
}

/**
 * Authentication middleware to verify Clerk session tokens
 * Extracts token from Authorization header and validates it
 */
export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Clerk
    try {
      const session = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!
      });

      // Attach user information to request
      req.auth = {
        userId: session.sub, // Subject claim contains the user ID
        clerkId: session.sub
      };

      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};
