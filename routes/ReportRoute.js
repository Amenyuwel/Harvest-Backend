import express from "express";
import ReportController from "../controllers/ReportController.js";

const router = express.Router();

// GET /api/reports - FETCH all reports
router.get("/", ReportController.getAllReports);

export default router;
