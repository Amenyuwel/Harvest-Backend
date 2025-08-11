import express from "express";
import BarangayController from "../controllers/BarangayController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/barangays/search - Search barangays (MUST be before /:id)
router.get("/search", BarangayController.searchBarangays);

// GET /api/barangays - Get all barangays
router.get("/", BarangayController.getAllBarangays);

// GET /api/barangays/:id - Get barangay by ID (MUST be after /search)
router.get("/:id", BarangayController.getBarangayById);

// POST /api/barangays - Create new barangay (requires authentication)
router.post("/", requireAuth, BarangayController.createBarangay);

// PUT /api/barangays/:id - Update barangay (requires authentication)
router.put("/:id", requireAuth, BarangayController.updateBarangay);

// DELETE /api/barangays/:id - Delete barangay (requires authentication)
router.delete("/:id", requireAuth, BarangayController.deleteBarangay);

export default router;
