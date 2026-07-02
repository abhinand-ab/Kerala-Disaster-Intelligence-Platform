import express from "express";

import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident,
  updateIncidentStatus,
  assignVolunteer,
} from "../controllers/incidentController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
=====================================
Public / Protected Routes
=====================================
*/

// Get all incidents
router.get("/", getIncidents);

// Get single incident
router.get("/:id", getIncidentById);

// Create incident
router.post("/", protect, createIncident);

// Update incident
router.put("/:id", protect, updateIncident);

// Delete incident (Admin only)
router.delete("/:id", protect,  deleteIncident);

// Update incident status
router.patch("/:id/status", protect, updateIncidentStatus);

// Assign volunteer (Admin only)
router.patch("/:id/assign", protect, assignVolunteer);

export default router;