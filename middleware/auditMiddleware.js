import AuditService from "../services/AuditService.js";

/**
 * Middleware to automatically log HTTP requests
 */
export const auditRequestMiddleware = (req, res, next) => {
  // Store original res.json to intercept responses
  const originalJson = res.json;
  const originalSend = res.send;

  // Capture request start time
  req.auditStartTime = Date.now();

  // Extract audit context
  req.auditContext = AuditService.createAuditContext(req);

  // Override res.json to capture response
  res.json = function (data) {
    // Store response data for audit
    res.auditResponseData = data;
    res.auditResponseTime = Date.now() - req.auditStartTime;

    // Call original json method
    originalJson.call(this, data);
  };

  // Override res.send to capture response
  res.send = function (data) {
    // Store response data for audit
    res.auditResponseData = data;
    res.auditResponseTime = Date.now() - req.auditStartTime;

    // Call original send method
    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware to log successful operations after response
 */
export const auditResponseMiddleware = (req, res, next) => {
  res.on("finish", async () => {
    try {
      // Only log non-audit API calls to prevent infinite loops
      if (req.path.startsWith("/api/audit")) {
        return;
      }

      // Only log significant operations (POST, PUT, DELETE)
      const methodsToLog = ["POST", "PUT", "PATCH", "DELETE"];
      if (!methodsToLog.includes(req.method)) {
        return;
      }

      // Only log successful operations
      if (res.statusCode >= 400) {
        return;
      }

      // Determine action based on HTTP method
      let action;
      switch (req.method) {
        case "POST":
          action = "CREATE";
          break;
        case "PUT":
        case "PATCH":
          action = "UPDATE";
          break;
        case "DELETE":
          action = "DELETE";
          break;
        default:
          return; // Skip other methods
      }

      // Extract resource type from URL
      const resourceType = extractResourceTypeFromUrl(req.path);
      if (!resourceType) {
        return;
      }

      // Extract resource ID from URL or response
      const resourceId = extractResourceIdFromRequest(req, res);

      // Log the operation
      await AuditService.logAudit({
        action,
        resourceType,
        resourceId,
        newData: req.body,
        ...req.auditContext,
        metadata: {
          httpMethod: req.method,
          url: req.path,
          statusCode: res.statusCode,
          responseTime: res.auditResponseTime,
          userAgent: req.get("User-Agent"),
        },
      });
    } catch (error) {
      console.error("❌ Error in audit response middleware:", error);
      // Don't throw to prevent breaking the response
    }
  });

  next();
};

/**
 * Extract resource type from URL path
 */
function extractResourceTypeFromUrl(path) {
  const resourceMap = {
    "/api/farmers": "farmer",
    "/api/crops": "crop",
    "/api/barangays": "barangay",
    "/api/pests": "pest",
    "/api/reports": "report",
    "/api/auth/register": "user_registration",
    "/api/auth/login": "user_login",
  };

  // Find matching resource type
  for (const [urlPattern, resourceType] of Object.entries(resourceMap)) {
    if (path.startsWith(urlPattern)) {
      return resourceType;
    }
  }

  return null;
}

/**
 * Extract resource ID from request or response
 */
function extractResourceIdFromRequest(req, res) {
  // Try to get ID from URL parameters
  if (req.params.id) {
    return req.params.id;
  }

  // Try to get ID from response data
  if (res.auditResponseData && typeof res.auditResponseData === "object") {
    const data = res.auditResponseData;

    // Check common ID field patterns
    if (data.data && data.data._id) {
      return data.data._id;
    }

    if (data.data && data.data.id) {
      return data.data.id;
    }

    if (data._id) {
      return data._id;
    }

    if (data.id) {
      return data.id;
    }
  }

  return null;
}

/**
 * Manual audit logging helper for controllers
 */
export const auditLog = {
  /**
   * Log a create operation
   */
  create: async (resourceType, resourceId, newData, req) => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logCreate(
      resourceType,
      resourceId,
      newData,
      auditContext,
      {}
    );
  },

  /**
   * Log an update operation
   */
  update: async (resourceType, resourceId, oldData, newData, req) => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logUpdate(
      resourceType,
      resourceId,
      oldData,
      newData,
      auditContext,
      {}
    );
  },

  /**
   * Log a delete operation
   */
  delete: async (resourceType, resourceId, oldData, req) => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logDelete(
      resourceType,
      resourceId,
      oldData,
      auditContext,
      {}
    );
  },

  /**
   * Log a read operation
   */
  read: async (resourceType, resourceId, req) => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logRead(resourceType, resourceId, auditContext, {});
  },

  /**
   * Log a failure
   */
  failure: async (action, resourceType, resourceId, error, req) => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logFailure(
      action,
      resourceType,
      resourceId,
      error,
      auditContext,
      {}
    );
  },
};
