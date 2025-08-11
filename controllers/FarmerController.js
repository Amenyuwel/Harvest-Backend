import FarmerModel from "../models/FarmerModel.js";
import { auditLog } from "../middleware/auditMiddleware.js";

class FarmerController {
  // Create new farmer
  static async createFarmer(req, res) {
    try {
      console.log("Request body:", req.body);
      console.log("Request headers:", req.headers);

      const {
        rsbsaNumber,
        firstName,
        middleName,
        lastName,
        crop,
        area,
        barangay,
        contact,
        fullName,
      } = req.body;

      // Validate required fields
      if (
        !rsbsaNumber ||
        !firstName ||
        !lastName ||
        !crop ||
        !area ||
        !barangay ||
        !contact
      ) {
        console.log("❌ Validation failed - missing required fields");
        return res.status(400).json({
          success: false,
          message: "All required fields must be provided",
          received: req.body,
        });
      }

      const farmerData = {
        rsbsaNumber,
        firstName,
        middleName: middleName || "",
        lastName,
        fullName: fullName || `${firstName} ${lastName}`,
        crop,
        area,
        barangay,
        contact,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("✅ Farmer data to save:", farmerData);

      const result = await FarmerModel.create(farmerData);
      console.log("✅ Database result:", result);

      // Log the audit
      await auditLog.create("farmer", result.insertedId, farmerData, req);

      return res.status(201).json({
        success: true,
        message: "Farmer created successfully",
        data: { _id: result.insertedId, ...farmerData },
      });
    } catch (error) {
      console.error("❌ Error creating farmer:", error);
      
      // Log the failure
      await auditLog.failure("CREATE", "farmer", null, error, req);
      
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get farmer count by barangay
  static async getFarmerCountByBarangay(req, res) {
    try {

      const { barangayId } = req.params;
      console.log("Barangay ID:", barangayId);

      if (!barangayId) {
        return res.status(400).json({
          success: false,
          message: "Barangay ID is required",
        });
      }

      const count = await FarmerModel.countByBarangay(barangayId);
      console.log("✅ Farmer count:", count);

      return res.status(200).json({
        success: true,
        message: "Farmer count retrieved successfully",
        data: { count },
      });
    } catch (error) {
      console.error("❌ Error getting farmer count:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get all farmers
  static async getAllFarmers(req, res) {
    try {
      const farmers = await FarmerModel.findAll();
      console.log("✅ Found farmers:", farmers.length);

      return res.status(200).json({
        success: true,
        message: "Farmers retrieved successfully",
        data: farmers,
        count: farmers.length,
      });
    } catch (error) {
      console.error("❌ Error fetching farmers:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Update farmer by ID
  static async updateFarmer(req, res) {
    try {

      const { id } = req.params;
      console.log("Farmer ID:", id);
      console.log("Request body:", req.body);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Farmer ID is required",
        });
      }

      // Get the old data first for audit logging
      const oldFarmer = await FarmerModel.findById(id);
      if (!oldFarmer) {
        return res.status(404).json({
          success: false,
          message: "Farmer not found",
        });
      }

      const {
        firstName,
        middleName,
        lastName,
        crop,
        area,
        barangay,
        contact,
        fullName,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !crop || !area || !barangay || !contact) {
        console.log("❌ Validation failed - missing required fields");
        return res.status(400).json({
          success: false,
          message: "All required fields must be provided",
          received: req.body,
        });
      }

      const updateData = {
        firstName,
        middleName: middleName || "",
        lastName,
        fullName: fullName || `${firstName} ${lastName}`,
        crop,
        area,
        barangay,
        contact,
        updatedAt: new Date(),
      };

      console.log("✅ Update data:", updateData);

      const result = await FarmerModel.updateById(id, updateData);
      console.log("✅ Database result:", result);

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Farmer not found",
        });
      }

      // Log the audit
      await auditLog.update("farmer", id, oldFarmer, updateData, req);

      return res.status(200).json({
        success: true,
        message: "Farmer updated successfully",
        data: { _id: id, ...updateData },
      });
    } catch (error) {
      console.error("❌ Error updating farmer:", error);
      
      // Log the failure
      await auditLog.failure("UPDATE", "farmer", req.params.id, error, req);
      
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Delete farmer by ID
  static async deleteFarmer(req, res) {
    try {

      const { id } = req.params;
      console.log("Farmer ID:", id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Farmer ID is required",
        });
      }

      // Get the farmer data before deletion for audit logging
      const farmerToDelete = await FarmerModel.findById(id);
      if (!farmerToDelete) {
        return res.status(404).json({
          success: false,
          message: "Farmer not found",
        });
      }

      const result = await FarmerModel.deleteById(id);
      console.log("✅ Database result:", result);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Farmer not found",
        });
      }

      // Log the audit
      await auditLog.delete("farmer", id, farmerToDelete, req);

      return res.status(200).json({
        success: true,
        message: "Farmer deleted successfully",
      });
    } catch (error) {
      console.error("❌ Error deleting farmer:", error);
      
      // Log the failure
      await auditLog.failure("DELETE", "farmer", req.params.id, error, req);
      
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

export default FarmerController;
