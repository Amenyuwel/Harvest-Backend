import AuditLogModel from "../models/AuditLogModel.js";
import AuditService from "../services/AuditService.js";
import FarmerModel from "../models/FarmerModel.js";
import CropsModel from "../models/CropsModel.js";
import BarangayModel from "../models/BarangayModel.js";
import PestModel from "../models/PestModel.js";
import ReportModel from "../models/ReportModel.js";

class AuditController {
  /**
   * Enrich audit logs with full names and clean null/empty values
   */
  static async enrichAuditLogs(logs) {
    console.log("Starting enrichment for", logs.length, "logs");
    const enrichedLogs = [];

    for (const log of logs) {
      try {
        // Skip logs with null or empty critical fields
        if (!log.action || !log.resourceType || !log.timestamp) {
          console.log("Skipping log due to missing critical fields:", {
            action: log.action,
            resourceType: log.resourceType,
            timestamp: !!log.timestamp,
          });
          continue;
        }

        const enrichedLog = { ...log };

        // Get full name for the resource if resourceId exists
        if (log.resourceId && log.resourceType) {
          try {
            let resourceName = null;
            console.log(
              `Fetching resource name for ${log.resourceType} with ID ${log.resourceId}`
            );

            switch (log.resourceType) {
              case "farmers":
              case "farmer":
                const farmer = await FarmerModel.findById(log.resourceId);
                if (farmer) {
                  resourceName = `${farmer.firstName} ${farmer.lastName}`;
                  // Add farmer details to the log for frontend display
                  enrichedLog.farmerDetails = {
                    fullName:
                      farmer.fullName ||
                      `${farmer.firstName} ${farmer.lastName}`,
                    firstName: farmer.firstName,
                    lastName: farmer.lastName,
                    rsbsaNumber: farmer.rsbsaNumber,
                  };
                } else if (log.action === "DELETE" && log.oldData) {
                  // For deleted farmers, get details from oldData
                  const oldFarmer = log.oldData;
                  if (oldFarmer.firstName || oldFarmer.lastName) {
                    resourceName = `${oldFarmer.firstName || ""} ${oldFarmer.lastName || ""}`.trim();
                    enrichedLog.farmerDetails = {
                      fullName:
                        oldFarmer.fullName ||
                        `${oldFarmer.firstName || ""} ${oldFarmer.lastName || ""}`.trim(),
                      firstName: oldFarmer.firstName,
                      lastName: oldFarmer.lastName,
                      rsbsaNumber: oldFarmer.rsbsaNumber,
                    };
                  }
                }
                break;
              case "crops":
              case "crop":
                const crop = await CropsModel.findById(log.resourceId);
                if (crop) {
                  resourceName = crop.cropName || crop.name;
                }
                break;
              case "barangays":
              case "barangay":
                const barangay = await BarangayModel.findById(log.resourceId);
                if (barangay) {
                  resourceName = barangay.barangayName || barangay.name;
                }
                break;
              case "pests":
              case "pest":
                const pest = await PestModel.findById(log.resourceId);
                if (pest) {
                  resourceName = pest.pestName || pest.name;
                }
                break;
              case "reports":
              case "report":
                const report = await ReportModel.findById(log.resourceId);
                if (report) {
                  resourceName = `Report - ${report.description || "Report"}`;
                }
                break;
            }

            if (resourceName) {
              enrichedLog.resourceName = resourceName;
              console.log(`Found resource name: ${resourceName}`);
            } else {
              console.log(
                `No resource found for ${log.resourceType} with ID ${log.resourceId}`
              );
            }
          } catch (error) {
            console.error(
              `Error fetching resource name for ${log.resourceType}:`,
              error.message
            );
            // Continue without the resource name
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

          // If no valid changes remain, remove the changes field
          if (enrichedLog.changes.length === 0) {
            delete enrichedLog.changes;
          }
        }

        enrichedLogs.push(enrichedLog);
      } catch (error) {
        console.error("Error processing log:", error);
        // Add the log without enrichment
        enrichedLogs.push(log);
      }
    }

    console.log("Enrichment complete. Processed", enrichedLogs.length, "logs");
    return enrichedLogs;
  }
  /**
   * Get all audit logs with filtering and pagination
   */
  static async getAuditLogs(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        action,
        resourceType,
        userId,
        startDate,
        endDate,
        sortBy = "timestamp",
        sortOrder = "desc",
      } = req.query;

      const filters = {};
      // By default, exclude READ operations unless specifically requested
      if (action) {
        filters.action = action;
      } else {
        filters.action = { $in: ["CREATE", "UPDATE", "DELETE"] };
      }
      if (resourceType) filters.resourceType = resourceType;
      if (userId) filters.userId = userId;
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder: sortOrder === "desc" ? -1 : 1,
      };

