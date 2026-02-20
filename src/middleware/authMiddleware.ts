import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import LoginModel from '@/models/LoginModel';
import type { AuthenticatedRequest, JwtPayload } from '@/types/index.js';

/**
 * Extended user info attached to request
 */
interface RequestUser {
  id: string;
  userId: string;
  email: string;
  userEmail: string;
  name?: string;
  role: string;
}

/**
 * Middleware to extract and verify JWT token from request headers
 * Attaches user information to req.user for audit logging
 */
export const extractUserMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      // If no token, continue without user info (for public endpoints)
      req.user = undefined;
      return next();
    }

    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;

      // Fetch user details from database to ensure fresh data
      const user = await LoginModel.findById(decoded.userId);

      if (user) {
        // Attach user information to request object for audit logging
        req.user = {
          userId: user._id.toString(),
          email: user.email,
          role: user.role || 'user',
        };
        console.log(`🔍 User extracted for audit: ${user.email} (${user.role})`);
      } else {
        console.warn(`⚠️ User not found in database for token: ${decoded.userId}`);
        req.user = undefined;
      }
    } catch (jwtError) {
      console.warn(`⚠️ Invalid JWT token: ${(jwtError as Error).message}`);
      req.user = undefined;
    }
  } catch (error) {
    console.error('❌ Error in extractUserMiddleware:', error);
    req.user = undefined;
  }

  next();
};

/**
 * Middleware to require authentication (for protected routes)
 */
export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Response | void => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
  next();
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};
