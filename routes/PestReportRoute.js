import express from "express";
import PestReportController from "../controllers/PestReportController.js";

const router = express.Router();

// GET /api/pestReports - FETCH all pest reports
router.get("/", PestReportController.getAllPestReports);

export default router;
