import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    getRecommendations,
    getPredictions,
    getAIRiskSummary,
    getEvacuationSuggestions,
    getResourceOptimizationData,
    triggerFullAnalysis,
    triggerSmartAssignment,
    acceptRecommendation,
    rejectRecommendation,
    getAIAnalytics,
} from "../controllers/aiController.js";

const router = express.Router();

// Protected endpoints
router.get("/recommendations", protect, getRecommendations);
router.get("/predictions", protect, getPredictions);
router.get("/risk-summary", protect, getAIRiskSummary);
router.get("/evacuation-suggestions", protect, getEvacuationSuggestions);
router.get("/resource-optimization", protect, getResourceOptimizationData);
router.get("/analytics", protect, getAIAnalytics);

// Mutation endpoints (admin)
router.post("/run-analysis", protect, triggerFullAnalysis);
router.post("/smart-assign", protect, triggerSmartAssignment);
router.patch("/recommendations/:id/accept", protect, acceptRecommendation);
router.patch("/recommendations/:id/reject", protect, rejectRecommendation);

export default router;
