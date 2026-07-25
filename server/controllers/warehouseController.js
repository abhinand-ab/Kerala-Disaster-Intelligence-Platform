import Warehouse from "../models/Warehouse.js";
import Resource from "../models/Resource.js";
import { getSocketIO } from "../sockets/socket.js";

const emitWarehouseSocketEvent = (eventName, payload) => {
    try {
        const io = getSocketIO();
        io.emit(eventName, payload);
    } catch (socketError) {
        console.warn("Socket.IO broadcast skipped for warehouse:", socketError.message);
    }
};

export const createWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.create(req.body);
        emitWarehouseSocketEvent("warehouseUpdated", warehouse);
        res.status(201).json({ success: true, data: warehouse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWarehouses = async (req, res) => {
    try {
        const warehouses = await Warehouse.find().sort({ createdAt: -1 });

        // Dynamically compute currentUtilization based on resources stored compared to capacity
        // For display, we can aggregate resource quantities in each warehouse and update currentUtilization
        const warehousesWithResources = await Promise.all(
            warehouses.map(async (warehouse) => {
                const resources = await Resource.find({ warehouse: warehouse._id });
                const totalQuantity = resources.reduce((sum, r) => sum + r.quantity, 0);
                const utilization = warehouse.storageCapacity > 0
                    ? Math.min(Math.round((totalQuantity / warehouse.storageCapacity) * 100), 100)
                    : 0;

                if (warehouse.currentUtilization !== utilization) {
                    warehouse.currentUtilization = utilization;
                    await warehouse.save();
                }

                const warehouseObj = warehouse.toObject();
                warehouseObj.resourceCount = resources.length;
                warehouseObj.totalQuantity = totalQuantity;
                return warehouseObj;
            })
        );

        res.status(200).json({ success: true, data: warehousesWithResources });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWarehouseById = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return res.status(404).json({ success: false, message: "Warehouse not found" });
        }
        const resources = await Resource.find({ warehouse: warehouse._id });
        const totalQuantity = resources.reduce((sum, r) => sum + r.quantity, 0);
        const utilization = warehouse.storageCapacity > 0
            ? Math.min(Math.round((totalQuantity / warehouse.storageCapacity) * 100), 100)
            : 0;

        if (warehouse.currentUtilization !== utilization) {
            warehouse.currentUtilization = utilization;
            await warehouse.save();
        }

        res.status(200).json({
            success: true,
            data: {
                ...warehouse.toObject(),
                resourceCount: resources.length,
                totalQuantity
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!warehouse) {
            return res.status(404).json({ success: false, message: "Warehouse not found" });
        }
        emitWarehouseSocketEvent("warehouseUpdated", warehouse);
        res.status(200).json({ success: true, data: warehouse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteWarehouse = async (req, res) => {
    try {
        const warehouse = await Warehouse.findById(req.params.id);
        if (!warehouse) {
            return res.status(404).json({ success: false, message: "Warehouse not found" });
        }
        await warehouse.deleteOne();
        emitWarehouseSocketEvent("warehouseUpdated", { _id: req.params.id, deleted: true });
        res.status(200).json({ success: true, message: "Warehouse deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
