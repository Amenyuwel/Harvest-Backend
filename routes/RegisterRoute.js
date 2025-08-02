import express from "express";
import RegisterController from "../controllers/RegisterController.js";

const router = express.Router();

// POST /api/auth/admin/register
router.post("/admin/register", RegisterController.registerAdmin);

export default router;
