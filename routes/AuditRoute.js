import express from "express";
import AuditController from "../controllers/AuditController.js";

const router = express.Router();

// Get all audit logs with filtering and pagination
router.get("/", AuditController.getAuditLogs);

// Get audit log statistics
router.get("/statistics", AuditController.getAuditStatistics);

// Get available filters (actions and resource types)
router.get("/filters", AuditController.getAuditFilters);

// Export audit logs
router.get("/export", AuditController.exportAuditLogs);

// Get audit logs by date range
router.get("/date-range", AuditController.getAuditLogsByDateRange);

// Get audit logs for a specific resource
router.get(
  "/resource/:resourceType/:resourceId",
  AuditController.getResourceAuditLogs
);

// Get audit logs for a specific user
router.get("/user/:userId", AuditController.getUserAuditLogs);

export default router;
