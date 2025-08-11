import CropsModel from "../models/CropsModel.js";
import { auditLog } from "../middleware/auditMiddleware.js";

class CropController {
  // Get all crops
  static async getAllCrops(req, res) {
    try {
      const crops = await CropsModel.findAll();

      return res.status(200).json({
        success: true,
        message: "Crops retrieved successfully",
        data: crops,
        count: crops.length,
      });
    } catch (error) {
      console.error("Error fetching crops:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get crop by ID
  static async getCropById(req, res) {
    try {
      const { id } = req.params;
      const crop = await CropsModel.findById(id);

      if (!crop) {
        return res.status(404).json({
          success: false,
          message: "Crop not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Crop retrieved successfully",
        data: crop,
      });
    } catch (error) {
      console.error("Error fetching crop by ID:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get crop by cropId
  static async getCropByCropId(req, res) {
    try {
      const { cropId } = req.params;
      const crop = await CropsModel.findByCropId(cropId);

      if (!crop) {
        return res.status(404).json({
          success: false,
          message: "Crop not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Crop retrieved successfully",
        data: crop,
      });
    } catch (error) {
      console.error("Error fetching crop by cropId:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Create new crop
  static async createCrop(req, res) {
    try {
      const { cropId, cropName, cropType, season } = req.body;

      // Validate required fields
      if (!cropId || !cropName) {
        return res.status(400).json({
          success: false,
          message: "Crop ID and crop name are required",
        });
      }

      // Check if cropId already exists
      const existingCrop = await CropsModel.findByCropId(cropId);
      if (existingCrop) {
        return res.status(409).json({
          success: false,
          message: "Crop with this ID already exists",
        });
      }

      const cropData = {
        cropId,
        cropName,
        cropType: cropType || "",
        season: season || "",
      };

      const result = await CropsModel.create(cropData);

      // Log the audit
      await auditLog.create("crop", result.insertedId, cropData, req);

      return res.status(201).json({
        success: true,
        message: "Crop created successfully",
        data: { _id: result.insertedId, ...cropData },
      });
    } catch (error) {
      console.error("Error creating crop:", error);
      
      // Log the failure
      await auditLog.failure("CREATE", "crop", null, error, req);
      
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Update crop
  static async updateCrop(req, res) {
    try {
      const { id } = req.params;
      const { cropName, cropType, season } = req.body;

      const existingCrop = await CropsModel.findById(id);
      if (!existingCrop) {
        return res.status(404).json({
          success: false,
          message: "Crop not found",
        });
      }

      const updateData = {};
      if (cropName) updateData.cropName = cropName;
      if (cropType) updateData.cropType = cropType;
      if (season) updateData.season = season;

      const result = await CropsModel.update(id, updateData);

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Crop not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Crop updated successfully",
      });
    } catch (error) {
      console.error("Error updating crop:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Delete crop
  static async deleteCrop(req, res) {
    try {
      const { id } = req.params;

      const result = await CropsModel.delete(id);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Crop not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Crop deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting crop:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Search crops
  static async searchCrops(req, res) {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const crops = await CropsModel.search(q);

      return res.status(200).json({
        success: true,
        message: "Crops search completed",
        data: crops,
        count: crops.length,
      });
    } catch (error) {
      console.error("Error searching crops:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

export default CropController;
