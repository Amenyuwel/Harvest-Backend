import express, { type Router } from 'express';
import ReportController from '@/controllers/ReportController.js';

const router: Router = express.Router();

// GET /api/reports - FETCH all reports
router.get('/', ReportController.getAllReports);

export default router;
