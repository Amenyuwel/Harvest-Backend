import PestReportModel from "../models/PestReportModel.js";
import { auditLog } from "../middleware/auditMiddleware.js";

class PestReportController {
  // Get all pest reports
  static async getAllPestReports(req, res) {
    try {

      const pestReports = await PestReportModel.findAll();
      console.log("✅ Found pest reports:", pestReports.length);

      return res.status(200).json({
        success: true,
        message: "Pest reports retrieved successfully",
        data: pestReports,
        count: pestReports.length,
      });
    } catch (error) {
      console.error("❌ Error fetching pest reports:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

export default PestReportController;
