import RegisterModel from "../models/RegisterModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class RegisterController {
  static async registerAdmin(req, res) {
    try {
      console.log("Registration request received:", req.body);

      const {
        username,
        password,
        firstName,
        middleName,
        lastName,
        email,
        role,
        isActive,
      } = req.body;

      // Validation
      if (!username || !password || !firstName || !lastName || !email) {
        return res.status(400).json({
          success: false,
          message: "Required fields are missing",
        });
      }

      // Validate role
      if (role && !["admin", "superAdmin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Must be 'admin' or 'superAdmin'",
        });
      }

      // Check if username already exists
      const existingUsername = await RegisterModel.findByUsername(username);
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }

      // Check if email already exists
      const existingEmail = await RegisterModel.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create admin data
      const adminData = {
        username,
        password: hashedPassword,
        firstName,
        middleName: middleName || null,
        lastName,
        email,
        role: role || "admin", // Changed from roleId to role
        isActive: isActive !== undefined ? isActive : true,
      };

      // Create admin
      const newAdmin = await RegisterModel.createAdmin(adminData);

      // Generate JWT token
      const token = jwt.sign(
        {
          id: newAdmin._id,
          username: newAdmin.username,
          role: newAdmin.role, // Changed from role_id to role
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Remove password from response
      const { password: _, ...adminResponse } = newAdmin;

      return res.status(201).json({
        success: true,
        message: "Admin registered successfully",
        data: {
          admin: adminResponse,
          token,
        },
      });
    } catch (error) {
      console.error("Detailed registration error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

export default RegisterController;
