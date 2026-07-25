import EmergencyRequest from "../models/EmergencyRequest.js";
import Shelter from "../models/Shelter.js";
import Vehicle from "../models/Vehicle.js";
import RescueTeam from "../models/RescueTeam.js";
import Warehouse from "../models/Warehouse.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";
import { generateSmartAssignment } from "../services/aiDecisionEngine.js";

// Helper to compute geographic distance (Haversine formula) in km
const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// Helper for socket broadcasts (Step 4)
const emitEmergencySocketEvent = (eventName, payload) => {
    try {
        const io = getSocketIO();
        io.emit(eventName, payload);
    } catch (error) {
        console.warn("Global socket emit skipped:", error.message);
    }
};

// Helper to create & dispatch notifications (Step 11)
const dispatchNotification = async ({ user, title, message, type, request }) => {
    try {
        const notification = await Notification.create({
            user,
            title,
            message,
            type: "system", // default type under schema
        });
        try {
            const io = getSocketIO();
            io.to(user.toString()).emit("notificationCreated", notification);
        } catch (e) {
            console.warn("Socket notification send failed:", e.message);
        }
        return notification;
    } catch (err) {
        console.error("Failed to create alert notification:", err);
        return null;
    }
};

/**
 * Submit SOS (Public)
 * POST /api/emergency/sos
 */
