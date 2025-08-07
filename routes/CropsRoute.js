import express from "express";
import CropController from "../controllers/CropController.js";

const router = express.Router();

// GET /api/crops/search - Search crops (MUST be before /:id)
router.get("/search", CropController.searchCrops);

// GET /api/crops/crop/:cropId - Get by cropId (MUST be before /:id)
router.get("/crop/:cropId", CropController.getCropByCropId);

// GET /api/crops - Get all crops
router.get("/", CropController.getAllCrops);

// GET /api/crops/:id - Get crop by ID (MUST be after specific routes)
router.get("/:id", CropController.getCropById);

// POST /api/crops - Create new crop
router.post("/", CropController.createCrop);

// PUT /api/crops/:id - Update crop
router.put("/:id", CropController.updateCrop);

// DELETE /api/crops/:id - Delete crop
router.delete("/:id", CropController.deleteCrop);

export default router;
