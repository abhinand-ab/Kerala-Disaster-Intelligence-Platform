import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    createWarehouse,
    getWarehouses,
    getWarehouseById,
    updateWarehouse,
    deleteWarehouse,
} from "../controllers/warehouseController.js";

const router = express.Router();

router.route("/")
    .get(getWarehouses)
    .post(protect, adminOnly, createWarehouse);

router.route("/:id")
    .get(getWarehouseById)
    .put(protect, adminOnly, updateWarehouse)
    .delete(protect, adminOnly, deleteWarehouse);

export default router;
