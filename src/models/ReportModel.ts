import type { Db, Document, WithId } from 'mongodb';
import mongoose from 'mongoose';

class ReportModel {
  static db: Db | null = null;

  static setDatabase(database: Db): void {
    ReportModel.db = database;
  }

  static async findAll(): Promise<WithId<Document>[]> {
    try {
      console.log('Database connected:', !!ReportModel.db);

      if (!ReportModel.db) {
        throw new Error('Database not connected');
      }

      const reports = await ReportModel.db.collection('reports').find({}).toArray();
      console.log('✅ Found reports:', reports.length);

      return reports;
    } catch (error) {
      console.error('❌ Error in ReportModel.findAll:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<WithId<Document> | null> {
    try {
      console.log('Database connected:', !!ReportModel.db);
      console.log('Finding report ID:', id);

      if (!ReportModel.db) {
        throw new Error('Database not connected');
      }

      const report = await ReportModel.db.collection('reports').findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      console.log('✅ Found report:', !!report);
      return report;
    } catch (error) {
      console.error('❌ Error in ReportModel.findById:', error);
      throw error;
    }
  }
}

export default ReportModel;
