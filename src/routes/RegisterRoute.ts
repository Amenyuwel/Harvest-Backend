import express, { type Router } from 'express';
import LoginController from '@/controllers/LoginController.js';
import RegisterController from '@/controllers/RegisterController.js';
import { requireAuth } from '@/middleware/authMiddleware.js';

const router: Router = express.Router();

// POST /api/auth/admin/register
router.post('/register', RegisterController.registerAdmin);

// GET /api/auth/profile (protected route)
router.get('/profile', requireAuth, LoginController.getProfile);

// PUT /api/auth/profile (protected route)
router.put('/profile', requireAuth, LoginController.updateProfile);

export default router;
