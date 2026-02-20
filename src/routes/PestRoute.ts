import express, { type Router } from 'express';
import PestController from '@/controllers/PestController.js';
import { requireAuth } from '@/middleware/authMiddleware.js';

const router: Router = express.Router();

// POST /api/pests - ADD new pest record (requires authentication)
router.post('/', requireAuth, PestController.addPest);

// GET /api/pests - FETCH all pest records
router.get('/', PestController.getAllPests);

// GET /api/pests/:id - FETCH pest by ID
router.get('/:id', PestController.getPestById);

// PUT /api/pests/:id - UPDATE pest record (requires authentication)
router.put('/:id', requireAuth, PestController.updatePest);

export default router;
