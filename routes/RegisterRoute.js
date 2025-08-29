import express from "express";
import RegisterController from "../controllers/RegisterController.js";
import LoginController from "../controllers/LoginController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/auth/admin/register
router.post("/admin/register", RegisterController.registerAdmin);

// GET /api/auth/profile (protected route)
router.get("/profile", requireAuth, LoginController.getProfile);

// PUT /api/auth/profile (protected route)
router.put("/profile", requireAuth, LoginController.updateProfile);

export default router;
