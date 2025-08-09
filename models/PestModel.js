import mongoose from "mongoose";

class PestModel {
  static db = null;

  static setDatabase(database) {
    this.db = database;
  }

  static async findAll() {
    try {
      console.log("Database connected:", !!this.db);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const pests = await this.db.collection("pests").find({}).toArray();
      console.log("✅ Found pests:", pests.length);

      return pests;
    } catch (error) {
      console.error("❌ Error in PestModel.findAll:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      console.log("Database connected:", !!this.db);
      console.log("Pest ID:", id);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const pest = await this.db.collection("pests").findOne({
        _id: new mongoose.Types.ObjectId(id),
      });

      console.log("✅ Found pest:", pest);
      return pest;
    } catch (error) {
      console.error("❌ Error in PestModel.findById:", error);
      throw error;
    }
  }

  static async create(pestData) {
    try {
      console.log("Database connected:", !!this.db);
      console.log("Data to insert:", pestData);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const result = await this.db.collection("pests").insertOne({
        ...pestData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("✅ Insert result:", result);
      return result;
    } catch (error) {
      console.error("❌ Error in PestModel.create:", error);
      throw error;
    }
  }

  static async updateById(id, updateData) {
    try {
      console.log("Database connected:", !!this.db);
      console.log("Updating pest ID:", id);
      console.log("Update data:", updateData);

      if (!this.db) {
        throw new Error("Database not connected");
      }

      const result = await this.db.collection("pests").updateOne(
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
      console.error("❌ Error in PestModel.updateById:", error);
      throw error;
      a;
    }
  }
}

export default PestModel;
