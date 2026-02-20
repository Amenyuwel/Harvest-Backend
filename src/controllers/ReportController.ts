import type { Request, Response } from 'express';
import ReportModel from '@/models/ReportModel';

class ReportController {
  // Get all pest reports
  static async getAllReports(_req: Request, res: Response): Promise<Response> {
    try {
      const reports = await ReportModel.findAll();
      console.log('✅ Found pest reports:', reports.length);

      return res.status(200).json({
        success: true,
        message: 'Reports retrieved successfully',
        data: reports,
        count: reports.length,
      });
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }
}

export default ReportController;
