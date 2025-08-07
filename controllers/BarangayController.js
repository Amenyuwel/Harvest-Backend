import BarangayModel from "../models/BarangayModel.js";

class BarangayController {
  // Get all barangays
  static async getAllBarangays(req, res) {
    try {
      const barangays = await BarangayModel.findAll();

      return res.status(200).json({
        success: true,
        message: "Barangays retrieved successfully",
        data: barangays,
        count: barangays.length,
      });
    } catch (error) {
      console.error("Error fetching barangays:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get barangay by ID
  static async getBarangayById(req, res) {
    try {
      const { id } = req.params;
      const barangay = await BarangayModel.findById(id);

      if (!barangay) {
        return res.status(404).json({
          success: false,
          message: "Barangay not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Barangay retrieved successfully",
        data: barangay,
      });
    } catch (error) {
      console.error("Error fetching barangay by ID:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get barangay by barangayId
  static async getBarangayByBarangayId(req, res) {
    try {
      const { barangayId } = req.params;
      const barangay = await BarangayModel.findByBarangayId(barangayId);

      if (!barangay) {
        return res.status(404).json({
          success: false,
          message: "Barangay not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Barangay retrieved successfully",
        data: barangay,
      });
    } catch (error) {
      console.error("Error fetching barangay by barangayId:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Create new barangay
  static async createBarangay(req, res) {
    try {
      const { barangayId, barangayName } = req.body;

      // Validation
      if (!barangayId || !barangayName) {
        return res.status(400).json({
          success: false,
          message: "barangayId and barangayName are required",
        });
      }

      // Check if barangayId already exists
      const existingBarangayId = await BarangayModel.findByBarangayId(
        barangayId
      );
      if (existingBarangayId) {
        return res.status(400).json({
          success: false,
          message: "Barangay ID already exists",
        });
      }

      // Check if barangayName already exists
      const existingBarangayName = await BarangayModel.findByName(
        barangayName
      );
      if (existingBarangayName) {
        return res.status(400).json({
          success: false,
          message: "Barangay name already exists",
        });
      }

      // Create barangay data
      const barangayData = {
        barangayId,
        barangayName,
      };

      // Create barangay
      const newBarangay = await BarangayModel.createBarangay(barangayData);

      return res.status(201).json({
        success: true,
        message: "Barangay created successfully",
        data: newBarangay,
      });
    } catch (error) {
      console.error("Error creating barangay:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Update barangay
  static async updateBarangay(req, res) {
    try {
      const { id } = req.params;
      const { barangayId, barangayName } = req.body;

      // Check if barangay exists
      const existingBarangay = await BarangayModel.findById(id);
      if (!existingBarangay) {
        return res.status(404).json({
          success: false,
          message: "Barangay not found",
        });
      }

      // Check if new barangayId already exists (if different from current)
      if (barangayId && barangayId !== existingBarangay.barangayId) {
        const duplicateBarangayId = await BarangayModel.findByBarangayId(
          barangayId
        );
        if (duplicateBarangayId) {
          return res.status(400).json({
            success: false,
            message: "Barangay ID already exists",
          });
        }
      }

      // Check if new barangayName already exists (if different from current)
      if (barangayName && barangayName !== existingBarangay.barangayName) {
        const duplicateBarangayName = await BarangayModel.findByName(
          barangayName
        );
        if (duplicateBarangayName) {
          return res.status(400).json({
            success: false,
            message: "Barangay name already exists",
          });
        }
      }

      // Update data
      const updateData = {};
      if (barangayId) updateData.barangayId = barangayId;
      if (barangayName) updateData.barangayName = barangayName;

      await BarangayModel.updateBarangay(id, updateData);

      // Get updated barangay
      const updatedBarangay = await BarangayModel.findById(id);

      return res.status(200).json({
        success: true,
        message: "Barangay updated successfully",
        data: updatedBarangay,
      });
    } catch (error) {
      console.error("Error updating barangay:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Delete barangay
  static async deleteBarangay(req, res) {
    try {
      const { id } = req.params;

      // Check if barangay exists
      const existingBarangay = await BarangayModel.findById(id);
      if (!existingBarangay) {
        return res.status(404).json({
          success: false,
          message: "Barangay not found",
        });
      }

      await BarangayModel.deleteBarangay(id);

      return res.status(200).json({
        success: true,
        message: "Barangay deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting barangay:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Search barangays by name
  static async searchBarangays(req, res) {
    try {
      const { search } = req.query;

      if (!search) {
        return res.status(400).json({
          success: false,
          message: "Search term is required",
        });
      }

      const barangays = await BarangayModel.searchByName(search);

      return res.status(200).json({
        success: true,
        message: "Search completed successfully",
        data: barangays,
        count: barangays.length,
      });
    } catch (error) {
      console.error("Error searching barangays:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

export default BarangayController;
