import type { Db } from 'mongodb';
import mongoose, { type Document, type Model } from 'mongoose';

// Admin document interface
interface AdminDocument extends Document {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  username: string;
  role: 'admin' | 'superAdmin';
  createdAt: Date;
  updatedAt: Date;
}

// Admin input interface (for creation)
interface AdminInput {
  email: string;
  password: string;
  name: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  username: string;
  role?: 'admin' | 'superAdmin';
}

const adminSchema = new mongoose.Schema<AdminDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'superAdmin'],
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

// Specify the collection name as the third parameter
const Admin: Model<AdminDocument> = mongoose.model<AdminDocument>('Admin', adminSchema, 'admin');

class LoginModel {
  static db: Db | null = null;

  // Add setDatabase method for compatibility with server.ts
  static setDatabase(database: Db): void {
    LoginModel.db = database;
  }

  // Find admin by email
  static async findByEmail(email: string): Promise<AdminDocument | null> {
    try {
      return await Admin.findOne({ email });
    } catch (error) {
      console.error('Error finding admin by email:', error);
      throw error;
    }
  }

  // Find admin by ID
  static async findById(id: string): Promise<AdminDocument | null> {
    try {
      return await Admin.findById(id).select('-password');
    } catch (error) {
      console.error('Error finding admin by ID:', error);
      throw error;
    }
  }

  // Create new admin
  static async create(adminData: AdminInput): Promise<AdminDocument> {
    try {
      const admin = new Admin(adminData);
      return await admin.save();
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  // Update admin
  static async update(id: string, adminData: Partial<AdminInput>): Promise<AdminDocument | null> {
    try {
      return await Admin.findByIdAndUpdate(id, adminData, {
        new: true,
        runValidators: true,
      }).select('-password');
    } catch (error) {
      console.error('Error updating admin:', error);
      throw error;
    }
  }

  // Delete admin
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await Admin.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error('Error deleting admin:', error);
      throw error;
    }
  }

  // Get all admins
  static async findAll(): Promise<AdminDocument[]> {
    try {
      return await Admin.find().select('-password');
    } catch (error) {
      console.error('Error finding all admins:', error);
      throw error;
    }
  }

  // Find admin by username
  static async findByUsername(username: string): Promise<AdminDocument | null> {
    try {
      return await Admin.findOne({ username });
    } catch (error) {
      console.error('Error finding admin by username:', error);
      throw error;
    }
  }

  // Find admin by ID and update
  static async findByIdAndUpdate(
    id: string,
    updateData: Partial<AdminInput>,
    options: { new?: boolean; runValidators?: boolean } = {}
  ): Promise<AdminDocument | null> {
    try {
      return await Admin.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        ...options,
      }).select('-password');
    } catch (error) {
      console.error('Error updating admin by ID:', error);
      throw error;
    }
  }
}

export default LoginModel;
