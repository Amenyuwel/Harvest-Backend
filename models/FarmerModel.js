import mongoose from 'mongoose';

class FarmerModel {
  static db = null;

  static setDatabase(database) {
    this.db = database;
    console.log("✅ FarmerModel database set:", !!this.db);
  }

  static async countByBarangay(barangayId) {
    try {
      console.log("=== FARMER MODEL COUNT BY BARANGAY ===");
      console.log("Database connected:", !!this.db);
      console.log("Barangay ID:", barangayId);
      
      if (!this.db) {
        throw new Error('Database not connected');
      }
      
      const count = await this.db.collection("farmers").countDocuments({ 
        barangay: barangayId 
      });
      
      console.log("✅ Count result:", count);
      return count;
    } catch (error) {
      console.error("❌ Error in FarmerModel.countByBarangay:", error);
      throw error;
    }
  }

  static async findAll() {
    try {
      console.log("=== FARMER MODEL FIND ALL ===");
      console.log("Database connected:", !!this.db);
      
      if (!this.db) {
        throw new Error('Database not connected');
      }
      
      const farmers = await this.db.collection("farmers").find({}).toArray();
      console.log("✅ Found farmers:", farmers.length);
      
      return farmers;
    } catch (error) {
      console.error("❌ Error in FarmerModel.findAll:", error);
      throw error;
    }
  }

  static async create(farmerData) {
    try {
      console.log("=== FARMER MODEL CREATE ===");
      console.log("Database connected:", !!this.db);
      console.log("Data to insert:", farmerData);
      
      if (!this.db) {
        throw new Error('Database not connected');
      }
      
      const result = await this.db.collection("farmers").insertOne({
        ...farmerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log("✅ Insert result:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in FarmerModel.create:", error);
      throw error;
    }
  }
}

export default FarmerModel;