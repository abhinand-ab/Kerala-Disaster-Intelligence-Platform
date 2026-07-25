import express from "express";
import {
    createRescueTeam,
    getRescueTeams,
    getRescueTeamById,
    updateRescueTeam,
    deleteRescueTeam,
    addMember,
    removeMember,
    assignTeamToIncident,
    assignTeamToVehicle,
    updateTeamStatus,
} from "../controllers/rescueTeamController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all teams
router.get("/", protect, getRescueTeams);

// Get single team
router.get("/:id", protect, getRescueTeamById);

// Create team (Admin only)
router.post("/", protect, adminOnly, createRescueTeam);

// Update team details (Admin only)
router.put("/:id", protect, adminOnly, updateRescueTeam);

// Delete team (Admin only)
router.delete("/:id", protect, adminOnly, deleteRescueTeam);

// Add team member (Admin only)
router.patch("/:id/members/add", protect, adminOnly, addMember);

// Remove team member (Admin only)
router.patch("/:id/members/remove", protect, adminOnly, removeMember);

// Assign team to incident (Admin only)
router.patch("/:id/assign-incident", protect, adminOnly, assignTeamToIncident);

// Assign team to vehicle (Admin only)
router.patch("/:id/assign-vehicle", protect, adminOnly, assignTeamToVehicle);

// Update status (Admin only)
router.patch("/:id/status", protect, adminOnly, updateTeamStatus);

export default router;