      const result = await AuditLogModel.findAll(filters, options);

      // Temporarily disable enrichment for debugging
      console.log("Raw logs found:", result.logs.length);
      console.log("Sample log:", result.logs[0]);

      // Enrich logs with full names and clean data
      const enrichedLogs = await AuditController.enrichAuditLogs(result.logs);

      console.log("Enriched logs:", enrichedLogs.length);

      return res.status(200).json({
        success: true,
        message: "Audit logs retrieved successfully",
        data: enrichedLogs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      console.error("❌ Error fetching audit logs:", error);

      // Log the failure
      const auditContext = AuditService.createAuditContext(req);
      await AuditService.logFailure(
        "READ",
        "audit_logs",
        null,
        error,
        auditContext,
        {}
      );

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getResourceAuditLogs(req, res) {
    try {
      const { resourceType, resourceId } = req.params;

      if (!resourceType || !resourceId) {
        return res.status(400).json({
          success: false,
          message: "Resource type and resource ID are required",
        });
      }

      const logs = await AuditLogModel.findByResourceId(
        resourceId,
        resourceType
      );

      return res.status(200).json({
        success: true,
        message: "Resource audit logs retrieved successfully",
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      console.error("❌ Error fetching resource audit logs:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required",
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const result = await AuditLogModel.findByUserId(userId, options);

      return res.status(200).json({
        success: true,
        message: "User audit logs retrieved successfully",
        data: result.logs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching user audit logs:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Get audit logs within a date range
   */
  static async getAuditLogsByDateRange(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const { page = 1, limit = 50 } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
      };

      const result = await AuditLogModel.findByDateRange(
        startDate,
        endDate,
        options
      );

      return res.status(200).json({
        success: true,
        message: "Audit logs by date range retrieved successfully",
        data: result.logs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
        },
      });
    } catch (error) {
      console.error("❌ Error fetching audit logs by date range:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Get audit log statistics
   */
  static async getAuditStatistics(req, res) {
    try {
      const stats = await AuditLogModel.getStatistics();

      return res.status(200).json({
        success: true,
        message: "Audit statistics retrieved successfully",
        data: stats,
      });
    } catch (error) {
      console.error("❌ Error fetching audit statistics:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Get available audit actions and resource types for filtering
   */
  static async getAuditFilters(req, res) {
    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            actions: { $addToSet: "$action" },
            resourceTypes: { $addToSet: "$resourceType" },
          },
        },
      ];

      const result = await AuditLogModel.db
        .collection("logs")
        .aggregate(pipeline)
        .toArray();

      const filters = result[0] || { actions: [], resourceTypes: [] };

      return res.status(200).json({
        success: true,
        message: "Audit filters retrieved successfully",
        data: {
          actions: filters.actions.sort(),
          resourceTypes: filters.resourceTypes.sort(),
        },
      });
    } catch (error) {
      console.error("❌ Error fetching audit filters:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Export audit logs (basic CSV export)
   */
  static async exportAuditLogs(req, res) {
    try {
      const {
        action,
        resourceType,
        userId,
        startDate,
        endDate,
        format = "json",
      } = req.query;

      const filters = {};
      if (action) filters.action = action;
      if (resourceType) filters.resourceType = resourceType;
      if (userId) filters.userId = userId;
      if (startDate && endDate) {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      const options = {
        page: 1,
        limit: 10000, // Large limit for export
      };

      const result = await AuditLogModel.findAll(filters, options);

      if (format === "csv") {
        const csv = AuditController.convertToCSV(result.logs);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=audit_logs.csv"
        );
        return res.send(csv);
      }

      // Default JSON format
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=audit_logs.json"
      );
      return res.json({
        success: true,
        data: result.logs,
        exportedAt: new Date().toISOString(),
        totalRecords: result.logs.length,
      });
    } catch (error) {
      console.error("❌ Error exporting audit logs:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  /**
   * Convert audit logs to CSV format
   */
  static convertToCSV(logs) {
    if (!logs || logs.length === 0) {
      return "No data available";
    }

    const headers = [
      "Timestamp",
      "Action",
      "Resource Type",
      "Resource ID",
      "User ID",
      "User Email",
      "IP Address",
      "Changes",
    ];

    const csvRows = [headers.join(",")];

    logs.forEach((log) => {
      const row = [
        log.timestamp,
        log.action,
        log.resourceType,
        log.resourceId || "",
        log.userId || "",
        log.userEmail || "",
        log.ipAddress || "",
        log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : "",
      ];
      csvRows.push(row.join(","));
    });

    return csvRows.join("\n");
  }
}

export default AuditController;
