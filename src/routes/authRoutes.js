// src/routes/authRoutes.js
import express from "express";
import {
  register,
  login,
  getMe,
  updateProfile,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import authRateLimit from "../middleware/authRateLimit.js";
const router = express.Router();

router.post("/register", authRateLimit, register);
router.post("/login", authRateLimit, login);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

export default router;