import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    registerSensor,
    updateReading,
    getLatestReadings,
    getSensorById,
    getSensorHistory,
    getDistrictSensors,
    getRiverSensors,
    getOfflineSensors,
    deleteSensor,
    getSensorAnalytics,
} from "../controllers/sensorController.js";

const router = express.Router();

// Public Telemetry Interface (Called by IoT devices/simulators)
router.post("/:sensorId/reading", updateReading);

// Protected REST Endpoints (Dashboard/Admin)
router.post("/", protect, registerSensor);
router.get("/", protect, getLatestReadings);
router.get("/analytics", protect, getSensorAnalytics);
router.get("/offline", protect, getOfflineSensors);
router.get("/district/:district", protect, getDistrictSensors);
router.get("/river/:river", protect, getRiverSensors);
router.get("/:sensorId", protect, getSensorById);
router.get("/:sensorId/history", protect, getSensorHistory);
router.delete("/:sensorId", protect, deleteSensor);

export default router;
