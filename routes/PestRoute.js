import express from "express";
import PestController from "../controllers/PestController.js";

const router = express.Router();

// POST /api/pests - ADD new pest record
router.post("/", PestController.addPest);

// GET /api/pests - FETCH all pest records
router.get("/", PestController.getAllPests);

// GET /api/pests/:id - FETCH pest by ID
router.get("/:id", PestController.getPestById);

// PUT /api/pests/:id - UPDATE pest record
router.put("/:id", PestController.updatePest);

export default router;
