import AuditLogModel from "../models/AuditLogModel.js";

class AuditService {
  /**
   * Log an audit event
   * @param {Object} auditData - The audit data
   * @param {string} auditData.action - The action performed (CREATE, UPDATE, DELETE, READ)
   * @param {string} auditData.resourceType - The type of resource (farmer, crop, pest, etc.)
   * @param {string} auditData.resourceId - The ID of the resource
   * @param {string} auditData.userId - The ID of the user performing the action
   * @param {string} auditData.userEmail - The email of the user performing the action
   * @param {Object} auditData.oldData - The old data (for updates and deletes)
   * @param {Object} auditData.newData - The new data (for creates and updates)
   * @param {string} auditData.ipAddress - The IP address of the request
   * @param {string} auditData.userAgent - The user agent of the request
   * @param {Object} auditData.metadata - Additional metadata
   */
  static async logAudit(auditData) {
    try {
      const {
        action,
        resourceType,
        resourceId,
        userId,
        userEmail,
        oldData,
        newData,
        ipAddress,
        userAgent,
        metadata = {},
      } = auditData;

      // Validate required fields
      if (!action || !resourceType) {
        console.warn("⚠️ Audit log missing required fields:", {
          action,
          resourceType,
        });
        return;
      }

      // Log warning if no user context available
      if ((!userId || userId === "system") && (!userEmail || userEmail === "system@harvest.com")) {
        console.warn("⚠️ Audit log created without user context:", {
          action,
          resourceType,
          resourceId
        });
      }

      const auditLog = {
        action: action.toUpperCase(),
        resourceType: resourceType.toLowerCase(),
        resourceId: resourceId || null,
        userId: userId || null,
        userEmail: userEmail || null,
        oldData: this.sanitizeData(oldData),
        newData: this.sanitizeData(newData),
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        metadata: metadata,
        changes: this.detectChanges(oldData, newData),
        timestamp: new Date(),
      };

      await AuditLogModel.create(auditLog);
      console.log(
        `✅ Audit logged: ${action} ${resourceType} ${resourceId || ""}`
      );
    } catch (error) {
      console.error("❌ Error logging audit:", error);
      // Don't throw error to prevent breaking the main operation
    }
  }

  /**
   * Log a CREATE operation
   */
  static async logCreate(
    resourceType,
    resourceId,
    newData,
    userInfo,
    requestInfo
  ) {
    await this.logAudit({
      action: "CREATE",
      resourceType,
      resourceId,
      newData,
      ...userInfo,
      ...requestInfo,
      metadata: {
        operation: "create",
        success: true,
      },
    });
  }

  /**
   * Log an UPDATE operation
   */
  static async logUpdate(
    resourceType,
    resourceId,
    oldData,
    newData,
    userInfo,
    requestInfo
  ) {
    await this.logAudit({
      action: "UPDATE",
      resourceType,
      resourceId,
      oldData,
      newData,
      ...userInfo,
      ...requestInfo,
      metadata: {
        operation: "update",
        success: true,
      },
    });
  }

  /**
   * Log a DELETE operation
   */
  static async logDelete(
    resourceType,
    resourceId,
    oldData,
    userInfo,
    requestInfo
  ) {
    await this.logAudit({
      action: "DELETE",
      resourceType,
      resourceId,
      oldData,
      ...userInfo,
      ...requestInfo,
      metadata: {
        operation: "delete",
        success: true,
      },
    });
  }

  /**
   * Log a READ operation (optional, can be enabled for sensitive data)
   */
  static async logRead(resourceType, resourceId, userInfo, requestInfo) {
    await this.logAudit({
      action: "READ",
      resourceType,
      resourceId,
      ...userInfo,
      ...requestInfo,
      metadata: {
        operation: "read",
        success: true,
      },
    });
  }

  /**
   * Log a failed operation
   */
  static async logFailure(
    action,
    resourceType,
    resourceId,
    error,
    userInfo,
    requestInfo
  ) {
    await this.logAudit({
      action: `${action}_FAILED`,
      resourceType,
      resourceId,
      ...userInfo,
      ...requestInfo,
      metadata: {
        operation: action.toLowerCase(),
        success: false,
        error: error.message,
        errorStack: error.stack,
      },
    });
  }

  /**
   * Sanitize data by removing sensitive information
   */
  static sanitizeData(data) {
    if (!data || typeof data !== "object") {
      return data;
    }

    const sensitiveFields = ["password", "token", "secret", "key", "auth"];
    const sanitized = { ...data };

    // Remove sensitive fields
    sensitiveFields.forEach((field) => {
      Object.keys(sanitized).forEach((key) => {
        if (key.toLowerCase().includes(field)) {
          sanitized[key] = "[REDACTED]";
        }
      });
    });

    return sanitized;
  }

  /**
   * Detect changes between old and new data
   */
  static detectChanges(oldData, newData) {
    if (!oldData || !newData) {
      return null;
    }

    const changes = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    allKeys.forEach((key) => {
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue: this.sanitizeData(oldValue),
          newValue: this.sanitizeData(newValue),
        });
      }
    });

    return changes.length > 0 ? changes : null;
  }

  /**
   * Extract user information from request
   */
  static extractUserInfo(req) {
    return {
      userId: req.user?.id || req.user?.userId || null,
      userEmail: req.user?.email || req.user?.userEmail || null,
    };
  }

  /**
   * Extract request information
   */
  static extractRequestInfo(req) {
    return {
      ipAddress:
        req.ip ||
        req.connection.remoteAddress ||
        req.headers["x-forwarded-for"],
      userAgent: req.get("User-Agent") || "unknown",
    };
  }

  /**
   * Create a complete audit context from request
   */
  static createAuditContext(req) {
    return {
      ...this.extractUserInfo(req),
      ...this.extractRequestInfo(req),
    };
  }
}

export default AuditService;
