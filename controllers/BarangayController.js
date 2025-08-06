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

  // Get barangay by barangay_id
  static async getBarangayByBarangayId(req, res) {
    try {
      const { barangay_id } = req.params;
      const barangay = await BarangayModel.findByBarangayId(barangay_id);

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
      console.error("Error fetching barangay by barangay_id:", error);
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
      const { barangay_id, barangay_name } = req.body;

      // Validation
      if (!barangay_id || !barangay_name) {
        return res.status(400).json({
          success: false,
          message: "barangay_id and barangay_name are required",
        });
      }

      // Check if barangay_id already exists
      const existingBarangayId = await BarangayModel.findByBarangayId(
        barangay_id
      );
      if (existingBarangayId) {
        return res.status(400).json({
          success: false,
          message: "Barangay ID already exists",
        });
      }

      // Check if barangay_name already exists
      const existingBarangayName = await BarangayModel.findByName(
        barangay_name
      );
      if (existingBarangayName) {
        return res.status(400).json({
          success: false,
          message: "Barangay name already exists",
        });
      }

      // Create barangay data
      const barangayData = {
        barangay_id,
        barangay_name,
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
      const { barangay_id, barangay_name } = req.body;

      // Check if barangay exists
      const existingBarangay = await BarangayModel.findById(id);
      if (!existingBarangay) {
        return res.status(404).json({
          success: false,
          message: "Barangay not found",
        });
      }

      // Check if new barangay_id already exists (if different from current)
      if (barangay_id && barangay_id !== existingBarangay.barangay_id) {
        const duplicateBarangayId = await BarangayModel.findByBarangayId(
          barangay_id
        );
        if (duplicateBarangayId) {
          return res.status(400).json({
            success: false,
            message: "Barangay ID already exists",
          });
        }
      }

      // Check if new barangay_name already exists (if different from current)
      if (barangay_name && barangay_name !== existingBarangay.barangay_name) {
        const duplicateBarangayName = await BarangayModel.findByName(
          barangay_name
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
      if (barangay_id) updateData.barangay_id = barangay_id;
      if (barangay_name) updateData.barangay_name = barangay_name;

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
