import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import LoginModel from "../models/LoginModel.js";

class LoginController {
  // Login user
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      // Find user by email
      const user = await LoginModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "This is not a registered user",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
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
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Logout user
  static async logout(req, res) {
    try {
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get user profile
  static async getProfile(req, res) {
    try {
      // Get user ID from the authenticated request (from your auth middleware)
      const userId = req.user?.id || req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Fetch user data from database
      const user = await LoginModel.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Return user data (exclude password)
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Update user profile
  static async updateProfile(req, res) {
    try {
      // Get user ID from the authenticated request (from your auth middleware)
      const userId = req.user?.id || req.userId;

      console.log("Update Profile Request - User ID:", userId);
      console.log("Update Profile Request - Body:", req.body);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const { firstName, lastName, middleName, username, email, role, name } =
        req.body;

      // Validate required fields - be more flexible with field names
      const displayName = name || `${firstName || ""} ${lastName || ""}`.trim();

      if (!displayName && !firstName) {
        return res.status(400).json({
          success: false,
          message: "Name or first name is required",
        });
      }

      if (!username || !email) {
        return res.status(400).json({
          success: false,
          message: "Username and email are required",
        });
      }

      // Check if username already exists (excluding current user)
      const existingUsername = await LoginModel.findByUsername(username);
      if (existingUsername && existingUsername._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: "Username already exists",
        });
      }

      // Check if email already exists (excluding current user)
      const existingEmail = await LoginModel.findByEmail(email);
      if (existingEmail && existingEmail._id.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Prepare update data - handle both name formats
      const updateData = {
        firstName: firstName?.trim() || "",
        lastName: lastName?.trim() || "",
        middleName: middleName?.trim() || "",
        username: username.trim(),
        email: email.trim(),
        role: role || "admin",
        updatedAt: new Date(),
      };

      // If name is provided, use it to populate firstName/lastName if they're empty
      if (name && !firstName && !lastName) {
        const nameParts = name.trim().split(" ");
        updateData.firstName = nameParts[0] || "";
        updateData.lastName = nameParts.slice(1).join(" ") || "";
      }

      // Also update the name field for backward compatibility
      updateData.name = displayName;

      console.log("Update Data:", updateData);

      // Update user in database
      const updatedUser = await LoginModel.findByIdAndUpdate(
        userId,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      console.log("Updated User:", updatedUser);

      // Return updated user data (exclude password)
      const { password, ...userWithoutPassword } = updatedUser.toObject();

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Internal server error: " + error.message,
      });
    }
  }
}

export default LoginController;
