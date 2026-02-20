import type { Db, Document, InsertOneResult, WithId } from 'mongodb';

interface AuditLogData {
  action: string;
  resourceType: string;
  resourceId?: string;
  userId?: string;
  userName?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 1 | -1;
}

interface PaginatedResult {
  logs: WithId<Document>[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

interface AuditFilters {
  action?: string;
  resourceType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  ipAddress?: string;
}

interface ActionStats {
  CREATE: number;
  UPDATE: number;
  DELETE: number;
}

interface Statistics {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  actionStats: ActionStats;
}

class AuditLogModel {
  static db: Db | null = null;

  static setDatabase(database: Db): void {
    AuditLogModel.db = database;
  }

  static async create(auditData: AuditLogData): Promise<InsertOneResult> {
    try {
      if (!AuditLogModel.db) {
        throw new Error('Database not connected');
      }

      const auditLog = {
        ...auditData,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      const result = await AuditLogModel.db.collection('logs').insertOne(auditLog);
      console.log('✅ Audit log created:', result.insertedId);

      return result;
    } catch (error) {
      console.error('❌ Error creating audit log:', error);
      throw error;
    }
  }

  static async findAll(
    filters: AuditFilters = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult> {
    try {
      if (!AuditLogModel.db) {
        throw new Error('Database not connected');
      }

      const { page = 1, limit = 50, sortBy = 'timestamp', sortOrder = -1 } = options;

      const skip = (page - 1) * limit;

      const query = AuditLogModel.buildQuery(filters);
      const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      const [logs, totalCount] = await Promise.all([
        AuditLogModel.db
          .collection('logs')
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        AuditLogModel.db.collection('logs').countDocuments(query),
      ]);

      return {
        logs,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      };
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      throw error;
    }
  }

  static async findByResourceId(
    resourceId: string,
    resourceType: string
  ): Promise<WithId<Document>[]> {
    try {
      if (!AuditLogModel.db) {
        throw new Error('Database not connected');
      }

      const logs = await AuditLogModel.db
        .collection('logs')
        .find({
          resourceId: resourceId,
          resourceType: resourceType,
        })
        .sort({ timestamp: -1 })
        .toArray();

      return logs;
    } catch (error) {
      console.error('❌ Error fetching audit logs by resource:', error);
      throw error;
    }
  }

  static async findByUserId(
    userId: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult> {
    try {
      if (!AuditLogModel.db) {
        throw new Error('Database not connected');
      }

      const { page = 1, limit = 50, sortBy = 'timestamp', sortOrder = -1 } = options;

      const skip = (page - 1) * limit;
      const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      const [logs, totalCount] = await Promise.all([
        AuditLogModel.db
          .collection('logs')
          .find({ userId: userId })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        AuditLogModel.db.collection('logs').countDocuments({ userId: userId }),
      ]);

      return {
        logs,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error('❌ Error fetching audit logs by user:', error);
      throw error;
    }
  }

  static async findByDateRange(
    startDate: string,
    endDate: string,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult> {
    try {
      if (!AuditLogModel.db) {
        throw new Error('Database not connected');
      }

      const { page = 1, limit = 50, sortBy = 'timestamp', sortOrder = -1 } = options;

      const skip = (page - 1) * limit;
      const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder };

      const query = {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };

      const [logs, totalCount] = await Promise.all([
        AuditLogModel.db
          .collection('logs')
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        AuditLogModel.db.collection('logs').countDocuments(query),
      ]);

      return {
        logs,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error('❌ Error fetching audit logs by date range:', error);
      throw error;
    }
  }

  static async getStatistics(): Promise<Statistics> {
    try {
      if (!AuditLogModel.db) {
        throw new Error('Database not connected');
      }

      // Get total count of all logs
      const totalLogs = await AuditLogModel.db.collection('logs').countDocuments({});

      // Get action statistics (CREATE, UPDATE, DELETE counts)
      const actionPipeline = [
        {
          $match: {
            action: { $in: ['CREATE', 'UPDATE', 'DELETE'] },
          },
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
          },
        },
      ];

      const actionStats = await AuditLogModel.db
        .collection('logs')
        .aggregate(actionPipeline)
        .toArray();

      // Convert to object format expected by frontend
      const actionStatsObj: ActionStats = {
        CREATE: 0,
        UPDATE: 0,
        DELETE: 0,
      };

      for (const stat of actionStats) {
        const action = stat._id as keyof ActionStats;
        if (action in actionStatsObj) {
          actionStatsObj[action] = stat.count;
        }
      }

      // Get today's logs count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayLogs = await AuditLogModel.db.collection('logs').countDocuments({
        action: { $in: ['CREATE', 'UPDATE', 'DELETE'] },
        timestamp: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      });

      // Get this week's logs count
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekLogs = await AuditLogModel.db.collection('logs').countDocuments({
        action: { $in: ['CREATE', 'UPDATE', 'DELETE'] },
        timestamp: {
          $gte: weekStart,
          $lte: todayEnd,
        },
      });

      return {
        totalLogs,
        todayLogs,
        weekLogs,
        actionStats: actionStatsObj,
      };
    } catch (error) {
      console.error('❌ Error fetching audit log statistics:', error);
      throw error;
    }
  }

  static buildQuery(filters: AuditFilters): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.resourceType) {
      query.resourceType = filters.resourceType;
    }

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.startDate && filters.endDate) {
      query.timestamp = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    if (filters.ipAddress) {
      query.ipAddress = filters.ipAddress;
    }

    return query;
  }
}

export default AuditLogModel;
