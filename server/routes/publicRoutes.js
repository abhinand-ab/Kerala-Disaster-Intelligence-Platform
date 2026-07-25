import express from "express";
import {
    getPublicDashboard,
    getPublicShelters,
    getPublicIncidents,
    getPublicWeather,
    getPublicAlerts,
    getEmergencyContactsList,
    getFAQs,
    getSafeRoutes,
    getPublicRisk
} from "../controllers/publicController.js";

const router = express.Router();

router.get("/dashboard", getPublicDashboard);
router.get("/shelters", getPublicShelters);
router.get("/incidents", getPublicIncidents);
router.get("/weather", getPublicWeather);
router.get("/alerts", getPublicAlerts);
router.get("/emergency-contacts", getEmergencyContactsList);
router.get("/faqs", getFAQs);
router.get("/safe-routes", getSafeRoutes);
router.get("/risk", getPublicRisk);

export default router;
