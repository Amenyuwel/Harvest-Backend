import express, { type Router } from 'express';
import CropController from '@/controllers/CropController.js';
import { requireAuth } from '@/middleware/authMiddleware.js';

const router: Router = express.Router();

// GET /api/crops/search - Search crops (MUST be before /:id)
router.get('/search', CropController.searchCrops);

// GET /api/crops/crop/:cropId - Get by cropId (MUST be before /:id)
router.get('/crop/:cropId', CropController.getCropByCropId);

// GET /api/crops - Get all crops
router.get('/', CropController.getAllCrops);

// GET /api/crops/:id - Get crop by ID (MUST be after specific routes)
router.get('/:id', CropController.getCropById);

// POST /api/crops - Create new crop (requires authentication)
router.post('/', requireAuth, CropController.createCrop);

// PUT /api/crops/:id - Update crop (requires authentication)
router.put('/:id', requireAuth, CropController.updateCrop);

// DELETE /api/crops/:id - Delete crop (requires authentication)
router.delete('/:id', requireAuth, CropController.deleteCrop);

export default router;
