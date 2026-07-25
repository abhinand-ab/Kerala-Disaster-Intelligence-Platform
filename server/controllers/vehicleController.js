import Vehicle from "../models/Vehicle.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";

const emitVehicleSocketEvent = (eventName, payload) => {
    try {
        const io = getSocketIO();
        io.emit(eventName, payload);
    } catch (socketError) {
        console.warn("Socket.IO broadcast skipped for vehicle:", socketError.message);
    }
};

const notifyAdmins = async (title, message) => {
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
        console.error("Error creating vehicle notifications:", err.message);
    }
};

export const createVehicle = async (req, res) => {
    try {
        const vehicle = new Vehicle({
            ...req.body,
            createdBy: req.user._id,
        });
        await vehicle.save();

        emitVehicleSocketEvent("vehicleCreated", vehicle);
        res.status(201).json({ success: true, data: vehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find()
            .populate("assignedIncident")
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: vehicles.length, data: vehicles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id).populate("assignedIncident");
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }
        res.status(200).json({ success: true, data: vehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        const prevStatus = vehicle.status;
        Object.assign(vehicle, req.body);
        await vehicle.save();

        const updatedVehicle = await Vehicle.findById(vehicle._id).populate("assignedIncident");
        emitVehicleSocketEvent("vehicleUpdated", updatedVehicle);

        // Generate notification if status changed to Maintenance
        if (prevStatus !== "Maintenance" && updatedVehicle.status === "Maintenance") {
            await notifyAdmins(
                "Vehicle Maintenance Mode",
                `Vehicle ${updatedVehicle.vehicleNumber} (${updatedVehicle.vehicleType}) has been placed in maintenance.`
            );
        }

        res.status(200).json({ success: true, data: updatedVehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }
        await vehicle.deleteOne();
        emitVehicleSocketEvent("vehicleDeleted", { _id: req.params.id, deleted: true });
        res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const assignVehicleToIncident = async (req, res) => {
    try {
        const { incidentId } = req.body;
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        vehicle.assignedIncident = incidentId || null;
        vehicle.status = incidentId ? "Assigned" : "Available";
        await vehicle.save();

        const updatedVehicle = await Vehicle.findById(vehicle._id).populate("assignedIncident");
        emitVehicleSocketEvent("vehicleAssigned", updatedVehicle);
        emitVehicleSocketEvent("vehicleUpdated", updatedVehicle);

        if (incidentId) {
            await notifyAdmins(
                "Rescue Vehicle Assigned",
                `Vehicle ${updatedVehicle.vehicleNumber} has been assigned to Incident.`
            );
        }

        res.status(200).json({ success: true, data: updatedVehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateVehicleStatus = async (req, res) => {
    try {
        const { status, currentMission } = req.body;
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        const prevStatus = vehicle.status;
        if (status) vehicle.status = status;
        if (currentMission !== undefined) vehicle.currentMission = currentMission;

        await vehicle.save();

        const updatedVehicle = await Vehicle.findById(vehicle._id).populate("assignedIncident");
        emitVehicleSocketEvent("vehicleStatusUpdated", updatedVehicle);
        emitVehicleSocketEvent("vehicleUpdated", updatedVehicle);

        // Notify and alert triggers
        if (prevStatus !== "On Mission" && status === "On Mission") {
            await notifyAdmins(
                "Rescue Mission Started",
                `Rescue mission has started for vehicle ${updatedVehicle.vehicleNumber} (${updatedVehicle.vehicleType}).`
            );
        } else if (prevStatus !== "Returning" && status === "Returning") {
            await notifyAdmins(
                "Vehicle Returning",
                `Vehicle ${updatedVehicle.vehicleNumber} is returning to depot.`
            );
        } else if (prevStatus !== "Maintenance" && status === "Maintenance") {
            await notifyAdmins(
                "Vehicle Maintenance Mode",
                `Vehicle ${updatedVehicle.vehicleNumber} is placed into maintenance.`
            );
        }

        res.status(200).json({ success: true, data: updatedVehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateLiveLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        vehicle.latitude = Number(latitude);
        vehicle.longitude = Number(longitude);
        await vehicle.save();

        const updatedVehicle = await Vehicle.findById(vehicle._id).populate("assignedIncident");
        emitVehicleSocketEvent("vehicleLocationUpdated", updatedVehicle);
        emitVehicleSocketEvent("vehicleUpdated", updatedVehicle);

        res.status(200).json({ success: true, data: updatedVehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markMissionComplete = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) {
            return res.status(404).json({ success: false, message: "Vehicle not found" });
        }

        vehicle.assignedIncident = null;
        vehicle.currentMission = "";
        vehicle.status = "Available";
        await vehicle.save();

        const updatedVehicle = await Vehicle.findById(vehicle._id).populate("assignedIncident");
        emitVehicleSocketEvent("vehicleMissionCompleted", updatedVehicle);
        emitVehicleSocketEvent("vehicleUpdated", updatedVehicle);

        await notifyAdmins(
            "Rescue Mission Completed",
            `Vehicle ${updatedVehicle.vehicleNumber} has successfully completed its rescue mission.`
        );

        res.status(200).json({ success: true, data: updatedVehicle });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
