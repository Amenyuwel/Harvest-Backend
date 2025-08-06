import LoginModel from "../models/LoginModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

class LoginController {
  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required"
        });
      }

      // Find user by email
      const user = await LoginModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "This is not a registered user"
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "No token provided"
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await LoginModel.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Profile error:", error);
      res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
  }
}

export default LoginController;