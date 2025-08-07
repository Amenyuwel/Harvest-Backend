import express from "express";
import LoginController from "../controllers/LoginController.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", LoginController.login);

// POST /api/auth/logout
router.post("/logout", LoginController.logout);

// GET /api/auth/profile (protected route)
router.get("/profile", LoginController.getProfile);

export default router;
