import jwt from "jsonwebtoken";
import { Admin } from "../models/Registration.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    );

    // Fetch admin user
    const admin = await Admin.findById(decoded._id).select("-password");

    if (!admin || !admin.is_active) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or admin not active",
      });
    }

    req.user = admin;
    req.userType = "admin";
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};
