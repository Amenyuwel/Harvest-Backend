import RegisterModel from "../models/RegisterModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class RegisterController {
  static async registerAdmin(req, res) {
    try {
      console.log("Registration request received:", req.body); // Add this line

      const {
        username,
        password,
        first_name,
        middle_name,
        last_name,
        email,
        role_id,
        is_active,
      } = req.body;

      // Validation
      if (!username || !password || !first_name || !last_name || !email) {
        return res.status(400).json({
          success: false,
          message: "Required fields are missing",
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
        first_name,
        middle_name: middle_name || null,
        last_name,
        email,
        role_id: role_id || 1, // Default to admin
        is_active: is_active !== undefined ? is_active : true,
      };

      // Create admin
      const newAdmin = await RegisterModel.createAdmin(adminData);

      // Generate JWT token
      const token = jwt.sign(
        {
          id: newAdmin._id,
          username: newAdmin.username,
          role_id: newAdmin.role_id,
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
      console.error("Detailed registration error:", error); // Enhanced logging
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message, // Add this for debugging (remove in production)
      });
    }
  }
}

export default RegisterController;
