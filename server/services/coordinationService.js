import CommandCenter from "../models/CommandCenter.js";
import Agency from "../models/Agency.js";
import RescueTeam from "../models/RescueTeam.js";
import Vehicle from "../models/Vehicle.js";
import Warehouse from "../models/Warehouse.js";
import Shelter from "../models/Shelter.js";
import Incident from "../models/Incident.js";
import { getSocketIO } from "../sockets/socket.js";

// Safe Socket socket emitter helper
const emitCommandEvent = (event, data) => {
    try {
        const io = getSocketIO();
        if (io) {
            io.emit(event, data);
        }
    } catch (e) {
        console.warn(`[Socket IO] Broadcast skip for ${event}:`, e.message);
    }
};

/**
 * Create a new Command Center for an Incident
 */
export const createCommandCenter = async (data) => {
    const { incidentId, commander, objectives = [], participatingAgencyIds = [] } = data;

    // Verify incident exists
    const incident = await Incident.findById(incidentId);
    if (!incident) {
        throw new Error("Incident not found.");
    }

    const commandCenter = new CommandCenter({
        incident: incidentId,
        participatingAgencies: participatingAgencyIds,
        assignedCommander: commander,
        objectives: objectives,
        timeline: [
            {
                action: "Command Center Initialized",
                details: `Command Control Center established for incident: "${incident.title}" by Commander ${commander}.`,
            }
        ]
    });

    await commandCenter.save();

    // Populate incident and participatingAgencies for response
    const populated = await CommandCenter.findById(commandCenter._id)
        .populate("incident")
        .populate("participatingAgencies");

    emitCommandEvent("commandCenterCreated", populated);
    return populated;
};

/**
 * Join an agency to a command center
 */
export const joinAgency = async (commandCenterId, agencyId) => {
    const commandCenter = await CommandCenter.findById(commandCenterId);
    if (!commandCenter) {
        throw new Error("Command Center not found.");
    }

    const agency = await Agency.findById(agencyId);
    if (!agency) {
        throw new Error("Agency not found.");
    }

    // Check if already in participatingAgencies
    if (commandCenter.participatingAgencies.includes(agencyId)) {
        return commandCenter;
    }

    commandCenter.participatingAgencies.push(agencyId);
    commandCenter.timeline.push({
        agency: agencyId,
        action: "Agency Joined",
        details: `${agency.agencyName} (${agency.agencyType}) joined command room.`,
    });

    await commandCenter.save();

    const populated = await CommandCenter.findById(commandCenterId)
        .populate("incident")
        .populate("participatingAgencies")
        .populate("activeMissions.agency")
        .populate("sharedResources.fromAgency")
        .populate("sharedResources.toAgency");

    emitCommandEvent("agencyJoined", { commandCenterId, agency, populated });
    return populated;
};

/**
 * Assign a Mission
 */
export const assignMission = async (commandCenterId, missionData) => {
    const { missionName, agencyId, teamIds = [], vehicleIds = [], description = "", location } = missionData;

    const commandCenter = await CommandCenter.findById(commandCenterId);
    if (!commandCenter) {
        throw new Error("Command Center not found.");
    }

    const agency = await Agency.findById(agencyId);
    if (!agency) {
        throw new Error("Agency not found.");
    }

    // Prepare mission object
    const newMission = {
        missionName,
        agency: agencyId,
        teams: teamIds,
        vehicles: vehicleIds,
        description,
        location,
        status: "Dispatched",
        updatedAt: new Date()
    };

    commandCenter.activeMissions.push(newMission);

    // Log in timeline
    commandCenter.timeline.push({
        agency: agencyId,
        action: "Mission Dispatched",
        details: `Mission "${missionName}" assigned to ${agency.agencyName}. Teams assigned: ${teamIds.length}, Vehicles: ${vehicleIds.length}.`,
    });

    await commandCenter.save();

    // Optionally set teams and vehicles status to On Mission
    if (teamIds.length > 0) {
        await RescueTeam.updateMany({ _id: { $in: teamIds } }, { status: "On Mission" });
    }
    if (vehicleIds.length > 0) {
        await Vehicle.updateMany({ _id: { $in: vehicleIds } }, { status: "On Mission" });
    }

    const populated = await CommandCenter.findById(commandCenterId)
        .populate("incident")
        .populate("participatingAgencies")
        .populate("activeMissions.agency")
        .populate("activeMissions.teams")
        .populate("activeMissions.vehicles")
        .populate("sharedResources.fromAgency")
        .populate("sharedResources.toAgency");

    emitCommandEvent("missionAssigned", { commandCenterId, mission: populated.activeMissions[populated.activeMissions.length - 1], populated });
    return populated;
};

/**
 * Update active mission status
 */
