import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    createDeliveryMission,
    getDeliveryMissions,
    getDeliveryMissionById,
    updateDeliveryMission,
    deleteDeliveryMission,
} from "../controllers/deliveryController.js";

const router = express.Router();

router.route("/")
    .get(getDeliveryMissions)
    .post(protect, adminOnly, createDeliveryMission);

router.route("/:id")
    .get(getDeliveryMissionById)
    .put(protect, adminOnly, updateDeliveryMission)
    .delete(protect, adminOnly, deleteDeliveryMission);

export default router;
