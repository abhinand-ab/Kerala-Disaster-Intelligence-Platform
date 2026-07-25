import Volunteer from "../models/Volunteer.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";

const emitVolunteerSocketEvent = (eventName, payload) => {
    try {
        const io = getSocketIO();
        io.emit(eventName, payload);
    } catch (socketError) {
        console.warn("Socket.IO broadcast skipped:");
        console.warn(socketError.message);
    }
};

const createAndEmitNotification = async ({
    user,
    title,
    message,
    type = "system",
    incident = null,
}) => {
    try {
        const notification = await Notification.create({
            user,
            title,
            message,
            type,
            incident,
        });

        try {
            const io = getSocketIO();
            io.to(user.toString()).emit("notificationCreated", notification);
        } catch (socketError) {
            console.warn("Notification socket emit skipped:");
            console.warn(socketError.message);
        }

        return notification;
    } catch (notificationError) {
        console.warn("Notification creation skipped:");
        console.warn(notificationError.message);
        return null;
    }
};

const notifyVolunteerUser = async (volunteer, title, message, incidentId) => {
    try {
        const matchedUser = await User.findOne({ email: new RegExp(`^${volunteer.email}$`, 'i') });
        if (matchedUser) {
            await createAndEmitNotification({
                user: matchedUser._id,
                title,
                message,
                type: "assignment",
                incident: incidentId,
            });
        }
    } catch (err) {
        console.warn("Could not notify matched volunteer user:", err.message);
    }
};

