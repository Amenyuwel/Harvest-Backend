import express from "express";
import FarmerController from "../controllers/FarmerController.js";

const router = express.Router();

// GET /api/farmers/count/:barangayId - Get farmer count by barangay
router.get("/count/:barangayId", FarmerController.getFarmerCountByBarangay);

// GET /api/farmers - Get all farmers
router.get("/", FarmerController.getAllFarmers);

// POST /api/farmers - Create new farmer
router.post("/", FarmerController.createFarmer);

// PUT /api/farmers/:id - Update farmer by ID
router.put("/:id", FarmerController.updateFarmer);

// DELETE /api/farmers/:id - Delete farmer by ID
router.delete("/:id", FarmerController.deleteFarmer);

export default router;
