import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Import the Farmer model from farmersController (or create a separate models file)
// For now, we'll redefine it here, but ideally you'd move models to a separate folder
const farmerSchema = new mongoose.Schema(
  {
    farmers_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      unique: true,
    },
    nickname_num: {
      type: String,
      required: [true, "Nickname number is required"],
      unique: true,
      trim: true,
      maxlength: [50, "Nickname number cannot exceed 50 characters"],
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
    contact_number: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      validate: {
        validator: function (v) {
          return /^(\+63|0)?9\d{9}$/.test(v);
        },
        message: "Please enter a valid Philippine mobile number",
      },
    },
    rsbsa: {
      type: String,
      required: [true, "RSBSA number is required"],
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          // RSBSA format: 000000-000-00000
          return /^\d{6}-\d{3}-\d{5}$/.test(v);
        },
        message:
          "RSBSA must follow the format 000000-000-00000 (e.g., 123456-789-01234)",
      },
    },
    area: {
      type: Number,
      required: [true, "Area is required"],
      min: [0, "Area must be a positive number"],
    },
    crops_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: [true, "Crop ID is required"],
    },
    barangay_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barangay",
      required: [true, "Barangay ID is required"],
    },
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: [true, "Role ID is required"],
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
    date_registered: {
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
    collection: "farmers",
  }
);

// Pre-save middleware to hash password and update last_updated
farmerSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    this.last_updated = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
farmerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate JWT token
farmerSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      nickname_num: this.nickname_num,
      role_id: this.role_id,
    },
    process.env.JWT_SECRET || "your-secret-key",
    { expiresIn: "24h" }
  );
  return token;
};

const Farmer = mongoose.model("Farmer", farmerSchema);

// Registration Controller
export const registrationController = {
  // Register new farmer
  registerFarmer: async (req, res) => {
    try {
      const {
        nickname_num,
        password,
        confirmPassword,
        first_name,
        middle_name,
        last_name,
        contact_number,
        rsbsa,
        area,
        crops_id,
        barangay_id,
        role_id,
      } = req.body;

      // Validation: Check if all required fields are provided
      const requiredFields = [
        "nickname_num",
        "password",
        "confirmPassword",
        "first_name",
        "last_name",
        "contact_number",
        "rsbsa",
        "area",
        "crops_id",
        "barangay_id",
        "role_id",
      ];

      const missingFields = requiredFields.filter((field) => !req.body[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          missingFields: missingFields,
        });
      }

      // Validation: Check password confirmation
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: "Password and confirm password do not match",
        });
      }

      // Validation: Check password strength
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
      }

      // Check if farmer with same nickname_num already exists
      const existingFarmer = await Farmer.findOne({
        nickname_num: nickname_num.trim(),
      });

      if (existingFarmer) {
        return res.status(400).json({
          success: false,
          message: "Farmer with this nickname number already exists",
        });
      }

      // Check if contact number already exists
      const existingContact = await Farmer.findOne({
        contact_number: contact_number.trim(),
      });

      if (existingContact) {
        return res.status(400).json({
          success: false,
          message: "This contact number is already registered",
        });
      }

      // Check if RSBSA number already exists
      const existingRSBSA = await Farmer.findOne({
        rsbsa: rsbsa.trim(),
      });

      if (existingRSBSA) {
        return res.status(400).json({
          success: false,
          message: "This RSBSA number is already registered",
        });
      }

      // Validate that referenced entities exist
      const [cropExists, barangayExists, roleExists] = await Promise.all([
        mongoose.model("Crop").findById(crops_id),
        mongoose.model("Barangay").findById(barangay_id),
        mongoose.model("Role").findById(role_id),
      ]);

      if (!cropExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid crop ID provided",
        });
      }

      if (!barangayExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid barangay ID provided",
        });
      }

      if (!roleExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid role ID provided",
        });
      }

      // Generate verification token
      const verificationToken = jwt.sign(
        { nickname_num },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "24h" }
      );

      // Create new farmer
      const newFarmer = new Farmer({
        nickname_num: nickname_num.trim(),
        password, // This will be hashed by the pre-save middleware
        first_name: first_name.trim(),
        middle_name: middle_name ? middle_name.trim() : "",
        last_name: last_name.trim(),
        contact_number: contact_number.trim(),
        rsbsa: rsbsa.trim(),
        area: parseFloat(area),
        crops_id,
        barangay_id,
        role_id,
        verification_token: verificationToken,
        is_verified: false, // Set to false initially
      });

      await newFarmer.save();

      // Generate auth token
      const authToken = newFarmer.generateAuthToken();

      // Return farmer data without sensitive information
      const farmerResponse = await Farmer.findById(newFarmer._id)
        .populate("crops_id", "name")
        .populate("barangay_id", "barangay_name")
        .populate("role_id", "name")
        .select("-password -verification_token");

      res.status(201).json({
        success: true,
        message: "Farmer registered successfully",
        data: {
          farmer: farmerResponse,
          token: authToken,
          expiresIn: "24h",
        },
      });
    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: errors,
        });
      }

      if (error.code === 11000) {
        // Handle duplicate key error
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Error registering farmer",
        error: error.message,
      });
    }
  },

  // Login farmer
  loginFarmer: async (req, res) => {
    try {
      const { nickname_num, password } = req.body;

      // Validation
      if (!nickname_num || !password) {
        return res.status(400).json({
          success: false,
          message: "Nickname number and password are required",
        });
      }

      // Find farmer by nickname_num
      const farmer = await Farmer.findOne({
        nickname_num: nickname_num.trim(),
        is_active: true,
      });

      if (!farmer) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Check password
      const isPasswordValid = await farmer.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      // Generate auth token
      const authToken = farmer.generateAuthToken();

      // Get farmer data with populated fields
      const farmerData = await Farmer.findById(farmer._id)
        .populate("crops_id", "name")
        .populate("barangay_id", "barangay_name")
        .populate("role_id", "name")
        .select("-password -verification_token");

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          farmer: farmerData,
          token: authToken,
          expiresIn: "24h",
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error during login",
        error: error.message,
      });
    }
  },

  // Verify farmer account
  verifyFarmer: async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Verification token is required",
        });
      }

      // Verify the token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      // Find farmer with this verification token
      const farmer = await Farmer.findOne({
        verification_token: token,
        nickname_num: decoded.nickname_num,
      });

      if (!farmer) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired verification token",
        });
      }

      if (farmer.is_verified) {
        return res.status(400).json({
          success: false,
          message: "Account is already verified",
        });
      }

      // Update farmer verification status
      farmer.is_verified = true;
      farmer.verification_token = null;
      farmer.last_updated = new Date();
      await farmer.save();

      res.status(200).json({
        success: true,
        message: "Account verified successfully",
      });
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(400).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      if (error.name === "TokenExpiredError") {
        return res.status(400).json({
          success: false,
          message: "Verification token has expired",
        });
      }

      res.status(500).json({
        success: false,
        message: "Error verifying account",
        error: error.message,
      });
    }
  },

  // Check if nickname number is available
  checkNicknameAvailability: async (req, res) => {
    try {
      const { nickname_num } = req.params;

      if (!nickname_num) {
        return res.status(400).json({
          success: false,
          message: "Nickname number is required",
        });
      }

      const existingFarmer = await Farmer.findOne({
        nickname_num: nickname_num.trim(),
      });

      res.status(200).json({
        success: true,
        available: !existingFarmer,
        message: existingFarmer
          ? "Nickname number is already taken"
          : "Nickname number is available",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error checking nickname availability",
        error: error.message,
      });
    }
  },
};

export default registrationController;