/*
=========================================
Create Volunteer
POST /api/volunteers
=========================================
*/
export const createVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.create({
            ...req.body,
            createdBy: req.user._id,
        });

        const populatedVolunteer = await Volunteer.findById(volunteer._id)
            .populate("currentIncident")
            .populate("createdBy", "name email role");

        emitVolunteerSocketEvent("volunteerCreated", populatedVolunteer);

        res.status(201).json({
            success: true,
            message: "Volunteer created successfully.",
            data: populatedVolunteer,
        });
    } catch (error) {
        console.error("CREATE VOLUNTEER ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Get All Volunteers
GET /api/volunteers
=========================================
*/
export const getVolunteers = async (req, res) => {
    try {
        const volunteers = await Volunteer.find()
            .populate("currentIncident")
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: volunteers.length,
            data: volunteers,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Get Single Volunteer
GET /api/volunteers/:id
=========================================
*/
export const getVolunteerById = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id)
            .populate("currentIncident")
            .populate("createdBy", "name email role");

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found.",
            });
        }

        res.status(200).json({
            success: true,
            data: volunteer,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Update Volunteer
PUT /api/volunteers/:id
=========================================
*/
export const updateVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate("currentIncident").populate("createdBy", "name email role");

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found.",
            });
        }

        emitVolunteerSocketEvent("volunteerUpdated", volunteer);

        res.status(200).json({
            success: true,
            message: "Volunteer updated successfully.",
            data: volunteer,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Delete Volunteer
DELETE /api/volunteers/:id
=========================================
*/
export const deleteVolunteer = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found.",
            });
        }

        await volunteer.deleteOne();

        emitVolunteerSocketEvent("volunteerDeleted", volunteer._id);

        res.status(200).json({
            success: true,
            message: "Volunteer deleted successfully.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Assign Volunteer to Incident
PATCH /api/volunteers/:id/assign
=========================================
*/
export const assignVolunteerToIncident = async (req, res) => {
    try {
        const { incidentId } = req.body;
        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found.",
            });
        }

        const previousIncident = volunteer.currentIncident;
        volunteer.currentIncident = incidentId || null;

        if (incidentId) {
            volunteer.availability = false;
            volunteer.status = "Busy";
        } else {
            volunteer.availability = true;
            volunteer.status = "Available";
        }

        await volunteer.save();

        const populatedVolunteer = await Volunteer.findById(volunteer._id)
            .populate("currentIncident")
            .populate("createdBy", "name email role");

        // Broadcast socket events
        emitVolunteerSocketEvent("volunteerAssigned", populatedVolunteer);
        emitVolunteerSocketEvent("volunteerUpdated", populatedVolunteer);
        emitVolunteerSocketEvent("volunteerStatusUpdated", populatedVolunteer);

        // Send notifications
        if (incidentId) {
            await notifyVolunteerUser(
                volunteer,
                "Assigned to Incident",
                `You have been assigned to incident: ${populatedVolunteer.currentIncident?.title || 'Active Incident'}`,
                incidentId
            );
        } else if (previousIncident) {
            await notifyVolunteerUser(
                volunteer,
                "Removed from Incident",
                "You have been removed from your assigned incident.",
                previousIncident
            );
        }

        res.status(200).json({
            success: true,
            message: incidentId ? "Volunteer assigned successfully." : "Volunteer unassigned successfully.",
            data: populatedVolunteer,
        });
    } catch (error) {
        console.error("ASSIGN VOLUNTEER ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Alias to support the imported/used name
export const assignVolunteer = assignVolunteerToIncident;

/*
=========================================
Mark Available
PATCH /api/volunteers/:id/available
=========================================
*/
export const markAvailable = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found.",
            });
        }

        volunteer.availability = true;
        volunteer.status = "Available";
        volunteer.currentIncident = null;

        await volunteer.save();

        const populatedVolunteer = await Volunteer.findById(volunteer._id)
            .populate("currentIncident")
            .populate("createdBy", "name email role");

        emitVolunteerSocketEvent("volunteerStatusUpdated", populatedVolunteer);
        emitVolunteerSocketEvent("volunteerUpdated", populatedVolunteer);

        await notifyVolunteerUser(
            volunteer,
            "Status Updated",
            "Your status has been updated to Available.",
            null
        );

        res.status(200).json({
            success: true,
            message: "Volunteer marked as available.",
            data: populatedVolunteer,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Mark Busy
PATCH /api/volunteers/:id/busy
=========================================
*/
export const markBusy = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found.",
            });
        }

        volunteer.availability = false;
        volunteer.status = "Busy";

        await volunteer.save();

        const populatedVolunteer = await Volunteer.findById(volunteer._id)
            .populate("currentIncident")
            .populate("createdBy", "name email role");

        emitVolunteerSocketEvent("volunteerStatusUpdated", populatedVolunteer);
        emitVolunteerSocketEvent("volunteerUpdated", populatedVolunteer);

        await notifyVolunteerUser(
            volunteer,
            "Status Updated",
            "Your status has been updated to Busy.",
            null
        );

        res.status(200).json({
            success: true,
            message: "Volunteer marked as busy.",
            data: populatedVolunteer,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Update Live Location
PATCH /api/volunteers/:id/location
=========================================
*/
export const updateLiveLocation = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: "Latitude and longitude are required.",
            });
        }

        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {
            return res.status(404).json({
                success: false,
                message: "Volunteer not found.",
            });
        }

        volunteer.latitude = Number(latitude);
        volunteer.longitude = Number(longitude);

        await volunteer.save();

        const populatedVolunteer = await Volunteer.findById(volunteer._id)
            .populate("currentIncident")
            .populate("createdBy", "name email role");

        emitVolunteerSocketEvent("volunteerLocationUpdated", {
            _id: volunteer._id,
            latitude: volunteer.latitude,
            longitude: volunteer.longitude,
        });
        emitVolunteerSocketEvent("volunteerUpdated", populatedVolunteer);

        res.status(200).json({
            success: true,
            message: "Volunteer location updated successfully.",
            data: populatedVolunteer,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Remove Volunteer Assignment
PATCH /api/volunteers/:id/unassign
=========================================
*/
export const removeAssignment = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);
        if (!volunteer) {
            return res.status(404).json({ success: false, message: "Volunteer not found." });
        }
        volunteer.assignedIncident = null;
        volunteer.assignedVehicle = null;
        volunteer.assignedShelter = null;
        volunteer.status = "Available";
        volunteer.availability = true;
        await volunteer.save();

        const populatedVolunteer = await Volunteer.findById(volunteer._id)
            .populate("assignedIncident")
            .populate("assignedVehicle")
            .populate("assignedShelter")
            .populate("createdBy", "name email role");

        emitVolunteerSocketEvent("volunteerUpdated", populatedVolunteer);
        emitVolunteerSocketEvent("volunteerStatusUpdated", populatedVolunteer);

        res.status(200).json({
            success: true,
            message: "Volunteer assignments removed.",
            data: populatedVolunteer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/*
=========================================
Update Availability
PATCH /api/volunteers/:id/availability
=========================================
*/
export const updateAvailability = async (req, res) => {
    try {
        const { availability } = req.body;
        const volunteer = await Volunteer.findById(req.params.id);
        if (!volunteer) {
            return res.status(404).json({ success: false, message: "Volunteer not found." });
        }
        volunteer.availability = !!availability;
        volunteer.status = volunteer.availability ? "Available" : "Unavailable";
        await volunteer.save();

        const populatedVolunteer = await Volunteer.findById(volunteer._id)
            .populate("assignedIncident")
            .populate("assignedVehicle")
            .populate("assignedShelter")
            .populate("createdBy", "name email role");

        emitVolunteerSocketEvent("volunteerUpdated", populatedVolunteer);
        emitVolunteerSocketEvent("volunteerStatusUpdated", populatedVolunteer);

        res.status(200).json({
            success: true,
            message: `Volunteer availability set to ${volunteer.availability}`,
            data: populatedVolunteer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/*
=========================================
Mark On Duty
PATCH /api/volunteers/:id/onduty
=========================================
*/
export const markOnDuty = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);
        if (!volunteer) {
            return res.status(404).json({ success: false, message: "Volunteer not found." });
        }
        volunteer.status = "On Duty";
        volunteer.availability = false;
        await volunteer.save();

        const populatedVolunteer = await Volunteer.findById(volunteer._id)
            .populate("assignedIncident")
            .populate("assignedVehicle")
            .populate("assignedShelter")
            .populate("createdBy", "name email role");

        emitVolunteerSocketEvent("volunteerUpdated", populatedVolunteer);
        emitVolunteerSocketEvent("volunteerStatusUpdated", populatedVolunteer);

        res.status(200).json({
            success: true,
            message: "Volunteer marked On Duty.",
            data: populatedVolunteer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/*
=========================================
Mark Off Duty
PATCH /api/volunteers/:id/offduty
=========================================
*/
export const markOffDuty = async (req, res) => {
    try {
        const volunteer = await Volunteer.findById(req.params.id);
        if (!volunteer) {
            return res.status(404).json({ success: false, message: "Volunteer not found." });
        }
        volunteer.status = "Off Duty";
        volunteer.availability = false;
        await volunteer.save();

        const populatedVolunteer = await Volunteer.findById(volunteer._id)
            .populate("assignedIncident")
            .populate("assignedVehicle")
            .populate("assignedShelter")
            .populate("createdBy", "name email role");

        emitVolunteerSocketEvent("volunteerUpdated", populatedVolunteer);
        emitVolunteerSocketEvent("volunteerStatusUpdated", populatedVolunteer);

        res.status(200).json({
            success: true,
            message: "Volunteer marked Off Duty.",
            data: populatedVolunteer
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

