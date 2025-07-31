import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Admin Schema
const adminSchema = new mongoose.Schema(
  {
    admin_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      unique: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      maxlength: [50, "Username cannot exceed 50 characters"],
      minlength: [3, "Username must be at least 3 characters long"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
    },
    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    middle_name: {
      type: String,
      trim: true,
      maxlength: [50, "Middle name cannot exceed 50 characters"],
      default: "",
    },
    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },
    role_id: {
      type: Number,
      required: [true, "Role ID is required"],
      default: 1, // Admin role ID is 1
      validate: {
        validator: function (v) {
          return v === 1; // Ensure role_id is always 1 for admins
        },
        message: "Admin role ID must be 1",
      },
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    verification_token: {
      type: String,
      default: null,
    },
    date_created: {
      type: Date,
      default: Date.now,
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "admins",
  }
);

// Pre-save middleware to hash password and update last_updated for admin
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    this.last_updated = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for admin
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token for admin
adminSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      username: this.username,
      role_id: this.role_id,
      user_type: "admin",
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "24h" }
  );
  return token;
};

// Create model
const Admin = mongoose.model("Admin", adminSchema);

// Export model
export { Admin };
export default Admin;
