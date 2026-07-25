import * as coordService from "../services/coordinationService.js";
import CommandCenter from "../models/CommandCenter.js";
import Agency from "../models/Agency.js";

/**
 * Get all command centers
 */
export const getCommandCenters = async (req, res) => {
    try {
        const centers = await CommandCenter.find({})
            .populate("incident")
            .populate("participatingAgencies")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: centers.length,
            data: centers
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve command centers.",
            error: err.message
        });
    }
};

/**
 * Get single command center detail
 */
export const getCommandCenterById = async (req, res) => {
    try {
        const center = await CommandCenter.findById(req.params.id)
            .populate("incident")
            .populate("participatingAgencies")
            .populate("activeMissions.agency")
            .populate("activeMissions.teams")
            .populate("activeMissions.vehicles")
            .populate("sharedResources.fromAgency")
            .populate("sharedResources.toAgency");

        if (!center) {
            return res.status(404).json({
                success: false,
                message: "Command center not found."
            });
        }

        res.status(200).json({
            success: true,
            data: center
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve command center detail.",
            error: err.message
        });
    }
};

/**
 * Establish a new command center
 */
export const createCommandCenter = async (req, res) => {
    try {
        const { incidentId, commander, objectives, participatingAgencyIds } = req.body;

        if (!incidentId || !commander) {
            return res.status(400).json({
                success: false,
                message: "Incident ID and commander name/identifier are required."
            });
        }

        const center = await coordService.createCommandCenter({
            incidentId,
            commander,
            objectives,
            participatingAgencyIds
        });

        res.status(201).json({
            success: true,
            data: center
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to initialize command center.",
            error: err.message
        });
    }
};

/**
 * Join an agency to a command center
 */
export const joinAgency = async (req, res) => {
    try {
        const commandCenterId = req.params.id;
        const { agencyId } = req.body;

        if (!agencyId) {
            return res.status(400).json({
                success: false,
                message: "Agency ID is required."
            });
        }

        const updatedCenter = await coordService.joinAgency(commandCenterId, agencyId);

        res.status(200).json({
            success: true,
            data: updatedCenter
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to join agency to command room.",
            error: err.message
        });
    }
};

/**
 * Dispatch / Assign a Mission
 */
export const assignMission = async (req, res) => {
    try {
        const commandCenterId = req.params.id;
        const { missionName, agencyId, teamIds, vehicleIds, description, location } = req.body;

        if (!missionName || !agencyId) {
            return res.status(400).json({
                success: false,
                message: "Mission name and agency ID are required."
            });
        }

        const updatedCenter = await coordService.assignMission(commandCenterId, {
            missionName,
            agencyId,
            teamIds,
            vehicleIds,
            description,
            location
        });

        res.status(200).json({
            success: true,
            data: updatedCenter
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to dispatch command mission.",
            error: err.message
        });
    }
};

/**
 * Update Mission Status
 */
export const updateMissionStatus = async (req, res) => {
    try {
        const { id, missionId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required."
            });
        }

        const updatedCenter = await coordService.updateMissionStatus(id, missionId, status);

        res.status(200).json({
            success: true,
            data: updatedCenter
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to transition mission status.",
            error: err.message
        });
    }
};

/**
 * Share Resource
 */
export const shareResource = async (req, res) => {
    try {
        const commandCenterId = req.params.id;
        const { resourceType, name, fromAgencyId, toAgencyId, details, quantity } = req.body;

        if (!resourceType || !name || !fromAgencyId) {
            return res.status(400).json({
                success: false,
                message: "Resource type, name, and fromAgencyId are required."
            });
        }

        const updatedCenter = await coordService.shareResource(commandCenterId, {
            resourceType,
            name,
            fromAgencyId,
            toAgencyId,
            details,
            quantity
        });

        res.status(200).json({
            success: true,
            data: updatedCenter
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to log shared resource deployment.",
            error: err.message
        });
    }
};

/**
 * Update Resource Deployment Status
 */
export const updateResourceStatus = async (req, res) => {
    try {
        const { id, resourceId } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required."
            });
        }

        const updatedCenter = await coordService.updateResourceStatus(id, resourceId, status);

        res.status(200).json({
            success: true,
            data: updatedCenter
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to update shared resource status.",
            error: err.message
        });
    }
};

/**
 * Send Command Message
 */
export const postCommandMessage = async (req, res) => {
    try {
        const commandCenterId = req.params.id;
        const { agencyId, message, sender } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: "Message body is required."
            });
        }

        // Fallback to req.user details if logged in
        const senderName = sender || req.user?.fullName || "Field Command";

        const posted = await coordService.postCommandMessage(commandCenterId, senderName, agencyId, message);

        res.status(201).json({
            success: true,
            data: posted
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to dispatch command message.",
            error: err.message
        });
    }
};

/**
 * Get Agency availability dashboard summary
 */
export const getAgencyAvailability = async (req, res) => {
    try {
        const availability = await coordService.getAgencyAvailability();
        res.status(200).json({
            success: true,
            data: availability
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to compile agency availability lists.",
            error: err.message
        });
    }
};

/**
 * Create a new Agency
 */
export const createAgency = async (req, res) => {
    try {
        const { agencyName, agencyType, district, headquarters, contactPerson, phone, email } = req.body;

        if (!agencyName || !agencyType || !district || !headquarters?.latitude || !headquarters?.longitude) {
            return res.status(400).json({
                success: false,
                message: "Agency Name, Type, District, and headquarters coords are required."
            });
        }

        const exists = await Agency.findOne({ agencyName });
        if (exists) {
            return res.status(400).json({
                success: false,
                message: `Agency with name "${agencyName}" already exists.`
            });
        }

        const agency = new Agency({
            agencyName,
            agencyType,
            district,
            headquarters,
            contactPerson,
            phone,
            email
        });

        await agency.save();

        res.status(201).json({
            success: true,
            data: agency
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to register agency.",
            error: err.message
        });
    }
};

/**
 * Get list of all agencies
 */
export const getAgencies = async (req, res) => {
    try {
        const agencies = await Agency.find({ status: "Active" }).sort({ agencyName: 1 });
        res.status(200).json({
            success: true,
            count: agencies.length,
            data: agencies
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to retrieve agencies.",
            error: err.message
        });
    }
};
