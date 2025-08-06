import { ObjectId } from "mongodb";

class BarangayModel {
  constructor(db) {
    this.db = db;
    this.collection = db.collection("barangays");
  }

  static setDatabase(database) {
    BarangayModel.db = database;
    BarangayModel.collection = database.collection("barangays");
  }

  // Get all barangays
  static async findAll() {
    try {
      const barangays = await BarangayModel.collection.find({}).toArray();
      return barangays;
    } catch (error) {
      throw new Error("Error finding barangays: " + error.message);
    }
  }

  // Find barangay by ID
  static async findById(id) {
    try {
      const barangay = await BarangayModel.collection.findOne({
        _id: new ObjectId(id),
      });
      return barangay;
    } catch (error) {
      throw new Error("Error finding barangay by ID: " + error.message);
    }
  }

  // Find barangay by barangay_id
  static async findByBarangayId(barangay_id) {
    try {
      const barangay = await BarangayModel.collection.findOne({
        barangay_id: barangay_id,
      });
      return barangay;
    } catch (error) {
      throw new Error(
        "Error finding barangay by barangay_id: " + error.message
      );
    }
  }

  // Find barangay by name
  static async findByName(barangay_name) {
    try {
      const barangay = await BarangayModel.collection.findOne({
        barangay_name: barangay_name,
      });
      return barangay;
    } catch (error) {
      throw new Error("Error finding barangay by name: " + error.message);
    }
  }

  // Create new barangay
  static async createBarangay(barangayData) {
    try {
      const now = new Date();

      const newBarangay = {
        ...barangayData,
        created_at: now,
        updated_at: now,
      };

      const result = await BarangayModel.collection.insertOne(newBarangay);

      if (result.acknowledged) {
        return {
          _id: result.insertedId,
          ...newBarangay,
        };
      } else {
        throw new Error("Failed to create barangay");
      }
    } catch (error) {
      throw new Error("Error creating barangay: " + error.message);
    }
  }

  // Update barangay
  static async updateBarangay(id, updateData) {
    try {
      const now = new Date();

      const result = await BarangayModel.collection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...updateData,
            updated_at: now,
          },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error("Barangay not found");
      }

      return result;
    } catch (error) {
      throw new Error("Error updating barangay: " + error.message);
    }
  }

  // Delete barangay
  static async deleteBarangay(id) {
    try {
      const result = await BarangayModel.collection.deleteOne({
        _id: new ObjectId(id),
      });

      if (result.deletedCount === 0) {
        throw new Error("Barangay not found");
      }

      return result;
    } catch (error) {
      throw new Error("Error deleting barangay: " + error.message);
    }
  }

  // Search barangays by name (partial match)
  static async searchByName(searchTerm) {
    try {
      const barangays = await BarangayModel.collection
        .find({
          barangay_name: { $regex: searchTerm, $options: "i" },
        })
        .toArray();
      return barangays;
    } catch (error) {
      throw new Error("Error searching barangays: " + error.message);
    }
  }
}

export default BarangayModel;
