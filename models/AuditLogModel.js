import mongoose from "mongoose";

class AuditLogModel {
  static db = null;

  static setDatabase(database) {
    this.db = database;
  }

  static async create(auditData) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }

      const auditLog = {
        ...auditData,
        timestamp: new Date(),
        createdAt: new Date(),
      };

      const result = await this.db.collection("logs").insertOne(auditLog);
      console.log("✅ Audit log created:", result.insertedId);

      return result;
    } catch (error) {
      console.error("❌ Error creating audit log:", error);
      throw error;
    }
  }

  static async findAll(filters = {}, options = {}) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }

      const {
        page = 1,
        limit = 50,
        sortBy = "timestamp",
        sortOrder = -1,
      } = options;

      const skip = (page - 1) * limit;

      const query = this.buildQuery(filters);
      const sort = { [sortBy]: sortOrder };

      const [logs, totalCount] = await Promise.all([
        this.db
          .collection("logs")
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.db.collection("logs").countDocuments(query),
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
      console.error("❌ Error fetching audit logs:", error);
      throw error;
    }
  }

  static async findByResourceId(resourceId, resourceType) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }

      const logs = await this.db
        .collection("logs")
        .find({
          resourceId: resourceId,
          resourceType: resourceType,
        })
        .sort({ timestamp: -1 })
        .toArray();

      return logs;
    } catch (error) {
      console.error("❌ Error fetching audit logs by resource:", error);
      throw error;
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }

      const {
        page = 1,
        limit = 50,
        sortBy = "timestamp",
        sortOrder = -1,
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const [logs, totalCount] = await Promise.all([
        this.db
          .collection("logs")
          .find({ userId: userId })
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.db.collection("logs").countDocuments({ userId: userId }),
      ]);

      return {
        logs,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error("❌ Error fetching audit logs by user:", error);
      throw error;
    }
  }

  static async findByDateRange(startDate, endDate, options = {}) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }

      const {
        page = 1,
        limit = 50,
        sortBy = "timestamp",
        sortOrder = -1,
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const query = {
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };

      const [logs, totalCount] = await Promise.all([
        this.db
          .collection("logs")
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.db.collection("logs").countDocuments(query),
      ]);

      return {
        logs,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error("❌ Error fetching audit logs by date range:", error);
      throw error;
    }
  }

  static async getStatistics() {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }

      // Get total count of all logs
      const totalLogs = await this.db.collection("logs").countDocuments({});

      // Get action statistics (CREATE, UPDATE, DELETE counts)
      const actionPipeline = [
        {
          $match: {
            action: { $in: ["CREATE", "UPDATE", "DELETE"] },
          },
        },
        {
          $group: {
            _id: "$action",
            count: { $sum: 1 },
          },
        },
      ];

      const actionStats = await this.db
        .collection("logs")
        .aggregate(actionPipeline)
        .toArray();

      // Convert to object format expected by frontend
      const actionStatsObj = {
        CREATE: 0,
        UPDATE: 0,
        DELETE: 0,
      };

      actionStats.forEach((stat) => {
        actionStatsObj[stat._id] = stat.count;
      });

      // Get today's logs count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayLogs = await this.db.collection("logs").countDocuments({
        action: { $in: ["CREATE", "UPDATE", "DELETE"] },
        timestamp: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      });

      // Get this week's logs count
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const weekLogs = await this.db.collection("logs").countDocuments({
        action: { $in: ["CREATE", "UPDATE", "DELETE"] },
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
      console.error("❌ Error fetching audit log statistics:", error);
      throw error;
    }
  }

  static buildQuery(filters) {
    const query = {};

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
