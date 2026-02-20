import { ObjectId } from 'mongodb';
import type { Collection, Db, DeleteResult, Document, UpdateResult, WithId } from 'mongodb';

interface BarangayDocument {
  barangayId: string;
  barangayName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBarangayDto {
  barangayId: string;
  barangayName: string;
}

class BarangayModel {
  static db: Db | null = null;
  static collection: Collection | null = null;

  static setDatabase(database: Db): void {
    BarangayModel.db = database;
    BarangayModel.collection = database.collection('barangays');
  }

  // Get all barangays
  static async findAll(): Promise<WithId<Document>[]> {
    try {
      if (!BarangayModel.collection) {
        throw new Error('Database not connected');
      }
      const barangays = await BarangayModel.collection.find({}).toArray();
      return barangays;
    } catch (error) {
      throw new Error(`Error finding barangays: ${(error as Error).message}`);
    }
  }

  // Find barangay by ID
  static async findById(id: string): Promise<WithId<Document> | null> {
    try {
      if (!BarangayModel.collection) {
        throw new Error('Database not connected');
      }
      const barangay = await BarangayModel.collection.findOne({
        _id: new ObjectId(id),
      });
      return barangay;
    } catch (error) {
      throw new Error(`Error finding barangay by ID: ${(error as Error).message}`);
    }
  }

  // Find barangay by barangayId
  static async findByBarangayId(barangayId: string): Promise<WithId<Document> | null> {
    try {
      if (!BarangayModel.collection) {
        throw new Error('Database not connected');
      }
      const barangay = await BarangayModel.collection.findOne({
        barangayId: barangayId,
      });
      return barangay;
    } catch (error) {
      throw new Error(`Error finding barangay by barangayId: ${(error as Error).message}`);
    }
  }

  // Find barangay by name
  static async findByName(barangayName: string): Promise<WithId<Document> | null> {
    try {
      if (!BarangayModel.collection) {
        throw new Error('Database not connected');
      }
      const barangay = await BarangayModel.collection.findOne({
        barangayName: barangayName,
      });
      return barangay;
    } catch (error) {
      throw new Error(`Error finding barangay by name: ${(error as Error).message}`);
    }
  }

  // Create new barangay
  static async createBarangay(
    barangayData: CreateBarangayDto
  ): Promise<{ _id: ObjectId } & BarangayDocument> {
    try {
      if (!BarangayModel.collection) {
        throw new Error('Database not connected');
      }
      const now = new Date();

      const newBarangay: BarangayDocument = {
        ...barangayData,
        createdAt: now,
        updatedAt: now,
      };

      const result = await BarangayModel.collection.insertOne(newBarangay);

      if (result.acknowledged) {
        return {
          _id: result.insertedId,
          ...newBarangay,
        };
      }
      throw new Error('Failed to create barangay');
    } catch (error) {
      throw new Error(`Error creating barangay: ${(error as Error).message}`);
    }
  }

  // Update barangay
  static async updateBarangay(
    id: string,
    updateData: Partial<CreateBarangayDto>
  ): Promise<UpdateResult> {
    try {
      if (!BarangayModel.collection) {
        throw new Error('Database not connected');
      }
      const now = new Date();

      const result = await BarangayModel.collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,
            updatedAt: now,
          },
        }
      );

      return result;
    } catch (error) {
      throw new Error(`Error updating barangay: ${(error as Error).message}`);
    }
  }

  // Delete barangay
  static async deleteBarangay(id: string): Promise<DeleteResult> {
    try {
      if (!BarangayModel.collection) {
        throw new Error('Database not connected');
      }
      const result = await BarangayModel.collection.deleteOne({
        _id: new ObjectId(id),
      });
      return result;
    } catch (error) {
      throw new Error(`Error deleting barangay: ${(error as Error).message}`);
    }
  }

  // Search barangays by name
  static async searchByName(searchTerm: string): Promise<WithId<Document>[]> {
    try {
      if (!BarangayModel.collection) {
        throw new Error('Database not connected');
      }
      const barangays = await BarangayModel.collection
        .find({
          barangayName: { $regex: searchTerm, $options: 'i' },
        })
        .toArray();
      return barangays;
    } catch (error) {
      throw new Error(`Error searching barangays: ${(error as Error).message}`);
    }
  }
}

export default BarangayModel;
