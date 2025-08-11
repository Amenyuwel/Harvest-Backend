import express from "express";
import FarmerController from "../controllers/FarmerController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/farmers/count/:barangayId - Get farmer count by barangay
router.get("/count/:barangayId", FarmerController.getFarmerCountByBarangay);

// GET /api/farmers - Get all farmers
router.get("/", FarmerController.getAllFarmers);

// POST /api/farmers - Create new farmer (requires authentication)
router.post("/", requireAuth, FarmerController.createFarmer);

// PUT /api/farmers/:id - Update farmer by ID (requires authentication)
router.put("/:id", requireAuth, FarmerController.updateFarmer);

// DELETE /api/farmers/:id - Delete farmer by ID (requires authentication)
router.delete("/:id", requireAuth, FarmerController.deleteFarmer);

export default router;
