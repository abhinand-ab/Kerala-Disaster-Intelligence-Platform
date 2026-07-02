import express from "express";

import { protect } from "../middleware/authMiddleware.js";
import {
	getVolunteers,
	updateProfile,
} from "../controllers/userController.js";

const router = express.Router();

router.get("/volunteers", protect, getVolunteers);

router.put("/profile", protect, updateProfile);

export default router;