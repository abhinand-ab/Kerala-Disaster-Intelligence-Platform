import DeliveryMission from "../models/DeliveryMission.js";
import Resource from "../models/Resource.js";
import ShelterInventory from "../models/ShelterInventory.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";

const emitDeliverySocketEvent = (eventName, payload) => {
    try {
        const io = getSocketIO();
        io.emit(eventName, payload);
    } catch (socketError) {
        console.warn("Socket.IO broadcast skipped for delivery:", socketError.message);
    }
};

const notifyAdmins = async (title, message, incidentId = null) => {
    try {
        const admins = await User.find({ role: "admin" }).select("_id");
        const io = getSocketIO();
        for (const admin of admins) {
            const notification = await Notification.create({
                user: admin._id,
                title,
                message,
                type: "system",
            });
            try {
                io.to(admin._id.toString()).emit("notificationCreated", notification);
            } catch (e) { }
        }
    } catch (err) {
        console.error("Error creating admin notifications:", err.message);
    }
};

export const createDeliveryMission = async (req, res) => {
    try {
        const {
            destinationShelter,
            warehouse,
            assignedVehicle,
            assignedVolunteer,
            assignedDriver,
            dispatchedResources,
            missionStatus,
            estimatedArrival,
            liveGPS,
        } = req.body;

        // If created as immediately "Dispatched", perform stock checks first
        if (missionStatus === "Dispatched") {
            // Perform check on all resources first to prevent partial updates & negative stock
            for (const resItem of dispatchedResources) {
                const resourceDoc = await Resource.findById(resItem.resource);
                if (!resourceDoc) {
                    return res.status(404).json({ success: false, message: `Resource ${resItem.resource} not found` });
                }
                if (resourceDoc.quantity < resItem.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for "${resourceDoc.resourceName}". Requested: ${resItem.quantity}, Available: ${resourceDoc.quantity}`,
                    });
                }
            }

            // Reduce stock
            for (const resItem of dispatchedResources) {
                const resourceDoc = await Resource.findById(resItem.resource);
                resourceDoc.quantity -= resItem.quantity;
                await resourceDoc.save();
                emitDeliverySocketEvent("stockUpdated", resourceDoc);
            }
        }

        const mission = new DeliveryMission({
            destinationShelter,
            warehouse,
            assignedVehicle,
            assignedVolunteer,
            assignedDriver,
            dispatchedResources,
            missionStatus: missionStatus || "Pending",
            estimatedArrival,
            liveGPS,
            createdBy: req.user._id,
        });

        await mission.save();

        const populatedMission = await DeliveryMission.findById(mission._id)
            .populate("destinationShelter", "name district address contactPerson phone")
            .populate("warehouse", "warehouseName address district manager phone")
            .populate("assignedVolunteer", "fullName team district phone")
            .populate({
                path: "dispatchedResources.resource",
                select: "resourceName category unit",
            });

        emitDeliverySocketEvent("deliveryStarted", populatedMission);

        // Send notification
        if (missionStatus === "Dispatched") {
            await notifyAdmins(
                "Delivery Dispatched",
                `Delivery Mission to "${populatedMission.destinationShelter?.name || "Shelter"}" has been dispatched.`
            );
        }

        res.status(201).json({ success: true, data: populatedMission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDeliveryMissions = async (req, res) => {
    try {
        const missions = await DeliveryMission.find()
            .populate("destinationShelter", "name district address contactPerson phone")
            .populate("warehouse", "warehouseName address district manager phone")
            .populate("assignedVolunteer", "fullName team district phone")
            .populate({
                path: "dispatchedResources.resource",
                select: "resourceName category unit",
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: missions.length, data: missions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getDeliveryMissionById = async (req, res) => {
    try {
        const mission = await DeliveryMission.findById(req.params.id)
            .populate("destinationShelter", "name district address contactPerson phone")
            .populate("warehouse", "warehouseName address district manager phone")
            .populate("assignedVolunteer", "fullName team district phone")
            .populate({
                path: "dispatchedResources.resource",
                select: "resourceName category unit",
            });

        if (!mission) {
            return res.status(404).json({ success: false, message: "Delivery mission not found" });
        }

        res.status(200).json({ success: true, data: mission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateDeliveryMission = async (req, res) => {
    try {
        const mission = await DeliveryMission.findById(req.params.id);
        if (!mission) {
            return res.status(404).json({ success: false, message: "Delivery mission not found" });
        }

        const previousStatus = mission.missionStatus;
        const nextStatus = req.body.missionStatus || previousStatus;

        // Stock transition rules:
        // 1. If transitioning from Pending -> Dispatched: Check stock, reduce from Warehouse Resource
        if (previousStatus === "Pending" && nextStatus === "Dispatched") {
            const items = req.body.dispatchedResources || mission.dispatchedResources;

            // Validate
            for (const resItem of items) {
                const resourceDoc = await Resource.findById(resItem.resource);
                if (!resourceDoc) {
                    return res.status(404).json({ success: false, message: `Resource not found` });
                }
                if (resourceDoc.quantity < resItem.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for "${resourceDoc.resourceName}". Available: ${resourceDoc.quantity}, Requested: ${resItem.quantity}`,
                    });
                }
            }

            // Spend
            for (const resItem of items) {
                const resourceDoc = await Resource.findById(resItem.resource);
                resourceDoc.quantity -= resItem.quantity;
                await resourceDoc.save();
                emitDeliverySocketEvent("stockUpdated", resourceDoc);
            }
        }

        // 2. If transitioning from In Transit/Dispatched -> Completed: Increase shelter inventory
        if ((previousStatus === "Dispatched" || previousStatus === "In Transit" || previousStatus === "Pending") && nextStatus === "Completed") {
            const items = mission.dispatchedResources;
            for (const resItem of items) {
                const resourceDoc = await Resource.findById(resItem.resource);
                if (resourceDoc) {
                    let shelterInv = await ShelterInventory.findOne({
                        shelter: mission.destinationShelter,
                        resourceName: resourceDoc.resourceName,
                    });

                    if (shelterInv) {
                        shelterInv.quantity += resItem.quantity;
                        await shelterInv.save();
                    } else {
                        await ShelterInventory.create({
                            shelter: mission.destinationShelter,
                            resourceName: resourceDoc.resourceName,
                            category: resourceDoc.category,
                            quantity: resItem.quantity,
                            unit: resourceDoc.unit,
                        });
                    }
                }
            }
        }

        // Update fields
        Object.assign(mission, req.body);
        await mission.save();

        const populatedMission = await DeliveryMission.findById(mission._id)
            .populate("destinationShelter", "name district address contactPerson phone")
            .populate("warehouse", "warehouseName address district manager phone")
            .populate("assignedVolunteer", "fullName team district phone")
            .populate({
                path: "dispatchedResources.resource",
                select: "resourceName category unit",
            });

        // Trigger notifications
        if (previousStatus !== "Dispatched" && nextStatus === "Dispatched") {
            emitDeliverySocketEvent("deliveryStarted", populatedMission);
            await notifyAdmins(
                "Delivery Dispatched",
                `Delivery Mission to "${populatedMission.destinationShelter?.name}" has been launched.`
            );
        } else if (previousStatus !== "Completed" && nextStatus === "Completed") {
            emitDeliverySocketEvent("deliveryCompleted", populatedMission);
            await notifyAdmins(
                "Delivery Arrival Completed",
                `Delivery Mission to "${populatedMission.destinationShelter?.name}" has completed delivery successfully.`
            );
        } else {
            emitDeliverySocketEvent("deliveryUpdated", populatedMission);
        }

        res.status(200).json({ success: true, data: populatedMission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteDeliveryMission = async (req, res) => {
    try {
        const mission = await DeliveryMission.findById(req.params.id);
        if (!mission) {
            return res.status(404).json({ success: false, message: "Delivery mission not found" });
        }

        // Revert inventory if deleting an active uncompleted dispatched mission? 
        // Typically, just remove the record, let's keep it simple. Let's delete the mission.
        await mission.deleteOne();
        emitDeliverySocketEvent("deliveryDeleted", { _id: req.params.id, deleted: true });

        res.status(200).json({ success: true, message: "Delivery mission deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
