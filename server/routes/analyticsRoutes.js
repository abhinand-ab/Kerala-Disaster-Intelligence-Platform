import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    getDashboardMetrics,
    getTrendAnalysis,
    getDistrictComparison,
    getResourceUtilization,
    getAIStats,
    generateReport,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/dashboard", protect, getDashboardMetrics);
router.get("/trend", protect, getTrendAnalysis);
router.get("/districts", protect, getDistrictComparison);
router.get("/resources", protect, getResourceUtilization);
router.get("/ai-stats", protect, getAIStats);
router.get("/report", protect, generateReport);

export default router;
