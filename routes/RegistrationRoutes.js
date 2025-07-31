import express from "express";
import { RegistrationController } from "../controllers/RegistrationController.js";
import { authMiddleware } from "../middleware/auth.js"; // Assuming you have auth middleware

const router = express.Router();

// Public routes (no authentication required)
// Registration route
router.post("/admin/register", RegistrationController.registerAdmin);

// Login route
router.post("/admin/login", RegistrationController.loginAdmin);

// Token verification route
router.post("/verify-token", RegistrationController.verifyToken);

// Protected routes (authentication required)
// Profile route
router.get(
  "/admin/profile",
  authMiddleware,
  RegistrationController.getAdminProfile
);

// Update profile route
router.put(
  "/admin/profile",
  authMiddleware,
  RegistrationController.updateAdminProfile
);

// Change password route
router.put(
  "/change-password",
  authMiddleware,
  RegistrationController.changePassword
);

export default router;
