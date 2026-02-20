import type { Db, DeleteResult, Document, InsertOneResult, UpdateResult, WithId } from 'mongodb';
import mongoose from 'mongoose';
import type { CreateFarmerDto } from '../types/index.js';

class FarmerModel {
  static db: Db | null = null;

  static setDatabase(database: Db): void {
    FarmerModel.db = database;
  }

  static async countByBarangay(barangayId: string): Promise<number> {
    try {
      console.log('Database connected:', !!FarmerModel.db);
      console.log('Barangay ID:', barangayId);

      if (!FarmerModel.db) {
        throw new Error('Database not connected');
      }

      const count = await FarmerModel.db.collection('farmers').countDocuments({
        barangay: barangayId,
      });

      console.log('✅ Count result:', count);
      return count;
    } catch (error) {
      console.error('❌ Error in FarmerModel.countByBarangay:', error);
      throw error;
    }
  }

  static async findAll(): Promise<WithId<Document>[]> {
    try {
      console.log('Database connected:', !!FarmerModel.db);

      if (!FarmerModel.db) {
        throw new Error('Database not connected');
      }

      const farmers = await FarmerModel.db.collection('farmers').find({}).toArray();
      console.log('✅ Found farmers:', farmers.length);

      return farmers;
    } catch (error) {
      console.error('❌ Error in FarmerModel.findAll:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<WithId<Document> | null> {
    try {
      console.log('Database connected:', !!FarmerModel.db);
      console.log('Finding farmer ID:', id);

      if (!FarmerModel.db) {
        throw new Error('Database not connected');
      }

      const farmer = await FarmerModel.db.collection('farmers').findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      console.log('✅ Found farmer:', !!farmer);
      return farmer;
    } catch (error) {
      console.error('❌ Error in FarmerModel.findById:', error);
      throw error;
    }
  }

  static async create(farmerData: CreateFarmerDto): Promise<InsertOneResult> {
    try {
      console.log('Database connected:', !!FarmerModel.db);
      console.log('Data to insert:', farmerData);

      if (!FarmerModel.db) {
        throw new Error('Database not connected');
      }

      const result = await FarmerModel.db.collection('farmers').insertOne({
        ...farmerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('✅ Insert result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in FarmerModel.create:', error);
      throw error;
    }
  }

  static async updateById(id: string, updateData: Partial<CreateFarmerDto>): Promise<UpdateResult> {
    try {
      console.log('Database connected:', !!FarmerModel.db);
      console.log('Updating farmer ID:', id);
      console.log('Update data:', updateData);

      if (!FarmerModel.db) {
        throw new Error('Database not connected');
      }

      const result = await FarmerModel.db.collection('farmers').updateOne(
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
      console.error('❌ Error in FarmerModel.updateById:', error);
      throw error;
    }
  }

  static async deleteById(id: string): Promise<DeleteResult> {
    try {
      console.log('Database connected:', !!FarmerModel.db);
      console.log('Deleting farmer ID:', id);

      if (!FarmerModel.db) {
        throw new Error('Database not connected');
      }

      const result = await FarmerModel.db.collection('farmers').deleteOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      console.log('✅ Delete result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in FarmerModel.deleteById:', error);
      throw error;
    }
  }
}

export default FarmerModel;
