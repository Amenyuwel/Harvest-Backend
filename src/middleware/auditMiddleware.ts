import type { NextFunction, Response } from 'express';
import AuditService from '@/services/AuditService.js';
import type { AuthenticatedRequest } from '@/types/index.js';

// Extend Express Request type for audit data
interface AuditRequest extends AuthenticatedRequest {
  auditStartTime?: number;
  auditContext?: ReturnType<typeof AuditService.createAuditContext>;
}

// Extend Express Response type for audit data
interface AuditResponse extends Response {
  auditResponseData?: unknown;
  auditResponseTime?: number;
}

/**
 * Middleware to automatically log HTTP requests
 */
export const auditRequestMiddleware = (
  req: AuditRequest,
  res: AuditResponse,
  next: NextFunction
): void => {
  // Store original res.json to intercept responses
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Capture request start time
  req.auditStartTime = Date.now();

  // Extract audit context
  req.auditContext = AuditService.createAuditContext(req);

  // Override res.json to capture response
  res.json = (data: unknown) => {
    res.auditResponseData = data;
    res.auditResponseTime = Date.now() - (req.auditStartTime || 0);
    return originalJson(data);
  };

  // Override res.send to capture response
  res.send = (data: unknown) => {
    res.auditResponseData = data;
    res.auditResponseTime = Date.now() - (req.auditStartTime || 0);
    return originalSend(data);
  };

  next();
};

/**
 * Middleware to log successful operations after response
 */
export const auditResponseMiddleware = (
  req: AuditRequest,
  res: AuditResponse,
  next: NextFunction
): void => {
  res.on('finish', async () => {
    try {
      // Only log non-audit API calls to prevent infinite loops
      if (req.path.startsWith('/api/audit')) {
        return;
      }

      // Only log significant operations (POST, PUT, DELETE)
      const methodsToLog = ['POST', 'PUT', 'PATCH', 'DELETE'];
      if (!methodsToLog.includes(req.method)) {
        return;
      }

      // Only log successful operations
      if (res.statusCode >= 400) {
        return;
      }

      // Determine action based on HTTP method
      let action: string;
      switch (req.method) {
        case 'POST':
          action = 'CREATE';
          break;
        case 'PUT':
        case 'PATCH':
          action = 'UPDATE';
          break;
        case 'DELETE':
          action = 'DELETE';
          break;
        default:
          return;
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
        resourceId: resourceId || undefined,
        newData: req.body as Record<string, unknown>,
        ...req.auditContext,
        metadata: {
          httpMethod: req.method,
          url: req.path,
          statusCode: res.statusCode,
          responseTime: res.auditResponseTime,
          userAgent: req.get('User-Agent'),
        },
      });
    } catch (error) {
      console.error('❌ Error in audit response middleware:', error);
    }
  });

  next();
};

/**
 * Extract resource type from URL path
 */
function extractResourceTypeFromUrl(path: string): string | null {
  const resourceMap: Record<string, string> = {
    '/api/farmers': 'farmer',
    '/api/crops': 'crop',
    '/api/barangays': 'barangay',
    '/api/pests': 'pest',
    '/api/reports': 'report',
    '/api/auth/register': 'user_registration',
    '/api/auth/login': 'user_login',
  };

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
function extractResourceIdFromRequest(req: AuditRequest, res: AuditResponse): string | null {
  // Try to get ID from URL parameters
  if (req.params.id) {
    return req.params.id;
  }

  // Try to get ID from response data
  if (res.auditResponseData && typeof res.auditResponseData === 'object') {
    const data = res.auditResponseData as Record<string, unknown>;

    // Check common ID field patterns
    if (data.data && typeof data.data === 'object') {
      const nestedData = data.data as Record<string, unknown>;
      if (nestedData._id) return String(nestedData._id);
      if (nestedData.id) return String(nestedData.id);
    }

    if (data._id) return String(data._id);
    if (data.id) return String(data.id);
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
  create: async (
    resourceType: string,
    resourceId: string,
    newData: Record<string, unknown>,
    req: AuthenticatedRequest
  ): Promise<void> => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logCreate(resourceType, resourceId, newData, auditContext, {});
  },

  /**
   * Log an update operation
   */
  update: async (
    resourceType: string,
    resourceId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    req: AuthenticatedRequest
  ): Promise<void> => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logUpdate(resourceType, resourceId, oldData, newData, auditContext, {});
  },

  /**
   * Log a delete operation
   */
  delete: async (
    resourceType: string,
    resourceId: string,
    oldData: Record<string, unknown>,
    req: AuthenticatedRequest
  ): Promise<void> => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logDelete(resourceType, resourceId, oldData, auditContext, {});
  },

  /**
   * Log a read operation
   */
  read: async (
    resourceType: string,
    resourceId: string,
    req: AuthenticatedRequest
  ): Promise<void> => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logRead(resourceType, resourceId, auditContext, {});
  },

  /**
   * Log a failure
   */
  failure: async (
    action: string,
    resourceType: string,
    resourceId: string | undefined,
    error: Error,
    req: AuthenticatedRequest
  ): Promise<void> => {
    const auditContext = AuditService.createAuditContext(req);
    await AuditService.logFailure(action, resourceType, resourceId || '', error, auditContext, {});
  },
};