export const updateMissionStatus = async (commandCenterId, missionId, status) => {
    const commandCenter = await CommandCenter.findById(commandCenterId);
    if (!commandCenter) {
        throw new Error("Command Center not found.");
    }

    const mission = commandCenter.activeMissions.id(missionId);
    if (!mission) {
        throw new Error("Mission not found.");
    }

    const oldStatus = mission.status;
    mission.status = status;
    mission.updatedAt = new Date();

    // Log progress in timeline
    commandCenter.timeline.push({
        agency: mission.agency,
        action: `Mission ${status}`,
        details: `Mission "${mission.missionName}" status updated from ${oldStatus} to ${status}.`,
    });

    await commandCenter.save();

    // If completed or aborted, free up the teams and vehicles (make them Available again)
    if (["Completed", "Aborted"].includes(status)) {
        if (mission.teams && mission.teams.length > 0) {
            await RescueTeam.updateMany({ _id: { $in: mission.teams } }, { status: "Available" });
        }
        if (mission.vehicles && mission.vehicles.length > 0) {
            await Vehicle.updateMany({ _id: { $in: mission.vehicles } }, { status: "Available" });
        }
    }

    const populated = await CommandCenter.findById(commandCenterId)
        .populate("incident")
        .populate("participatingAgencies")
        .populate("activeMissions.agency")
        .populate("activeMissions.teams")
        .populate("activeMissions.vehicles")
        .populate("sharedResources.fromAgency")
        .populate("sharedResources.toAgency");

    emitCommandEvent("missionUpdated", { commandCenterId, missionId, status, populated });
    return populated;
};

/**
 * Share resources between agencies
 */
export const shareResource = async (commandCenterId, resourceData) => {
    const { resourceType, name, fromAgencyId, toAgencyId = null, details = "", quantity = 1 } = resourceData;

    const commandCenter = await CommandCenter.findById(commandCenterId);
    if (!commandCenter) {
        throw new Error("Command Center not found.");
    }

    const fromAgency = await Agency.findById(fromAgencyId);
    if (!fromAgency) {
        throw new Error("Providing agency not found.");
    }

    let toAgencyName = "Command Pool";
    if (toAgencyId) {
        const toAgency = await Agency.findById(toAgencyId);
        if (toAgency) {
            toAgencyName = toAgency.agencyName;
        }
    }

    const newShared = {
        resourceType,
        name,
        fromAgency: fromAgencyId,
        toAgency: toAgencyId || undefined,
        details,
        quantity,
        status: "Requested",
    };

    commandCenter.sharedResources.push(newShared);
    commandCenter.timeline.push({
        agency: fromAgencyId,
        action: "Resource Shared",
        details: `${fromAgency.agencyName} shared ${quantity}x ${name} (${resourceType}) for use by ${toAgencyName}.`,
    });

    await commandCenter.save();

    const populated = await CommandCenter.findById(commandCenterId)
        .populate("incident")
        .populate("participatingAgencies")
        .populate("activeMissions.agency")
        .populate("sharedResources.fromAgency")
        .populate("sharedResources.toAgency");

    const recentResource = populated.sharedResources[populated.sharedResources.length - 1];

    emitCommandEvent("resourceShared", { commandCenterId, resource: recentResource, populated });
    return populated;
};

/**
 * Update resource status
 */
export const updateResourceStatus = async (commandCenterId, sharedResourceId, status) => {
    const commandCenter = await CommandCenter.findById(commandCenterId);
    if (!commandCenter) {
        throw new Error("Command Center not found.");
    }

    const resource = commandCenter.sharedResources.id(sharedResourceId);
    if (!resource) {
        throw new Error("Shared resource entry not found.");
    }

    const oldStatus = resource.status;
    resource.status = status;

    commandCenter.timeline.push({
        agency: resource.fromAgency,
        action: `Resource State: ${status}`,
        details: `Shared resource "${resource.name}" updated to state: ${status} (formerly: ${oldStatus}).`,
    });

    await commandCenter.save();

    const populated = await CommandCenter.findById(commandCenterId)
        .populate("incident")
        .populate("participatingAgencies")
        .populate("activeMissions.agency")
        .populate("sharedResources.fromAgency")
        .populate("sharedResources.toAgency");

    emitCommandEvent("resourceShared", { commandCenterId, resource: populated.sharedResources.id(sharedResourceId), populated });
    return populated;
};

/**
 * Post Command Message
 */
export const postCommandMessage = async (commandCenterId, sender, agencyId, message) => {
    const commandCenter = await CommandCenter.findById(commandCenterId);
    if (!commandCenter) {
        throw new Error("Command Center not found.");
    }

    const msg = {
        sender,
        agency: agencyId || undefined,
        message,
        timestamp: new Date()
    };

    commandCenter.messages.push(msg);
    await commandCenter.save();

    const populatedMsg = commandCenter.messages[commandCenter.messages.length - 1];

    emitCommandEvent("commandMessage", { commandCenterId, message: msg, populatedCreated: populatedMsg });
    return populatedMsg;
};

