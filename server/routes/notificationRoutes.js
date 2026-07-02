import express from "express";

import {
	protect,
} from "../middleware/authMiddleware.js";

import {
	getNotifications,
	markAsRead,
	markAllAsRead,
	deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// All Notification Routes are Protected
router.get("/", protect, getNotifications);
router.put("/:id/read", protect, markAsRead);
router.put("/read-all", protect, markAllAsRead);
router.delete("/:id", protect, deleteNotification);

export default router;
