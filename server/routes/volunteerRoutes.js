import express from "express";
import {
    createVolunteer,
    getVolunteers,
    getVolunteerById,
    updateVolunteer,
    deleteVolunteer,
    assignVolunteerToIncident,
    markAvailable,
    markBusy,
    updateLiveLocation,
    removeAssignment,
    updateAvailability,
    markOnDuty,
    markOffDuty,
} from "../controllers/volunteerController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all volunteers
router.get("/", protect, getVolunteers);

// Get single volunteer
router.get("/:id", protect, getVolunteerById);

// Create volunteer (Admin only)
router.post("/", protect, adminOnly, createVolunteer);

// Update volunteer (Admin only)
router.put("/:id", protect, adminOnly, updateVolunteer);

// Delete volunteer (Admin only)
router.delete("/:id", protect, adminOnly, deleteVolunteer);

// Assign volunteer to incident (Admin only)
router.patch("/:id/assign", protect, adminOnly, assignVolunteerToIncident);

// Remove all assignments (Admin only)
router.patch("/:id/unassign", protect, adminOnly, removeAssignment);

// Update availability status (Admin only)
router.patch("/:id/availability", protect, adminOnly, updateAvailability);

// Mark volunteer as available (Admin only)
router.patch("/:id/available", protect, adminOnly, markAvailable);

// Mark volunteer as busy (Admin only)
router.patch("/:id/busy", protect, adminOnly, markBusy);

// Mark on-duty status (Admin only)
router.patch("/:id/onduty", protect, adminOnly, markOnDuty);

// Mark off-duty status (Admin only)
router.patch("/:id/offduty", protect, adminOnly, markOffDuty);

// Update live location (Any logged in user/volunteer)
router.patch("/:id/location", protect, updateLiveLocation);

export default router;
