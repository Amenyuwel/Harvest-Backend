import mongoose from "mongoose";

class ReportModel {
  static db = null;

  static setDatabase(database) {
    this.db = database;
  }

  static async findAll() {
    try {
      console.log("Database connected:", !!this.db);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const reports = await this.db.collection("reports").find({}).toArray();
      console.log("✅ Found reports:", reports.length);

      return reports;
    } catch (error) {
      console.error("❌ Error in ReportModel.findAll:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      console.log("Database connected:", !!this.db);
      console.log("Finding report ID:", id);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const report = await this.db.collection("reports").findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      console.log("✅ Found report:", !!report);
      return report;
    } catch (error) {
      console.error("❌ Error in ReportModel.findById:", error);
      throw error;
    }
  }
}

export default ReportModel;
