import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    submitSOS,
    getEmergencyRequests,
    getEmergencyRequestById,
    updateEmergencyRequest,
    assignResponders,
    changeRequestStatus,
    trackRequestByPhone,
    getEmergencyAnalytics,
} from "../controllers/emergencyController.js";

const router = express.Router();

// Public Routes (Citizen Space)
router.post("/sos", submitSOS);
router.get("/track/:phone", trackRequestByPhone);

// Protected Routes (Admin/Responders Space)
router.get("/requests", protect, getEmergencyRequests);
router.get("/requests/:id", protect, getEmergencyRequestById);
router.put("/requests/:id", protect, updateEmergencyRequest);
router.patch("/requests/:id/assign", protect, assignResponders);
router.patch("/requests/:id/status", protect, changeRequestStatus);

// Analytics
router.get("/analytics", protect, getEmergencyAnalytics);

export default router;
