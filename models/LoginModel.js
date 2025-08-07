import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "superAdmin"],
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// IMPORTANT: Specify the collection name as the third parameter
const Admin = mongoose.model("Admin", adminSchema, "admin");

class LoginModel {
  // Add setDatabase method for compatibility with server.js
  static setDatabase(database) {
    LoginModel.db = database;
  }

  // Find admin by email
  static async findByEmail(email) {
    try {
      return await Admin.findOne({ email });
    } catch (error) {
      console.error("Error finding admin by email:", error);
      throw error;
    }
  }

  // Find admin by ID
  static async findById(id) {
    try {
      return await Admin.findById(id).select("-password");
    } catch (error) {
      console.error("Error finding admin by ID:", error);
      throw error;
    }
  }

  // Create new admin
  static async create(adminData) {
    try {
      const admin = new Admin(adminData);
      return await admin.save();
    } catch (error) {
      console.error("Error creating admin:", error);
      throw error;
    }
  }

  // Update admin
  static async update(id, adminData) {
    try {
      return await Admin.findByIdAndUpdate(id, adminData, {
        new: true,
        runValidators: true,
      }).select("-password");
    } catch (error) {
      console.error("Error updating admin:", error);
      throw error;
    }
  }

  // Delete admin
  static async delete(id) {
    try {
      const result = await Admin.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error("Error deleting admin:", error);
      throw error;
    }
  }

  // Get all admins
  static async findAll() {
    try {
      return await Admin.find().select("-password");
    } catch (error) {
      console.error("Error finding all admins:", error);
      throw error;
    }
  }
}

export default LoginModel;
