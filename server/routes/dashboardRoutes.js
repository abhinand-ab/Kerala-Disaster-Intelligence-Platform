import express from "express";
import { getDashboardAnalytics } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";

// Router for dashboard analytics endpoints.
const router = express.Router();

// Get dashboard analytics data.
router.get("/", protect, getDashboardAnalytics);

export default router;
