import { ObjectId } from "mongodb";

class RegisterModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection("admin");
  }

  static setDatabase(database) {
    RegisterModel.db = database;
    RegisterModel.collection = database.collection("admin");
  }

  static async findByUsername(username) {
    try {
      const admin = await RegisterModel.collection.findOne({ username });
      return admin;
    } catch (error) {
      throw new Error("Error finding admin by username: " + error.message);
    }
  }

  static async findByEmail(email) {
    try {
      const admin = await RegisterModel.collection.findOne({ email });
      return admin;
    } catch (error) {
      throw new Error("Error finding admin by email: " + error.message);
    }
  }

  static async createAdmin(adminData) {
    try {
      const now = new Date();

      const newAdmin = {
        ...adminData,
        createdAt: now,
        updatedAt: now,
        lastLogin: null,
      };

      const result = await RegisterModel.collection.insertOne(newAdmin);

      if (result.acknowledged) {
        // Return the created admin with the generated _id
        return {
          _id: result.insertedId,
          ...newAdmin,
        };
      } else {
        throw new Error("Failed to create admin");
      }
    } catch (error) {
      throw new Error("Error creating admin: " + error.message);
    }
  }

  static async findById(id) {
    try {
      const admin = await RegisterModel.collection.findOne({
        _id: new ObjectId(id),
      });
      return admin;
    } catch (error) {
      throw new Error("Error finding admin by ID: " + error.message);
    }
  }
}

export default RegisterModel;
