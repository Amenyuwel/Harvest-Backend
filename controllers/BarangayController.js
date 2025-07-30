import mongoose from "mongoose";

// Define the Barangay schema with proper data types and validation
const barangaySchema = new mongoose.Schema(
  {
    barangay_id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId(),
      unique: true,
    },
    barangay_name: {
      type: String,
      required: [true, "Barangay name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Barangay name cannot exceed 100 characters"],
      validate: {
        validator: function (v) {
          // Check if barangay name contains only letters, spaces, hyphens, and apostrophes
          return /^[a-zA-Z\s\-'\.]+$/.test(v);
        },
        message:
          "Barangay name can only contain letters, spaces, hyphens, apostrophes, and periods",
      },
    },
    // Additional useful fields
    municipality: {
      type: String,
      trim: true,
      maxlength: [100, "Municipality name cannot exceed 100 characters"],
      default: "",
    },
    province: {
      type: String,
      trim: true,
      maxlength: [100, "Province name cannot exceed 100 characters"],
      default: "",
    },
    region: {
      type: String,
      trim: true,
      maxlength: [100, "Region name cannot exceed 100 characters"],
      default: "",
    },
    is_active: {
      type: Boolean,
      default: true,
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
    timestamps: true, // Automatically adds createdAt and updatedAt
    collection: "barangays",
  }
);

// Create index for better search performance
barangaySchema.index({ barangay_name: "text" });

// Pre-save middleware to update last_updated field
barangaySchema.pre("save", function (next) {
  this.last_updated = new Date();
  next();
});

// Create the Barangay model
const Barangay = mongoose.model("Barangay", barangaySchema);

// Controller functions
export const barangayController = {
  // Get all barangays
  getAllBarangays: async (req, res) => {
    try {
      const barangays = await Barangay.find({ is_active: true }).sort({
        barangay_name: 1,
      });

      res.status(200).json({
        success: true,
        count: barangays.length,
        data: barangays,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching barangays",
        error: error.message,
      });
    }
  },

  // Get barangay by ID
  getBarangayById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid barangay ID format",
        });
      }

      const barangay = await Barangay.findById(id);

      if (!barangay) {
        return res.status(404).json({
          success: false,
          message: "Barangay not found",
        });
      }

      res.status(200).json({
        success: true,
        data: barangay,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching barangay",
        error: error.message,
      });
    }
  },

  // Create new barangay
  createBarangay: async (req, res) => {
    try {
      const { barangay_name, municipality, province, region } = req.body;

      // Check if barangay with same name already exists
      const existingBarangay = await Barangay.findOne({
        barangay_name: { $regex: new RegExp(`^${barangay_name}$`, "i") },
      });

      if (existingBarangay) {
        return res.status(400).json({
          success: false,
          message: "Barangay with this name already exists",
        });
      }

      const newBarangay = new Barangay({
        barangay_name,
        municipality,
        province,
        region,
      });

      await newBarangay.save();

      res.status(201).json({
        success: true,
        message: "Barangay created successfully",
        data: newBarangay,
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
        message: "Error creating barangay",
        error: error.message,
      });
    }
  },

  // Update barangay
  updateBarangay: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid barangay ID format",
        });
      }

      // Remove fields that shouldn't be updated directly
      delete updateData.barangay_id;
      delete updateData.date_created;
      delete updateData.createdAt;

      // Check if another barangay with the same name exists (excluding current one)
      if (updateData.barangay_name) {
        const existingBarangay = await Barangay.findOne({
          _id: { $ne: id },
          barangay_name: {
            $regex: new RegExp(`^${updateData.barangay_name}$`, "i"),
          },
        });

        if (existingBarangay) {
          return res.status(400).json({
            success: false,
            message: "Another barangay with this name already exists",
          });
        }
      }

      const updatedBarangay = await Barangay.findByIdAndUpdate(
        id,
        { ...updateData, last_updated: new Date() },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedBarangay) {
        return res.status(404).json({
          success: false,
          message: "Barangay not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Barangay updated successfully",
        data: updatedBarangay,
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
        message: "Error updating barangay",
        error: error.message,
      });
    }
  },

  // Soft delete barangay (set is_active to false)
  deleteBarangay: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid barangay ID format",
        });
      }

      // Check if barangay is being used by farmers
      const Farmer = mongoose.model("Farmer");
      const farmersUsingBarangay = await Farmer.countDocuments({
        barangay_id: id,
        is_active: true,
      });

      if (farmersUsingBarangay > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete barangay. It is being used by ${farmersUsingBarangay} farmer(s)`,
        });
      }

      const barangay = await Barangay.findByIdAndUpdate(
        id,
        { is_active: false, last_updated: new Date() },
        { new: true }
      );

      if (!barangay) {
        return res.status(404).json({
          success: false,
          message: "Barangay not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Barangay deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error deleting barangay",
        error: error.message,
      });
    }
  },

  // Search barangays by name
  searchBarangays: async (req, res) => {
    try {
      const { query } = req.query;

      if (!query || query.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const barangays = await Barangay.find({
        is_active: true,
        $or: [
          { barangay_name: { $regex: query, $options: "i" } },
          { municipality: { $regex: query, $options: "i" } },
          { province: { $regex: query, $options: "i" } },
        ],
      }).sort({ barangay_name: 1 });

      res.status(200).json({
        success: true,
        count: barangays.length,
        data: barangays,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error searching barangays",
        error: error.message,
      });
    }
  },

  // Get barangays by municipality
  getBarangaysByMunicipality: async (req, res) => {
    try {
      const { municipality } = req.params;

      const barangays = await Barangay.find({
        municipality: { $regex: new RegExp(`^${municipality}$`, "i") },
        is_active: true,
      }).sort({ barangay_name: 1 });

      res.status(200).json({
        success: true,
        count: barangays.length,
        data: barangays,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching barangays by municipality",
        error: error.message,
      });
    }
  },

  // Get barangays with farmer count
  getBarangaysWithFarmerCount: async (req, res) => {
    try {
      const barangaysWithCount = await Barangay.aggregate([
        {
          $match: { is_active: true },
        },
        {
          $lookup: {
            from: "farmers",
            localField: "_id",
            foreignField: "barangay_id",
            as: "farmers",
          },
        },
        {
          $addFields: {
            farmer_count: {
              $size: {
                $filter: {
                  input: "$farmers",
                  cond: { $eq: ["$$this.is_active", true] },
                },
              },
            },
          },
        },
        {
          $project: {
            farmers: 0, // Remove the farmers array from output
          },
        },
        {
          $sort: { barangay_name: 1 },
        },
      ]);

      res.status(200).json({
        success: true,
        count: barangaysWithCount.length,
        data: barangaysWithCount,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error fetching barangays with farmer count",
        error: error.message,
      });
    }
  },
};

export default barangayController;
