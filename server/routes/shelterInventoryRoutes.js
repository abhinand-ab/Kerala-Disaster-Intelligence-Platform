import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    getShelterInventoryByShelterId,
    getAllShelterInventories,
} from "../controllers/shelterInventoryController.js";

const router = express.Router();

router.get("/", getAllShelterInventories);
router.get("/shelter/:shelterId", getShelterInventoryByShelterId);

export default router;
