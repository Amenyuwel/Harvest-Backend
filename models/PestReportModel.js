import mongoose from "mongoose";

class PestReportModel {
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

      const pestReports = await this.db.collection("pestReports").find({}).toArray();
      console.log("✅ Found pest reports:", pestReports.length);

      return pestReports;
    } catch (error) {
      console.error("❌ Error in PestReportModel.findAll:", error);
      throw error;
    }
  }
}

export default PestReportModel;
