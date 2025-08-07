import mongoose from "mongoose";

class CropsModel {
  static db = null;

  static setDatabase(database) {
    this.db = database;
  }

  static async findAll() {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }
      const crops = await this.db.collection("crops").find({}).toArray();
      return crops;
    } catch (error) {
      console.error("Error in CropsModel.findAll:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }
      const { ObjectId } = mongoose.Types;
      const crop = await this.db
        .collection("crops")
        .findOne({ _id: new ObjectId(id) });
      return crop;
    } catch (error) {
      console.error("Error in CropsModel.findById:", error);
      throw error;
    }
  }

  static async findByCropId(cropId) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }
      const crop = await this.db.collection("crops").findOne({ cropId });
      return crop;
    } catch (error) {
      console.error("Error in CropsModel.findByCropId:", error);
      throw error;
    }
  }

  static async create(cropData) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }
      const result = await this.db.collection("crops").insertOne({
        ...cropData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return result;
    } catch (error) {
      console.error("Error in CropsModel.create:", error);
      throw error;
    }
  }

  static async update(id, cropData) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }
      const { ObjectId } = mongoose.Types;
      const result = await this.db.collection("crops").updateOne(
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
      console.error("Error in CropsModel.update:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }
      const { ObjectId } = mongoose.Types;
      const result = await this.db
        .collection("crops")
        .deleteOne({ _id: new ObjectId(id) });
      return result;
    } catch (error) {
      console.error("Error in CropsModel.delete:", error);
      throw error;
    }
  }

  static async search(searchTerm) {
    try {
      if (!this.db) {
        throw new Error("Database not connected");
      }
      const crops = await this.db
        .collection("crops")
        .find({
          cropName: { $regex: searchTerm, $options: "i" },
        })
        .toArray();
      return crops;
    } catch (error) {
      console.error("Error in CropsModel.search:", error);
      throw error;
    }
  }
}

export default CropsModel;
