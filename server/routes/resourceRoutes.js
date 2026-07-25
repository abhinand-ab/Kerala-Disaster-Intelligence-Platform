import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    createResource,
    getResources,
    getResourceById,
    updateResource,
    deleteResource,
} from "../controllers/resourceController.js";

const router = express.Router();

router.route("/")
    .get(getResources)
    .post(protect, adminOnly, createResource);

router.route("/:id")
    .get(getResourceById)
    .put(protect, adminOnly, updateResource)
    .delete(protect, adminOnly, deleteResource);

export default router;
