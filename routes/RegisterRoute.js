import express from "express";
import RegisterController from "../controllers/RegisterController.js";
import LoginController from "../controllers/LoginController.js";

const router = express.Router();

// POST /api/auth/admin/register
router.post("/admin/register", RegisterController.registerAdmin);
router.get("/profile", LoginController.getProfile);

export default router;
