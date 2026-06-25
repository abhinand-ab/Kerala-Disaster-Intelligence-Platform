import express from "express";

import {
  registerUser,
  loginUser,
  getProfile,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected Route
router.get("/profile", protect, getProfile);

export default router;