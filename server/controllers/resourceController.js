import Resource from "../models/Resource.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";
import { logActivity } from "../services/activityLogger.js";

const emitResourceSocketEvent = (eventName, payload) => {
    try {
        const io = getSocketIO();
        io.emit(eventName, payload);
    } catch (socketError) {
        console.warn("Socket.IO broadcast skipped for resource:", socketError.message);
    }
};

const createLowStockAlert = async (resource) => {
    try {
        const admins = await User.find({ role: "admin" }).select("_id");
        const io = getSocketIO();

        await Promise.all(
            admins.map(async (admin) => {
                const notification = await Notification.create({
                    user: admin._id,
                    title: "Low Stock Alert",
                    message: `Resource "${resource.resourceName}" in "${resource.district}" is low on stock (${resource.quantity} ${resource.unit} left).`,
                    type: "system",
                });

                try {
                    io.to(admin._id.toString()).emit("notificationCreated", notification);
                } catch (err) { }
            })
        );
    } catch (error) {
        console.error("Failed to generate low-stock alerts:", error.message);
    }
};

export const createResource = async (req, res) => {
    try {
        const resource = new Resource({
            ...req.body,
            createdBy: req.user._id,
        });
        await resource.save();

        emitResourceSocketEvent("resourceCreated", resource);
        emitResourceSocketEvent("stockUpdated", resource);

        if (resource.status === "Low Stock" || resource.status === "Out of Stock") {
            await createLowStockAlert(resource);
        }

        logActivity({
            userId: req.user?._id || req.user?.id,
            userEmail: req.user?.email || "",
            userRole: req.user?.role || "guest",
            action: "Create Resource",
            module: "Resource",
            targetId: resource._id.toString(),
            targetType: "Resource",
            description: `Registered new resource: "${resource.resourceName}" (Quantity: ${resource.quantity} ${resource.unit})`,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
            userAgent: req.headers["user-agent"] || "",
            severity: "Low"
        }).catch(err => console.error("Audit log creation error:", err));

        res.status(201).json({ success: true, data: resource });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getResources = async (req, res) => {
    try {
        const resources = await Resource.find()
            .populate("warehouse", "warehouseName address manager phone")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: resources.length, data: resources });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getResourceById = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id)
            .populate("warehouse", "warehouseName address manager phone");
        if (!resource) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }
        res.status(200).json({ success: true, data: resource });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }

        // Update fields manually to trigger pre('save') middleware
        Object.assign(resource, req.body);
        await resource.save();

        emitResourceSocketEvent("resourceUpdated", resource);
        emitResourceSocketEvent("stockUpdated", resource);

        if (resource.status === "Low Stock" || resource.status === "Out of Stock") {
            await createLowStockAlert(resource);
        }

        logActivity({
            userId: req.user?._id || req.user?.id,
            userEmail: req.user?.email || "",
            userRole: req.user?.role || "guest",
            action: "Update Resource",
            module: "Resource",
            targetId: resource._id.toString(),
            targetType: "Resource",
            description: `Updated resource: "${resource.resourceName}" (New Quantity: ${resource.quantity} ${resource.unit})`,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
            userAgent: req.headers["user-agent"] || "",
            severity: "Low"
        }).catch(err => console.error("Audit log creation error:", err));

        res.status(200).json({ success: true, data: resource });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ success: false, message: "Resource not found" });
        }
        await resource.deleteOne();
        emitResourceSocketEvent("resourceDeleted", { _id: req.params.id, deleted: true });
        emitResourceSocketEvent("stockUpdated", { _id: req.params.id, deleted: true });

        res.status(200).json({ success: true, message: "Resource deleted successfully" });

        logActivity({
            userId: req.user?._id || req.user?.id,
            userEmail: req.user?.email || "",
            userRole: req.user?.role || "guest",
            action: "Delete Resource",
            module: "Resource",
            targetId: resource._id.toString(),
            targetType: "Resource",
            description: `Deleted resource: "${resource.resourceName}" (Quantity: ${resource.quantity} ${resource.unit})`,
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
            userAgent: req.headers["user-agent"] || "",
            severity: "Medium"
        }).catch(err => console.error("Audit log creation error:", err));
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
