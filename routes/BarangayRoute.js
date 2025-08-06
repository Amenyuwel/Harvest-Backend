import express from "express";
import BarangayController from "../controllers/BarangayController.js";

const router = express.Router();

// GET /api/barangays - Get all barangays
router.get("/", BarangayController.getAllBarangays);

// GET /api/barangays/:id - Get barangay by ID
router.get("/:id", BarangayController.getBarangayById);

// GET /api/barangays/search - Search barangays
router.get("/search", BarangayController.searchBarangays);

// POST /api/barangays - Create new barangay
router.post("/", BarangayController.createBarangay);

// PUT /api/barangays/:id - Update barangay
router.put("/:id", BarangayController.updateBarangay);

// DELETE /api/barangays/:id - Delete barangay
router.delete("/:id", BarangayController.deleteBarangay);

export default router;
