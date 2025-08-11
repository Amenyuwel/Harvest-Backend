import jwt from "jsonwebtoken";
import LoginModel from "../models/LoginModel.js";

/**
 * Middleware to extract and verify JWT token from request headers
 * Attaches user information to req.user for audit logging
 */
export const extractUserMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      // If no token, continue without user info (for public endpoints)
      req.user = null;
      return next();
    }

    try {
      // Verify and decode the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user details from database to ensure fresh data
      const user = await LoginModel.findById(decoded.userId);

      if (user) {
        // Attach user information to request object for audit logging
        req.user = {
          id: user._id.toString(),
          userId: user._id.toString(),
          email: user.email,
          userEmail: user.email,
          name: user.name,
          role: user.role,
        };
        console.log(
          `🔍 User extracted for audit: ${user.email} (${user.role})`
        );
      } else {
        console.warn(
          `⚠️ User not found in database for token: ${decoded.userId}`
        );
        req.user = null;
      }
    } catch (jwtError) {
      console.warn(`⚠️ Invalid JWT token: ${jwtError.message}`);
      req.user = null;
    }
  } catch (error) {
    console.error("❌ Error in extractUserMiddleware:", error);
    req.user = null;
  }

  next();
};

/**
 * Middleware to require authentication (for protected routes)
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }
  next();
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    next();
  };
};
