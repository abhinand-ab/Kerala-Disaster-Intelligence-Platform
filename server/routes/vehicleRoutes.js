import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    assignVehicleToIncident,
    updateVehicleStatus,
    updateLiveLocation,
    markMissionComplete
} from "../controllers/vehicleController.js";

const router = express.Router();

router.route("/")
    .get(protect, getVehicles)
    .post(protect, adminOnly, createVehicle);

router.route("/:id")
    .get(protect, getVehicleById)
    .put(protect, adminOnly, updateVehicle)
    .delete(protect, adminOnly, deleteVehicle);

router.put("/:id/assign", protect, adminOnly, assignVehicleToIncident);
router.put("/:id/status", protect, updateVehicleStatus);
router.put("/:id/location", protect, updateLiveLocation);
router.put("/:id/complete", protect, markMissionComplete);

export default router;
