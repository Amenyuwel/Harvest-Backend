import mongoose from "mongoose";

// Define the Farmer schema with proper data types and validation
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
          // Philippine mobile number format validation
          return /^(\+63|0)?9\d{9}$/.test(v);
        },
        message: "Please enter a valid Philippine mobile number",
      },
    },
    area: {
      type: Number,
      required: [true, "Area is required"],
      min: [0, "Area must be a positive number"],
      validate: {
        validator: function (v) {
          return v >= 0;
        },
        message: "Area must be a positive number",
      },
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
    // Additional useful fields
    is_active: {
      type: Boolean,
      default: true,
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
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "farmers",
  }
);

// Pre-save middleware to update last_updated field
farmerSchema.pre("save", function (next) {
  this.last_updated = new Date();
  next();
});

// Create the Farmer model
const Farmer = mongoose.model("Farmer", farmerSchema);

// Controller functions
export const farmersController = {
  // Get all farmers
  getAllFarmers: async (req, res) => {
    try {
      const farmers = await Farmer.find({ is_active: true })
        .populate("crops_id", "name")
        .populate("barangay_id", "name")
        .populate("role_id", "name")
        .select("-password") // Exclude password from response
        .sort({ date_registered: -1 });

      res.status(200).json({
        success: true,
        count: farmers.length,
        data: farmers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching farmers",
        error: error.message,
      });
    }
  },

  // Get farmer by ID
  getFarmerById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid farmer ID format",
        });
      }

      const farmer = await Farmer.findById(id)
        .populate("crops_id", "name")
        .populate("barangay_id", "name")
        .populate("role_id", "name")
        .select("-password");

      if (!farmer) {
        return res.status(404).json({
          success: false,
          message: "Farmer not found",
        });
      }

      res.status(200).json({
        success: true,
        data: farmer,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching farmer",
        error: error.message,
      });
    }
  },

  // Create new farmer
  createFarmer: async (req, res) => {
    try {
      const {
        nickname_num,
        password,
        first_name,
        middle_name,
        last_name,
        contact_number,
        area,
        crops_id,
        barangay_id,
        role_id,
      } = req.body;

      // Check if farmer with same nickname_num already exists
      const existingFarmer = await Farmer.findOne({ nickname_num });
      if (existingFarmer) {
        return res.status(400).json({
          success: false,
          message: "Farmer with this nickname number already exists",
        });
      }

      const newFarmer = new Farmer({
        nickname_num,
        password,
        first_name,
        middle_name,
        last_name,
        contact_number,
        area,
        crops_id,
        barangay_id,
        role_id,
      });

      await newFarmer.save();

      // Return farmer data without password
      const farmerResponse = await Farmer.findById(newFarmer._id)
        .populate("crops_id", "name")
        .populate("barangay_id", "name")
        .populate("role_id", "name")
        .select("-password");

      res.status(201).json({
        success: true,
        message: "Farmer created successfully",
        data: farmerResponse,
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

      res.status(500).json({
        success: false,
        message: "Error creating farmer",
        error: error.message,
      });
    }
  },

  // Update farmer
  updateFarmer: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid farmer ID format",
        });
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.farmers_id;
      delete updateData.date_registered;
      delete updateData.createdAt;

      const updatedFarmer = await Farmer.findByIdAndUpdate(
        id,
        { ...updateData, last_updated: new Date() },
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("crops_id", "name")
        .populate("barangay_id", "name")
        .populate("role_id", "name")
        .select("-password");

      if (!updatedFarmer) {
        return res.status(404).json({
          success: false,
          message: "Farmer not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Farmer updated successfully",
        data: updatedFarmer,
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

      res.status(500).json({
        success: false,
        message: "Error updating farmer",
        error: error.message,
      });
    }
  },

  // Soft delete farmer (set is_active to false)
  deleteFarmer: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid farmer ID format",
        });
      }

      const farmer = await Farmer.findByIdAndUpdate(
        id,
        { is_active: false, last_updated: new Date() },
        { new: true }
      );

      if (!farmer) {
        return res.status(404).json({
          success: false,
          message: "Farmer not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Farmer deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting farmer",
        error: error.message,
      });
    }
  },

  // Search farmers by name or nickname
  searchFarmers: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || query.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const farmers = await Farmer.find({
        is_active: true,
        $or: [
          { first_name: { $regex: query, $options: "i" } },
          { last_name: { $regex: query, $options: "i" } },
          { nickname_num: { $regex: query, $options: "i" } },
        ],
      })
        .populate("crops_id", "name")
        .populate("barangay_id", "name")
        .populate("role_id", "name")
        .select("-password")
        .sort({ first_name: 1 });

      res.status(200).json({
        success: true,
        count: farmers.length,
        data: farmers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error searching farmers",
        error: error.message,
      });
    }
  },

  // Get farmers by barangay
  getFarmersByBarangay: async (req, res) => {
    try {
      const { barangayId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(barangayId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid barangay ID format",
        });
      }

      const farmers = await Farmer.find({
        barangay_id: barangayId,
        is_active: true,
      })
        .populate("crops_id", "name")
        .populate("barangay_id", "name")
        .populate("role_id", "name")
        .select("-password")
        .sort({ first_name: 1 });

      res.status(200).json({
        success: true,
        count: farmers.length,
        data: farmers,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching farmers by barangay",
        error: error.message,
      });
    }
  },
};

export default farmersController;