export const submitSOS = async (req, res) => {
    try {
        const request = await EmergencyRequest.create(req.body);

        // Notify all admins (Step 11)
        const admins = await User.find({ role: "admin" }).select("_id");
        await Promise.all(
            admins.map((adm) =>
                dispatchNotification({
                    user: adm._id,
                    title: `🚨 Emergency SOS: ${request.citizenName}`,
                    message: `Type: ${request.emergencyType} (${request.severity}). Location: ${request.district}. Msg: ${request.description}`,
                    type: "system",
                    request: request._id,
                })
            )
        );

        // Broadcast Socket Event (Step 4)
        emitEmergencySocketEvent("emergencyCreated", request);

        // Trigger AI Smart Assignment recommendations for the new SOS request
        generateSmartAssignment("SOS", request._id).catch((err) =>
            console.error("AI Smart Assignment failed for emergency request:", err.message)
        );

        res.status(201).json({
            success: true,
            message: "SOS Emergency request submitted successfully. Responders have been notified.",
            data: request,
        });
    } catch (error) {
        console.error("SOS Submission failure:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all request logs (Admin/Protected)
 * GET /api/emergency/requests
 */
export const getEmergencyRequests = async (req, res) => {
    try {
        const { status, severity, search, district } = req.query;
        const filter = {};

        if (status) filter.requestStatus = status;
        if (severity) filter.severity = severity;
        if (district) filter.district = district;
        if (search) {
            filter.$or = [
                { citizenName: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
            ];
        }

        const requests = await EmergencyRequest.find(filter)
            .populate("assignedTeam")
            .populate("assignedVehicle")
            .populate("assignedShelter")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get single request with automated suggestions (Step 10)
 * GET /api/emergency/requests/:id
 */
export const getEmergencyRequestById = async (req, res) => {
    try {
        const request = await EmergencyRequest.findById(req.params.id)
            .populate("assignedTeam")
            .populate("assignedVehicle")
            .populate("assignedShelter");

        if (!request) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        // Step 10: Automatic Proximity-Based Suggestions (Shelters, Vehicles, Rescue Teams, Warehouses)
        const lat = request.latitude;
        const lon = request.longitude;

        // Fetch potential assets
        const [shelters, vehicles, teams, warehouses] = await Promise.all([
            Shelter.find({ status: "Open" }),
            Vehicle.find({ status: "Available" }),
            RescueTeam.find({ status: "Available" }),
            Warehouse.find({}),
        ]);

        const suggestions = {
            shelters: shelters
                .map((s) => ({
                    ...s.toObject(),
                    distance: getDistance(lat, lon, s.latitude, s.longitude),
                }))
                .filter((s) => s.distance !== Infinity)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3),

            vehicles: vehicles
                .map((v) => ({
                    ...v.toObject(),
                    distance: getDistance(lat, lon, v.latitude, v.longitude),
                }))
                .filter((v) => v.distance !== Infinity)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3),

            teams: teams
                .map((t) => {
                    // If team has coordinates through assigned vehicle, find team location; else look up based on matches
                    return {
                        ...t.toObject(),
                        // fallback: calculate distance based on district matches
                        distance: t.district.toLowerCase() === request.district.toLowerCase() ? 0 : 50,
                    };
                })
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3),

            warehouses: warehouses
                .map((w) => ({
                    ...w.toObject(),
                    distance: getDistance(lat, lon, w.latitude, w.longitude),
                }))
                .filter((w) => w.distance !== Infinity)
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3),
        };

        res.status(200).json({ success: true, data: request, suggestions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Update request coordinates or basic parameters
 * PUT /api/emergency/requests/:id
 */
export const updateEmergencyRequest = async (req, res) => {
    try {
        const request = await EmergencyRequest.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!request) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        emitEmergencySocketEvent("emergencyUpdated", request);

        if (req.body.latitude || req.body.longitude) {
            emitEmergencySocketEvent("emergencyLocationUpdated", {
                id: request._id,
                latitude: request.latitude,
                longitude: request.longitude,
            });
        }

        res.status(200).json({ success: true, data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Assign responders (Step 10 / 2)
 * PATCH /api/emergency/requests/:id/assign
 */
export const assignResponders = async (req, res) => {
    try {
        const { teamId, vehicleId, shelterId } = req.body;
        const request = await EmergencyRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        if (teamId !== undefined) request.assignedTeam = teamId || null;
        if (vehicleId !== undefined) request.assignedVehicle = vehicleId || null;
        if (shelterId !== undefined) request.assignedShelter = shelterId || null;

        if (teamId || vehicleId || shelterId) {
            request.requestStatus = "Assigned";
        }

        await request.save();

        // Populate references for return object and sockets
        await request.populate(["assignedTeam", "assignedVehicle", "assignedShelter"]);

        // Dispatches (Step 11)
        if (teamId) {
            // Find team leader or members to alert
            const team = await RescueTeam.findById(teamId);
            if (team && team.leader) {
                await dispatchNotification({
                    user: team.leader,
                    title: "🚨 New Rescue Team Callout",
                    message: `Team ${team.teamName} assigned to Emergency of ${request.citizenName} in ${request.district}`,
                    type: "system",
                    request: request._id,
                });
            }
        }

        if (vehicleId) {
            const vehicle = await Vehicle.findById(vehicleId);
            if (vehicle && vehicle.createdBy) {
                await dispatchNotification({
                    user: vehicle.createdBy,
                    title: "🚚 Emergency Fleet Task Dispatch",
                    message: `Vehicle ${vehicle.vehicleNumber} dispatched for ${request.citizenName}`,
                    type: "system",
                    request: request._id,
                });
            }
        }

        emitEmergencySocketEvent("emergencyAssigned", request);

        res.status(200).json({
            success: true,
            message: "Emergency request responder assignments updated successfully.",
            data: request,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Change status / Resolve / Close (Step 2)
 * PATCH /api/emergency/requests/:id/status
 */
export const changeRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await EmergencyRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, message: "Emergency request not found." });
        }

        request.requestStatus = status;
        await request.save();

        await request.populate(["assignedTeam", "assignedVehicle", "assignedShelter"]);

        emitEmergencySocketEvent("emergencyUpdated", request);

        if (status === "Resolved") {
            emitEmergencySocketEvent("emergencyResolved", request._id);

            // Create notification to admins/assigned members
            const admins = await User.find({ role: "admin" }).select("_id");
            await Promise.all(
                admins.map((adm) =>
                    dispatchNotification({
                        user: adm._id,
                        title: `✅ SOS Request Resolved`,
                        message: `${request.citizenName}'s emergency request in ${request.district} has been closed/resolved.`,
                        type: "system",
                        request: request._id,
                    })
                )
            );
        }

        res.status(200).json({
            success: true,
            message: `Emergency request status updated to ${status}.`,
            data: request,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Public Request Tracking Endpoint
 * GET /api/emergency/track/:phone
 */
export const trackRequestByPhone = async (req, res) => {
    try {
        const requests = await EmergencyRequest.find({ phone: req.params.phone })
            .populate("assignedTeam")
            .populate("assignedVehicle")
            .populate("assignedShelter")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: requests.length, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Emergency Dashboard Analytics Widgets (Step 12 & 13)
 * GET /api/emergency/analytics
 */
export const getEmergencyAnalytics = async (req, res) => {
    try {
        const allRequests = await EmergencyRequest.find({});

        // Widgets metrics (Step 12)
        const activeRequests = allRequests.filter(r => r.requestStatus !== "Resolved" && r.requestStatus !== "Cancelled").length;
        const highPriority = allRequests.filter(r => (r.severity === "Critical" || r.severity === "High") && (r.requestStatus !== "Resolved" && r.requestStatus !== "Cancelled")).length;

        // Resolved Today helper
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const resolvedToday = allRequests.filter(r => r.requestStatus === "Resolved" && new Date(r.updatedAt) >= startOfDay).length;

        // Calculate response times (simulated if no timestamp tracking is stored, or based on createdAt vs updatedAt for Resolved requests)
        const resolvedReqs = allRequests.filter(r => r.requestStatus === "Resolved");
        let responseTimeSum = 0;
        resolvedReqs.forEach(r => {
            const diffMs = new Date(r.updatedAt).getTime() - new Date(r.createdAt).getTime();
            responseTimeSum += diffMs / (60 * 1000); // minutes
        });

        const averageResponseTime = resolvedReqs.length > 0 ? Math.round(responseTimeSum / resolvedReqs.length) : 0; // minutes

        // District-wise request counts
        const districtVolume = {};
        const typeDistribution = {};

        allRequests.forEach(r => {
            districtVolume[r.district] = (districtVolume[r.district] || 0) + 1;
            typeDistribution[r.emergencyType] = (typeDistribution[r.emergencyType] || 0) + 1;
        });

        // Resource utilization analysis
        const totalTeams = await RescueTeam.countDocuments();
        const activeTeamsUsed = await EmergencyRequest.distinct("assignedTeam", { requestStatus: "Assigned" });
        const utilizationRate = totalTeams > 0 ? Math.round((activeTeamsUsed.length / totalTeams) * 100) : 0;

        res.status(200).json({
            success: true,
            widgets: {
                activeRequests,
                highPriority,
                resolvedToday,
                averageResponseTime, // in minutes
            },
            reports: {
                districtVolume,
                typeDistribution,
                resourceUtilization: {
                    totalTeams,
                    engagedTeams: activeTeamsUsed.length,
                    utilizationRate,
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
