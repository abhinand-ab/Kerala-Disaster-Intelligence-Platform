import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    getCurrentWeather,
    getDistrictWeather,
    getForecast,
    getActiveAlerts,
    getWeatherHistory,
    getWeatherSummary,
    triggerManualWeatherSync,
} from "../controllers/weatherController.js";

const router = express.Router();

router.get("/", getCurrentWeather);
router.get("/alerts", getActiveAlerts);
router.get("/summary", getWeatherSummary);
router.get("/history", getWeatherHistory);

router.get("/district/:name", getDistrictWeather);
router.get("/district/:name/forecast", getForecast);

// Admin-only manual sync endpoint
router.post("/sync", protect, adminOnly, triggerManualWeatherSync);

export default router;
