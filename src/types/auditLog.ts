import { BaseDocument, ObjectId } from './base';

export interface AuditLog extends BaseDocument {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entityType: string;
  entityId?: ObjectId;
  userId?: ObjectId;
  userName?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateAuditLogDto {
  action: AuditLog['action'];
  entityType: string;
  entityId?: ObjectId;
  userId?: ObjectId;
  userName?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
