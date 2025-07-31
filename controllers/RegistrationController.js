import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Admin } from "../models/Registration.js";

// Registration Controller
export const RegistrationController = {
  // Register new admin
  registerAdmin: async (req, res) => {
    try {
      const { username, password, first_name, middle_name, last_name, email } =
        req.body;

      // Check if admin already exists
      const existingAdmin = await Admin.findOne({
        $or: [{ username }, { email }],
      });

      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Admin with this username or email already exists",
        });
      }

      // Create new admin
      const admin = new Admin({
        username,
        password,
        first_name,
        middle_name,
        last_name,
        email,
      });

      await admin.save();

      // Generate auth token
      const token = admin.generateAuthToken();

      // Remove password from response
      const adminResponse = admin.toObject();
      delete adminResponse.password;

      res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        data: {
          admin: adminResponse,
          token,
        },
      });
    } catch (error) {
      // Handle validation errors
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
        });
      }

      console.error("Register admin error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Login admin
  loginAdmin: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required",
        });
      }

      // Find admin by username
      const admin = await Admin.findOne({ username });

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check if admin is active
      if (!admin.is_active) {
        return res.status(401).json({
          success: false,
          message: "Account is deactivated",
        });
      }

      // Compare password
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate auth token
      const token = admin.generateAuthToken();

      // Remove password from response
      const adminResponse = admin.toObject();
      delete adminResponse.password;

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          admin: adminResponse,
          token,
        },
      });
    } catch (error) {
      console.error("Login admin error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Get admin profile
  getAdminProfile: async (req, res) => {
    try {
      const adminId = req.user._id; // Assuming middleware sets req.user

      const admin = await Admin.findById(adminId).select("-password");

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      res.status(200).json({
        success: true,
        data: admin,
      });
    } catch (error) {
      console.error("Get admin profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Update admin profile
  updateAdminProfile: async (req, res) => {
    try {
      const adminId = req.user._id;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated directly
      delete updates.password;
      delete updates.admin_id;
      delete updates.date_created;

      const admin = await Admin.findByIdAndUpdate(
        adminId,
        { ...updates, last_updated: new Date() },
        { new: true, runValidators: true }
      ).select("-password");

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: admin,
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors,
        });
      }

      console.error("Update admin profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const adminId = req.user._id;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
      }

      // Find admin
      const admin = await Admin.findById(adminId);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: "Admin not found",
        });
      }

      // Verify current password
      const isMatch = await admin.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },

  // Verify JWT token
  verifyToken: async (req, res) => {
    try {
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided",
        });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Check if admin exists and is active
      const admin = await Admin.findById(decoded._id).select("-password");

      if (!admin || !admin.is_active) {
        return res.status(401).json({
          success: false,
          message: "Invalid token or admin not active",
        });
      }

      res.status(200).json({
        success: true,
        message: "Token is valid",
        data: {
          admin,
          decoded,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  },
};

export default RegistrationController;
