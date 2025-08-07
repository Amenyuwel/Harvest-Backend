import FarmerModel from "../models/FarmerModel.js";

class FarmerController {
  // Create new farmer
  static async createFarmer(req, res) {
    try {
      console.log("=== CREATE FARMER REQUEST ===");
      console.log("Request body:", req.body);
      console.log("Request headers:", req.headers);

      const { rsbsaNumber, firstName, middleName, lastName, crop, area, barangay, contact, fullName } = req.body;

      // Validate required fields
      if (!rsbsaNumber || !firstName || !lastName || !crop || !area || !barangay || !contact) {
        console.log("❌ Validation failed - missing required fields");
        return res.status(400).json({
          success: false,
          message: "All required fields must be provided",
          received: req.body
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
        updatedAt: new Date()
      };

      console.log("✅ Farmer data to save:", farmerData);

      const result = await FarmerModel.create(farmerData);
      console.log("✅ Database result:", result);

      return res.status(201).json({
        success: true,
        message: "Farmer created successfully",
        data: { _id: result.insertedId, ...farmerData },
      });
    } catch (error) {
      console.error("❌ Error creating farmer:", error);
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
      console.log("=== GET FARMER COUNT REQUEST ===");
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
}

export default FarmerController;