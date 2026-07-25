import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    getCurrentRisk,
    getDistrictRisk,
    getHistoricalRisk,
    getRiskHeatmapData,
    getRiskRecommendations,
    recalculateRiskManually,
} from "../controllers/riskController.js";

const router = express.Router();

router.get("/", getCurrentRisk);
router.get("/heatmap", getRiskHeatmapData);
router.get("/recommendations", getRiskRecommendations);
router.get("/history", getHistoricalRisk);
router.get("/district/:name", getDistrictRisk);

// Admin-only direct trigger to re-compute and seed risk indices
router.post("/recalculate", protect, adminOnly, recalculateRiskManually);

export default router;
