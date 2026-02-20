import type { Request } from 'express';
import AuditLogModel from '@/models/AuditLogModel.js';
import type { AuthenticatedRequest } from '@/types/index.js';

interface AuditData {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface UserInfo {
  userId?: string | null;
  userEmail?: string | null;
}

interface RequestInfo {
  ipAddress?: string;
  userAgent?: string;
}

interface ChangeRecord {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

class AuditService {
  /**
   * Log an audit event
   */
  static async logAudit(auditData: AuditData): Promise<void> {
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
        console.warn('⚠️ Audit log missing required fields:', {
          action,
          resourceType,
        });
        return;
      }

      // Log warning if no user context available
      if ((!userId || userId === 'system') && (!userEmail || userEmail === 'system@harvest.com')) {
        console.warn('⚠️ Audit log created without user context:', {
          action,
          resourceType,
          resourceId,
        });
      }

      const auditLog = {
        action: action.toUpperCase(),
        resourceType: resourceType.toLowerCase(),
        resourceId: resourceId || undefined,
        userId: userId || undefined,
        userEmail: userEmail || undefined,
        userAgent: userAgent || 'unknown',
        metadata: metadata,
        changes: AuditService.detectChanges(oldData, newData),
        timestamp: new Date(),
      };

      await AuditLogModel.create(auditLog);
      console.log(`✅ Audit logged: ${action} ${resourceType} ${resourceId || ''}`);
    } catch (error) {
      console.error('❌ Error logging audit:', error);
      // Don't throw error to prevent breaking the main operation
    }
  }

  /**
   * Log a CREATE operation
   */
  static async logCreate(
    resourceType: string,
    resourceId: string,
    newData: Record<string, unknown>,
    userInfo: UserInfo,
    requestInfo: RequestInfo
  ): Promise<void> {
    await AuditService.logAudit({
      action: 'CREATE',
      resourceType,
      resourceId,
      newData,
      ...userInfo,
      ...requestInfo,
      metadata: {
        operation: 'create',
        success: true,
      },
    });
  }

  /**
   * Log an UPDATE operation
   */
  static async logUpdate(
    resourceType: string,
    resourceId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    userInfo: UserInfo,
    requestInfo: RequestInfo
  ): Promise<void> {
    await AuditService.logAudit({
      action: 'UPDATE',
      resourceType,
      resourceId,
      oldData,
      newData,
      ...userInfo,
      ...requestInfo,
      metadata: {
        operation: 'update',
        success: true,
      },
    });
  }

  /**
   * Log a DELETE operation
   */
  static async logDelete(
    resourceType: string,
    resourceId: string,
    oldData: Record<string, unknown>,
    userInfo: UserInfo,
    requestInfo: RequestInfo
  ): Promise<void> {
    await AuditService.logAudit({
      action: 'DELETE',
      resourceType,
      resourceId,
      oldData,
      ...userInfo,
      ...requestInfo,
      metadata: {
        operation: 'delete',
        success: true,
      },
    });
  }

  /**
   * Log a READ operation (optional, can be enabled for sensitive data)
   */
  static async logRead(
    resourceType: string,
    resourceId: string,
    userInfo: UserInfo,
    requestInfo: RequestInfo
  ): Promise<void> {
    await AuditService.logAudit({
      action: 'READ',
      resourceType,
      resourceId,
      ...userInfo,
      ...requestInfo,
      metadata: {
        operation: 'read',
        success: true,
      },
    });
  }

  /**
   * Log a failed operation
   */
  static async logFailure(
    action: string,
    resourceType: string,
    resourceId: string | undefined,
    error: Error,
    userInfo: UserInfo,
    requestInfo: RequestInfo
  ): Promise<void> {
    await AuditService.logAudit({
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
  static sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data } as Record<string, unknown>;

    // Remove sensitive fields
    for (const field of sensitiveFields) {
      for (const key of Object.keys(sanitized)) {
        if (key.toLowerCase().includes(field)) {
          sanitized[key] = '[REDACTED]';
        }
      }
    }

    return sanitized;
  }

  /**
   * Detect changes between old and new data
   */
  static detectChanges(
    oldData: Record<string, unknown> | undefined,
    newData: Record<string, unknown> | undefined
  ): ChangeRecord[] | null {
    if (!oldData || !newData) {
      return null;
    }

    const changes: ChangeRecord[] = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      const oldValue = oldData[key];
      const newValue = newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue: AuditService.sanitizeData(oldValue),
          newValue: AuditService.sanitizeData(newValue),
        });
      }
    }

    return changes.length > 0 ? changes : null;
  }

  /**
   * Extract user information from request
   */
  static extractUserInfo(req: AuthenticatedRequest): UserInfo {
    return {
      userId: req.user?.userId || null,
      userEmail: req.user?.email || null,
    };
  }

  /**
   * Extract request information
   */
  static extractRequestInfo(req: Request): RequestInfo {
    return {
      ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
    };
  }

  /**
   * Create a complete audit context from request
   */
  static createAuditContext(req: AuthenticatedRequest): UserInfo & RequestInfo {
    return {
      ...AuditService.extractUserInfo(req),
      ...AuditService.extractRequestInfo(req),
    };
  }
}

export default AuditService;
