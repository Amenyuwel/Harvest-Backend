import type { Db, DeleteResult, Document, InsertOneResult, UpdateResult, WithId } from 'mongodb';
import mongoose from 'mongoose';

interface CropDocument {
  cropId: string;
  cropName: string;
  cropType?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCropDto {
  cropId: string;
  cropName: string;
  cropType?: string;
}

class CropsModel {
  static db: Db | null = null;

  static setDatabase(database: Db): void {
    CropsModel.db = database;
  }

  static async findAll(): Promise<WithId<Document>[]> {
    try {
      if (!CropsModel.db) {
        throw new Error('Database not connected');
      }
      const crops = await CropsModel.db.collection('crops').find({}).toArray();
      return crops;
    } catch (error) {
      console.error('Error in CropsModel.findAll:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<WithId<Document> | null> {
    try {
      if (!CropsModel.db) {
        throw new Error('Database not connected');
      }
      const { ObjectId } = mongoose.Types;
      const crop = await CropsModel.db.collection('crops').findOne({ _id: new ObjectId(id) });
      return crop;
    } catch (error) {
      console.error('Error in CropsModel.findById:', error);
      throw error;
    }
  }

  static async findByCropId(cropId: string): Promise<WithId<Document> | null> {
    try {
      if (!CropsModel.db) {
        throw new Error('Database not connected');
      }
      const crop = await CropsModel.db.collection('crops').findOne({ cropId });
      return crop;
    } catch (error) {
      console.error('Error in CropsModel.findByCropId:', error);
      throw error;
    }
  }

  static async create(cropData: CreateCropDto): Promise<InsertOneResult> {
    try {
      if (!CropsModel.db) {
        throw new Error('Database not connected');
      }
      const result = await CropsModel.db.collection('crops').insertOne({
        ...cropData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return result;
    } catch (error) {
      console.error('Error in CropsModel.create:', error);
      throw error;
    }
  }

  static async update(id: string, cropData: Partial<CreateCropDto>): Promise<UpdateResult> {
    try {
      if (!CropsModel.db) {
        throw new Error('Database not connected');
      }
      const { ObjectId } = mongoose.Types;
      const result = await CropsModel.db.collection('crops').updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...cropData,
            updatedAt: new Date(),
          },
        }
      );
      return result;
    } catch (error) {
      console.error('Error in CropsModel.update:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<DeleteResult> {
    try {
      if (!CropsModel.db) {
        throw new Error('Database not connected');
      }
      const { ObjectId } = mongoose.Types;
      const result = await CropsModel.db.collection('crops').deleteOne({
        _id: new ObjectId(id),
      });
      return result;
    } catch (error) {
      console.error('Error in CropsModel.delete:', error);
      throw error;
    }
  }

  // Search crops by name or type
  static async search(searchTerm: string): Promise<WithId<Document>[]> {
    try {
      if (!CropsModel.db) {
        throw new Error('Database not connected');
      }
      const crops = await CropsModel.db
        .collection('crops')
        .find({
          $or: [
            { cropName: { $regex: searchTerm, $options: 'i' } },
            { cropType: { $regex: searchTerm, $options: 'i' } },
          ],
        })
        .toArray();
      return crops;
    } catch (error) {
      console.error('Error in CropsModel.search:', error);
      throw error;
    }
  }
}

export default CropsModel;
