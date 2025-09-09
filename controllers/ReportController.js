import ReportModel from "../models/ReportModel.js";
import { auditLog } from "../middleware/auditMiddleware.js";

class ReportController {
  // Get all pest reports
  static async getAllReports(req, res) {
    try {

      const Reports = await ReportModel.findAll();
      console.log("✅ Found pest reports:", Reports.length);

      return res.status(200).json({
        success: true,
        message: "Reports retrieved successfully",
        data: Reports,
        count: Reports.length,
      });
    } catch (error) {
      console.error("❌ Error fetching reports:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

export default ReportController;
