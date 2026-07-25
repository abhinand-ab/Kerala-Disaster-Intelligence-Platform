import express from "express";

import {
	createShelter,
	getShelters,
	getShelterById,
	updateShelter,
	deleteShelter,
	updateOccupancy,
} from "../controllers/shelterController.js";

import {
	protect,
	adminOnly,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/*
=====================================
Protected Routes
=====================================
*/

// Get all shelters
router.get("/", protect, getShelters);

// Get single shelter
router.get("/:id", protect, getShelterById);

// Create shelter (Admin only)
router.post("/", protect, adminOnly, createShelter);

// Update shelter (Admin only)
router.put("/:id", protect, adminOnly, updateShelter);

// Delete shelter (Admin only)
router.delete("/:id", protect, adminOnly, deleteShelter);

// Update shelter occupancy (Admin only)
router.patch("/:id/occupancy", protect, adminOnly, updateOccupancy);

export default router;
