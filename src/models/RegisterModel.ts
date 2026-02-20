import { ObjectId } from 'mongodb';
import type { Collection, Db, Document, WithId } from 'mongodb';

interface AdminData {
  username: string;
  email: string;
  password: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string | null;
  role?: string;
  isActive?: boolean;
}

interface AdminDocument extends AdminData {
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}

class RegisterModel {
  static db: Db | null = null;
  static collection: Collection | null = null;

  static setDatabase(database: Db): void {
    RegisterModel.db = database;
    RegisterModel.collection = database.collection('admin');
  }

  static async findByUsername(username: string): Promise<WithId<Document> | null> {
    try {
      if (!RegisterModel.collection) {
        throw new Error('Database not connected');
      }
      const admin = await RegisterModel.collection.findOne({ username });
      return admin;
    } catch (error) {
      throw new Error(`Error finding admin by username: ${(error as Error).message}`);
    }
  }

  static async findByEmail(email: string): Promise<WithId<Document> | null> {
    try {
      if (!RegisterModel.collection) {
        throw new Error('Database not connected');
      }
      const admin = await RegisterModel.collection.findOne({ email });
      return admin;
    } catch (error) {
      throw new Error(`Error finding admin by email: ${(error as Error).message}`);
    }
  }

  static async createAdmin(adminData: AdminData): Promise<{ _id: ObjectId } & AdminDocument> {
    try {
      if (!RegisterModel.collection) {
        throw new Error('Database not connected');
      }
      const now = new Date();

      const newAdmin: AdminDocument = {
        ...adminData,
        createdAt: now,
        updatedAt: now,
        lastLogin: null,
      };

      const result = await RegisterModel.collection.insertOne(newAdmin);

      if (result.acknowledged) {
        return {
          _id: result.insertedId,
          ...newAdmin,
        };
      }
      throw new Error('Failed to create admin');
    } catch (error) {
      throw new Error(`Error creating admin: ${(error as Error).message}`);
    }
  }

  static async findById(id: string): Promise<WithId<Document> | null> {
    try {
      if (!RegisterModel.collection) {
        throw new Error('Database not connected');
      }
      const admin = await RegisterModel.collection.findOne({
        _id: new ObjectId(id),
      });
      return admin;
    } catch (error) {
      throw new Error(`Error finding admin by ID: ${(error as Error).message}`);
    }
  }
}

export default RegisterModel;
