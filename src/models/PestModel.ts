import type { Db, DeleteResult, Document, InsertOneResult, UpdateResult, WithId } from 'mongodb';
import mongoose from 'mongoose';

interface CreatePestDto {
  pestId?: string;
  pestName: string;
  pestType?: string;
  recommendations?: string[];
  activeMonth?: string[];
  season?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class PestModel {
  static db: Db | null = null;

  static setDatabase(database: Db): void {
    PestModel.db = database;
  }

  static async findAll(): Promise<WithId<Document>[]> {
    try {
      console.log('Database connected:', !!PestModel.db);

      if (!PestModel.db) {
        throw new Error('Database not connected');
      }

      const pests = await PestModel.db.collection('pests').find({}).toArray();
      console.log('✅ Found pests:', pests.length);

      return pests;
    } catch (error) {
      console.error('❌ Error in PestModel.findAll:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<WithId<Document> | null> {
    try {
      console.log('Database connected:', !!PestModel.db);
      console.log('Pest ID:', id);

      if (!PestModel.db) {
        throw new Error('Database not connected');
      }

      const pest = await PestModel.db.collection('pests').findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      console.log('✅ Found pest:', pest);
      return pest;
    } catch (error) {
      console.error('❌ Error in PestModel.findById:', error);
      throw error;
    }
  }

  static async create(pestData: CreatePestDto): Promise<InsertOneResult> {
    try {
      console.log('Database connected:', !!PestModel.db);
      console.log('Data to insert:', pestData);

      if (!PestModel.db) {
        throw new Error('Database not connected');
      }

      const result = await PestModel.db.collection('pests').insertOne({
        ...pestData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Insert result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in PestModel.create:', error);
      throw error;
    }
  }

  static async updateById(id: string, updateData: Partial<CreatePestDto>): Promise<UpdateResult> {
    try {
      console.log('Database connected:', !!PestModel.db);
      console.log('Updating pest ID:', id);
      console.log('Update data:', updateData);

      if (!PestModel.db) {
        throw new Error('Database not connected');
      }

      const result = await PestModel.db.collection('pests').updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        }
      );

      console.log('✅ Update result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in PestModel.updateById:', error);
      throw error;
    }
  }

  static async deleteById(id: string): Promise<DeleteResult> {
    try {
      console.log('Database connected:', !!PestModel.db);
      console.log('Deleting pest ID:', id);

      if (!PestModel.db) {
        throw new Error('Database not connected');
      }

      const result = await PestModel.db.collection('pests').deleteOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      console.log('✅ Delete result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in PestModel.deleteById:', error);
      throw error;
    }
  }
}

export default PestModel;
