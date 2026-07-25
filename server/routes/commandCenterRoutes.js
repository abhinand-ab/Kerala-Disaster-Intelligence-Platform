import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    getCommandCenters,
    getCommandCenterById,
    createCommandCenter,
    joinAgency,
    assignMission,
    updateMissionStatus,
    shareResource,
    updateResourceStatus,
    postCommandMessage,
    getAgencyAvailability,
    createAgency,
    getAgencies
} from "../controllers/commandCenterController.js";

const router = express.Router();

// General availability stats and agency list
router.get("/availability", protect, getAgencyAvailability);
router.get("/agencies", protect, getAgencies);
router.post("/agencies", protect, createAgency);

// Command centers management
router.get("/", protect, getCommandCenters);
router.post("/", protect, createCommandCenter);
router.get("/:id", protect, getCommandCenterById);

// Specific Command Center actions
router.post("/:id/join", protect, joinAgency);
router.post("/:id/missions", protect, assignMission);
router.patch("/:id/missions/:missionId", protect, updateMissionStatus);
router.post("/:id/resources", protect, shareResource);
router.patch("/:id/resources/:resourceId", protect, updateResourceStatus);
router.post("/:id/messages", protect, postCommandMessage);

export default router;
