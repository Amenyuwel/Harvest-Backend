import type { Request, Response } from 'express';
import type { Document, WithId } from 'mongodb';
import AuditLogModel from '@/models/AuditLogModel';
import BarangayModel from '@/models/BarangayModel';
import CropsModel from '@/models/CropsModel';
import FarmerModel from '@/models/FarmerModel';
import PestModel from '@/models/PestModel';
import ReportModel from '@/models/ReportModel';
import AuditService from '@/services/AuditService';

interface AuditLog {
  _id?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  timestamp?: Date;
  changes?: Array<{
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
  oldData?: Record<string, unknown>;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

interface EnrichedAuditLog extends AuditLog {
  resourceName?: string;
  farmerDetails?: {
    fullName: string;
    firstName: string;
    lastName: string;
    rsbsaNumber?: string;
  };
}

class AuditController {
  /**
   * Enrich audit logs with full names and clean null/empty values
   */
  static async enrichAuditLogs(logs: WithId<Document>[]): Promise<EnrichedAuditLog[]> {
    console.log('Starting enrichment for', logs.length, 'logs');
    const enrichedLogs: EnrichedAuditLog[] = [];

    for (const log of logs) {
      try {
        const logData = log as unknown as AuditLog;
        // Skip logs with null or empty critical fields
        if (!logData.action || !logData.resourceType || !logData.timestamp) {
          console.log('Skipping log due to missing critical fields:', {
            action: logData.action,
            resourceType: logData.resourceType,
            timestamp: !!logData.timestamp,
          });
          continue;
        }

        const enrichedLog: EnrichedAuditLog = { ...logData, _id: log._id.toString() };

        // Get full name for the resource if resourceId exists
        if (logData.resourceId && logData.resourceType) {
          try {
            let resourceName: string | null = null;
            console.log(
              `Fetching resource name for ${logData.resourceType} with ID ${logData.resourceId}`
            );

            switch (logData.resourceType) {
              case 'farmers':
              case 'farmer': {
                const farmer = await FarmerModel.findById(logData.resourceId);
                if (farmer) {
                  resourceName = `${farmer.firstName} ${farmer.lastName}`;
                  enrichedLog.farmerDetails = {
                    fullName: farmer.fullName || `${farmer.firstName} ${farmer.lastName}`,
                    firstName: farmer.firstName,
                    lastName: farmer.lastName,
                    rsbsaNumber: farmer.rsbsaNumber,
                  };
                } else if (logData.action === 'DELETE' && logData.oldData) {
                  const oldFarmer = logData.oldData as Record<string, unknown>;
                  if (oldFarmer.firstName || oldFarmer.lastName) {
                    resourceName =
                      `${oldFarmer.firstName || ''} ${oldFarmer.lastName || ''}`.trim();
                    enrichedLog.farmerDetails = {
                      fullName:
                        (oldFarmer.fullName as string) ||
                        `${oldFarmer.firstName || ''} ${oldFarmer.lastName || ''}`.trim(),
                      firstName: (oldFarmer.firstName as string) || '',
                      lastName: (oldFarmer.lastName as string) || '',
                      rsbsaNumber: oldFarmer.rsbsaNumber as string,
                    };
                  }
                }
                break;
              }
              case 'crops':
              case 'crop': {
                const crop = await CropsModel.findById(logData.resourceId);
                if (crop) {
                  resourceName = crop.cropName || crop.name;
                }
                break;
              }
              case 'barangays':
              case 'barangay': {
                const barangay = await BarangayModel.findById(logData.resourceId);
                if (barangay) {
                  resourceName = barangay.barangayName || barangay.name;
                }
                break;
              }
              case 'pests':
              case 'pest': {
                const pest = await PestModel.findById(logData.resourceId);
                if (pest) {
                  resourceName = pest.pestName || pest.name;
                }
                break;
              }
              case 'reports':
              case 'report': {
                const report = await ReportModel.findById(logData.resourceId);
                if (report) {
                  resourceName = `Report - ${report.description || 'Report'}`;
                }
                break;
              }
            }

            if (resourceName) {
              enrichedLog.resourceName = resourceName;
              console.log(`Found resource name: ${resourceName}`);
            } else {
              console.log(
                `No resource found for ${logData.resourceType} with ID ${logData.resourceId}`
              );
            }
          } catch (error) {
            console.error(
              `Error fetching resource name for ${logData.resourceType}:`,
              (error as Error).message
            );
          }
        }

        // Clean up changes - remove null/empty changes
        if (enrichedLog.changes && Array.isArray(enrichedLog.changes)) {
          enrichedLog.changes = enrichedLog.changes.filter(
            (change) =>
              change.field &&
              (change.oldValue !== null || change.newValue !== null) &&
              (change.oldValue !== undefined || change.newValue !== undefined)
          );

          if (enrichedLog.changes.length === 0) {
            enrichedLog.changes = undefined;
          }
        }

        enrichedLogs.push(enrichedLog);
      } catch (error) {
        console.error('Error processing log:', error);
        enrichedLogs.push(log as unknown as EnrichedAuditLog);
      }
    }

    console.log('Enrichment complete. Processed', enrichedLogs.length, 'logs');
    return enrichedLogs;
  }

  /**
   * Get all audit logs with filtering and pagination
   */
  static async getAuditLogs(req: Request, res: Response): Promise<Response> {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        resourceType,
        userId,
        startDate,
        endDate,
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = req.query;

      const filters: Record<string, unknown> = {};
      if (action) {
        filters.action = action;
      } else {
        filters.action = { $in: ['CREATE', 'UPDATE', 'DELETE'] };
      }
      if (resourceType) filters.resourceType = resourceType;
      if (userId) filters.userId = userId;
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      const options: { page: number; limit: number; sortBy: string; sortOrder: 1 | -1 } = {
        page: Number.parseInt(page as string),
        limit: Number.parseInt(limit as string),
        sortBy: sortBy as string,
        sortOrder: sortOrder === 'desc' ? -1 : 1,
      };

      const result = await AuditLogModel.findAll(filters, options);

      console.log('Raw logs found:', result.logs.length);
      console.log('Sample log:', result.logs[0]);

      const enrichedLogs = await AuditController.enrichAuditLogs(result.logs);

      console.log('Enriched logs:', enrichedLogs.length);

      return res.status(200).json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: enrichedLogs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          limit: Number.parseInt(limit as string),
        },
      });
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);

      const auditContext = AuditService.createAuditContext(req);
      await AuditService.logFailure(
        'READ',
        'audit_logs',
        undefined,
        error as Error,
        auditContext,
        {}
      );

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getResourceAuditLogs(req: Request, res: Response): Promise<Response> {
    try {
      const { resourceType, resourceId } = req.params;

      if (!resourceType || !resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource type and resource ID are required',
        });
      }

      const logs = await AuditLogModel.findByResourceId(resourceId, resourceType);

      return res.status(200).json({
        success: true,
        message: 'Resource audit logs retrieved successfully',
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      console.error('❌ Error fetching resource audit logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(req: Request, res: Response): Promise<Response> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
      }

      const options = {
        page: Number.parseInt(page as string),
        limit: Number.parseInt(limit as string),
      };

      const result = await AuditLogModel.findByUserId(userId, options);

      return res.status(200).json({
        success: true,
        message: 'User audit logs retrieved successfully',
        data: result.logs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
        },
      });
    } catch (error) {
      console.error('❌ Error fetching user audit logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get audit logs within a date range
   */
  static async getAuditLogsByDateRange(req: Request, res: Response): Promise<Response> {
    try {
      const { startDate, endDate, page = 1, limit = 50 } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
      }

      const options = {
        page: Number.parseInt(page as string),
        limit: Number.parseInt(limit as string),
      };

      const result = await AuditLogModel.findByDateRange(
        startDate as string,
        endDate as string,
        options
      );

      return res.status(200).json({
        success: true,
        message: 'Audit logs by date range retrieved successfully',
        data: result.logs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
        },
      });
    } catch (error) {
      console.error('❌ Error fetching audit logs by date range:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get audit log statistics
   */
  static async getAuditStatistics(_req: Request, res: Response): Promise<Response> {
    try {
      const stats = await AuditLogModel.getStatistics();

      return res.status(200).json({
        success: true,
        message: 'Audit statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      console.error('❌ Error fetching audit statistics:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get available audit actions and resource types for filtering
   */
  static async getAuditFilters(_req: Request, res: Response): Promise<Response> {
    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            actions: { $addToSet: '$action' },
            resourceTypes: { $addToSet: '$resourceType' },
          },
        },
      ];

      if (!AuditLogModel.db) {
        throw new Error('Database not connected');
      }

      const result = await AuditLogModel.db.collection('logs').aggregate(pipeline).toArray();

      const filters = result[0] || { actions: [], resourceTypes: [] };

      return res.status(200).json({
        success: true,
        message: 'Audit filters retrieved successfully',
        data: {
          actions: filters.actions.sort(),
          resourceTypes: filters.resourceTypes.sort(),
        },
      });
    } catch (error) {
      console.error('❌ Error fetching audit filters:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Export audit logs (basic CSV export)
   */
  static async exportAuditLogs(req: Request, res: Response): Promise<Response | undefined> {
    try {
      const { action, resourceType, userId, startDate, endDate, format = 'json' } = req.query;

      const filters: Record<string, unknown> = {};
      if (action) filters.action = action;
      if (resourceType) filters.resourceType = resourceType;
      if (userId) filters.userId = userId;
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      const options = {
        page: 1,
        limit: 10000,
      };

      const result = await AuditLogModel.findAll(filters, options);

      if (format === 'csv') {
        const csv = AuditController.convertToCSV(result.logs);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv');
        return res.send(csv);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.json');
      return res.json({
        success: true,
        data: result.logs,
        exportedAt: new Date().toISOString(),
        totalRecords: result.logs.length,
      });
    } catch (error) {
      console.error('❌ Error exporting audit logs:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  /**
   * Convert audit logs to CSV format
   */
  static convertToCSV(logs: WithId<Document>[]): string {
    if (!logs || logs.length === 0) {
      return 'No data available';
    }

    const headers = [
      'Timestamp',
      'Action',
      'Resource Type',
      'Resource ID',
      'User ID',
      'User Email',
      'IP Address',
      'Changes',
    ];

    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const logData = log as unknown as AuditLog;
      const row = [
        logData.timestamp,
        logData.action,
        logData.resourceType,
        logData.resourceId || '',
        logData.userId || '',
        logData.userEmail || '',
        logData.ipAddress || '',
        logData.changes ? JSON.stringify(logData.changes).replace(/"/g, '""') : '',
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }
}

export default AuditController;
