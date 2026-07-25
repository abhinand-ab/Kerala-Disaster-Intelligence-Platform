import RescueTeam from "../models/RescueTeam.js";
import Volunteer from "../models/Volunteer.js";
import Notification from "../models/Notification.js";
import Vehicle from "../models/Vehicle.js";
import { getSocketIO } from "../sockets/socket.js";

const emitTeamSocketEvent = (eventName, payload) => {
    try {
        const io = getSocketIO();
        io.emit(eventName, payload);
    } catch (socketError) {
        console.warn("Socket.IO broadcast skipped for RescueTeam:", socketError.message);
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
            console.warn("Notification socket emit skipped:", socketError.message);
        }

        return notification;
    } catch (notificationError) {
        console.warn("Notification creation skipped:", notificationError.message);
        return null;
    }
};

// Create Team
export const createRescueTeam = async (req, res) => {
    try {
        const team = await RescueTeam.create({
            ...req.body,
            createdBy: req.user._id,
        });

        const populatedTeam = await RescueTeam.findById(team._id)
            .populate("leader")
            .populate("members")
            .populate("assignedVehicle")
            .populate("assignedIncident")
            .populate("createdBy", "name email role");

        emitTeamSocketEvent("rescueTeamCreated", populatedTeam);

        res.status(201).json({
            success: true,
            message: "Rescue team created successfully.",
            data: populatedTeam,
        });
    } catch (error) {
        console.error("CREATE TEAM ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Teams
export const getRescueTeams = async (req, res) => {
    try {
        const teams = await RescueTeam.find()
            .populate("leader")
            .populate("members")
            .populate("assignedVehicle")
            .populate("assignedIncident")
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: teams.length,
            data: teams,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Single Team
export const getRescueTeamById = async (req, res) => {
    try {
        const team = await RescueTeam.findById(req.params.id)
            .populate("leader")
            .populate("members")
            .populate("assignedVehicle")
            .populate("assignedIncident")
            .populate("createdBy", "name email role");

        if (!team) {
            return res.status(404).json({ success: false, message: "Rescue team not found." });
        }

        res.status(200).json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Team
export const updateRescueTeam = async (req, res) => {
    try {
        const team = await RescueTeam.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })
            .populate("leader")
            .populate("members")
            .populate("assignedVehicle")
            .populate("assignedIncident")
            .populate("createdBy", "name email role");

        if (!team) {
            return res.status(404).json({ success: false, message: "Rescue team not found." });
        }

        emitTeamSocketEvent("rescueTeamUpdated", team);

        res.status(200).json({
            success: true,
            message: "Rescue team updated successfully.",
            data: team,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Team
export const deleteRescueTeam = async (req, res) => {
    try {
        const team = await RescueTeam.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ success: false, message: "Rescue team not found." });
        }

        // Clear team field in all members
        if (team.members && team.members.length > 0) {
            await Volunteer.updateMany(
                { _id: { $in: team.members } },
                { $set: { team: "" } }
            );
        }

        await team.deleteOne();

        emitTeamSocketEvent("rescueTeamUpdated", team._id); // notify frontend of deletion or map updates

        res.status(200).json({
            success: true,
            message: "Rescue team deleted successfully.",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Add Member
export const addMember = async (req, res) => {
    try {
        const { volunteerId } = req.body;
        const team = await RescueTeam.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ success: false, message: "Rescue team not found." });
        }

        const volunteer = await Volunteer.findById(volunteerId);
        if (!volunteer) {
            return res.status(404).json({ success: false, message: "Volunteer not found." });
        }

        if (!team.members.includes(volunteerId)) {
            team.members.push(volunteerId);
            await team.save();
        }

        volunteer.team = team.teamName;
        await volunteer.save();

        const populatedTeam = await RescueTeam.findById(team._id)
            .populate("leader")
            .populate("members")
            .populate("assignedVehicle")
            .populate("assignedIncident")
            .populate("createdBy", "name email role");

        emitTeamSocketEvent("rescueTeamUpdated", populatedTeam);

        res.status(200).json({
            success: true,
            message: "Member added successfully.",
            data: populatedTeam,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Remove Member
export const removeMember = async (req, res) => {
    try {
        const { volunteerId } = req.body;
        const team = await RescueTeam.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ success: false, message: "Rescue team not found." });
        }

        team.members = team.members.filter(m => m.toString() !== volunteerId);
        if (team.leader && team.leader.toString() === volunteerId) {
            team.leader = null;
        }
        await team.save();

        const volunteer = await Volunteer.findById(volunteerId);
        if (volunteer) {
            volunteer.team = "";
            await volunteer.save();
        }

        const populatedTeam = await RescueTeam.findById(team._id)
            .populate("leader")
            .populate("members")
            .populate("assignedVehicle")
            .populate("assignedIncident")
            .populate("createdBy", "name email role");

        emitTeamSocketEvent("rescueTeamUpdated", populatedTeam);

        res.status(200).json({
            success: true,
            message: "Member removed successfully.",
            data: populatedTeam,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Assign Team to Incident
export const assignTeamToIncident = async (req, res) => {
    try {
        const { incidentId } = req.body;
        const team = await RescueTeam.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ success: false, message: "Rescue team not found." });
        }

        team.assignedIncident = incidentId || null;
        team.status = incidentId ? "On Mission" : "Available";
        await team.save();

        // Propagate incident status update to members
        if (team.members && team.members.length > 0) {
            await Volunteer.updateMany(
                { _id: { $in: team.members } },
                {
                    $set: {
                        assignedIncident: incidentId || null,
                        status: incidentId ? "On Duty" : "Available",
                        availability: !incidentId
                    }
                }
            );
        }

        const populatedTeam = await RescueTeam.findById(team._id)
            .populate("leader")
            .populate("members")
            .populate("assignedVehicle")
            .populate("assignedIncident")
            .populate("createdBy", "name email role");

        emitTeamSocketEvent("rescueTeamAssigned", populatedTeam);
        emitTeamSocketEvent("rescueTeamUpdated", populatedTeam);

        // Notify creator or team leader
        if (team.leader) {
            await createAndEmitNotification({
                user: team.createdBy,
                title: "Rescue Team Assigned",
                message: `Team ${team.teamName} has been assigned to mission.`,
                type: "assignment",
                incident: incidentId
            });
        }

        res.status(200).json({
            success: true,
            message: incidentId ? "Team assigned to incident successfully." : "Team unassigned from incident.",
            data: populatedTeam,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Assign Team to Vehicle
export const assignTeamToVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.body;
        const team = await RescueTeam.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ success: false, message: "Rescue team not found." });
        }

        team.assignedVehicle = vehicleId || null;
        await team.save();

        // Update volunteer members' vehicles as well
        if (team.members && team.members.length > 0) {
            await Volunteer.updateMany(
                { _id: { $in: team.members } },
                { $set: { assignedVehicle: vehicleId || null } }
            );
        }

        const populatedTeam = await RescueTeam.findById(team._id)
            .populate("leader")
            .populate("members")
            .populate("assignedVehicle")
            .populate("assignedIncident")
            .populate("createdBy", "name email role");

        emitTeamSocketEvent("rescueTeamUpdated", populatedTeam);

        res.status(200).json({
            success: true,
            message: vehicleId ? "Vehicle assigned to team successfully." : "Vehicle unassigned from team.",
            data: populatedTeam,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Team Status
export const updateTeamStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const team = await RescueTeam.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ success: false, message: "Rescue team not found." });
        }

        team.status = status;
        await team.save();

        const populatedTeam = await RescueTeam.findById(team._id)
            .populate("leader")
            .populate("members")
            .populate("assignedVehicle")
            .populate("assignedIncident")
            .populate("createdBy", "name email role");

        emitTeamSocketEvent("rescueTeamUpdated", populatedTeam);

        res.status(200).json({
            success: true,
            message: "Team status updated successfully.",
            data: populatedTeam,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