/**
 * Get Agency & Core availability audit list
 */
export const getAgencyAvailability = async () => {
    const [agencies, rescueTeams, vehicles, warehouses, shelters] = await Promise.all([
        Agency.find({ status: "Active" }),
        RescueTeam.find({}),
        Vehicle.find({}),
        Warehouse.find({}),
        Shelter.find({ status: "Active" }),
    ]);

    // Summarize availability metrics
    const totalTeams = rescueTeams.length;
    const availableTeams = rescueTeams.filter(t => t.status === "Available").length;
    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === "Available").length;
    const totalShelterCapacity = shelters.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const occupantShelter = shelters.reduce((sum, s) => sum + (s.currentOccupancy || 0), 0);

    const summarizedAvailability = {
        agenciesCount: agencies.length,
        rescueTeams: {
            total: totalTeams,
            available: availableTeams,
            percentage: totalTeams > 0 ? Math.round((availableTeams / totalTeams) * 100) : 0,
        },
        vehicles: {
            total: totalVehicles,
            available: availableVehicles,
            percentage: totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0,
        },
        shelters: {
            total: shelters.length,
            occupancy: occupantShelter,
            capacity: totalShelterCapacity,
            percentage: totalShelterCapacity > 0 ? Math.round((occupantShelter / totalShelterCapacity) * 100) : 0,
        },
        warehouses: {
            total: warehouses.length,
            stockLevels: warehouses.map(w => ({
                id: w._id,
                name: w.name,
                inventoryCount: (w.inventory || []).reduce((sum, i) => sum + (i.quantity || 0), 0),
            }))
        }
    };

    return {
        agencies,
        summarizedAvailability
    };
};

/**
 * Seed initial default agencies if collection is empty
 */
export const seedAgencies = async () => {
    try {
        const count = await Agency.countDocuments();
        if (count > 0) return;

        const defaultAgencies = [
            {
                agencyName: "Kerala State Disaster Management Authority (KSDMA)",
                agencyType: "KSDMA",
                district: "Thiruvananthapuram",
                headquarters: {
                    address: "Observatory Hills, Vikas Bhavan P.O., Trivandrum",
                    latitude: 8.5032,
                    longitude: 76.9536
                },
                contactPerson: "Dr. Sekhar L. Kuriakose (Director)",
                phone: "+91 471 2331345",
                email: "ksdma.kerala@gov.in"
            },
            {
                agencyName: "Kerala Fire & Rescue Services",
                agencyType: "Fire & Rescue Services",
                district: "Ernakulam",
                headquarters: {
                    address: "Fire Force Headquarters, Gandhi Nagar, Kochi",
                    latitude: 9.9723,
                    longitude: 76.2941
                },
                contactPerson: "Commandant General Fire Force",
                phone: "+91 484 2205555",
                email: "fire.services@kerala.gov.in"
            },
            {
                agencyName: "Kerala Police Department Command",
                agencyType: "Police Department",
                district: "Thiruvananthapuram",
                headquarters: {
                    address: "Police Headquarters, Vazhuthacaud, Trivandrum",
                    latitude: 8.5011,
                    longitude: 76.9610
                },
                contactPerson: "Adgp Law & Order",
                phone: "+91 471 2724800",
                email: "phq.pol@kerala.gov.in"
            },
            {
                agencyName: "Kerala Health & Medical Services",
                agencyType: "Health Department",
                district: "Thrissur",
                headquarters: {
                    address: "Directorate of Health Services, Thrissur General Hospital Road",
                    latitude: 10.5186,
                    longitude: 76.2162
                },
                contactPerson: "Director Health Services",
                phone: "+91 487 2322300",
                email: "dhs.kerala@gov.in"
            },
            {
                agencyName: "National Disaster Response Force (NDRF) - 10 BN",
                agencyType: "NDRF",
                district: "Kozhikode",
                headquarters: {
                    address: "NDRF Regional Response Center, Calicut",
                    latitude: 11.2618,
                    longitude: 75.8016
                },
                contactPerson: "Commanding Officer, 10 BN",
                phone: "+91 495 2411600",
                email: "10bn.ndrf@rkpuram.gov.in"
            },
            {
                agencyName: "LSGD - Local Self Government Directorate",
                agencyType: "Local Self Government",
                district: "Wayanad",
                headquarters: {
                    address: "LSGD District Office, Kalpetta",
                    latitude: 11.6078,
                    longitude: 76.0886
                },
                contactPerson: "District LSGD Coordinator",
                phone: "+91 493 6202450",
                email: "lsgd.wayanad@kerala.gov.in"
            }
        ];

        await Agency.insertMany(defaultAgencies);
        console.log("✅ Seeded default agencies successfully.");
    } catch (err) {
        console.warn("⚠️ Agency seeding skipped or failed:", err.message);
    }
};
