import mongoose from "mongoose";

class FarmerModel {
  static db = null;

  static setDatabase(database) {
    this.db = database;
  }

  static async countByBarangay(barangayId) {
    try {
      console.log("Database connected:", !!this.db);
      console.log("Barangay ID:", barangayId);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const count = await this.db.collection("farmers").countDocuments({
        barangay: barangayId,
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
      console.log("Database connected:", !!this.db);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const farmers = await this.db.collection("farmers").find({}).toArray();
      console.log("✅ Found farmers:", farmers.length);

      return farmers;
    } catch (error) {
      console.error("❌ Error in FarmerModel.findAll:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      console.log("Database connected:", !!this.db);
      console.log("Finding farmer ID:", id);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const farmer = await this.db.collection("farmers").findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      console.log("✅ Found farmer:", !!farmer);
      return farmer;
    } catch (error) {
      console.error("❌ Error in FarmerModel.findById:", error);
      throw error;
    }
  }

  static async create(farmerData) {
    try {
      console.log("Database connected:", !!this.db);
      console.log("Data to insert:", farmerData);

      if (!this.db) {
        throw new Error("Database not connected");
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

  static async updateById(id, updateData) {
    try {
      console.log("Database connected:", !!this.db);
      console.log("Updating farmer ID:", id);
      console.log("Update data:", updateData);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const result = await this.db.collection("farmers").updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $set: {
            ...updateData,
            updatedAt: new Date(),
          },
        }
      );

      console.log("✅ Update result:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in FarmerModel.updateById:", error);
      throw error;
    }
  }

  static async deleteById(id) {
    try {
      console.log("Database connected:", !!this.db);
      console.log("Deleting farmer ID:", id);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const result = await this.db.collection("farmers").deleteOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      console.log("✅ Delete result:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in FarmerModel.deleteById:", error);
      throw error;
    }
  }
}

export default FarmerModel;
