import Incident from "../models/Incident.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";
import { updateAllDistrictsRisk } from "../services/riskEngine.js";
import { generateSmartAssignment } from "../services/aiDecisionEngine.js";
import { logActivity } from "../services/activityLogger.js";

const emitIncidentSocketEvent = (eventName, payload) => {
  try {
    const io = getSocketIO();
    io.emit(eventName, payload);
  } catch (socketError) {
    console.warn("Socket.IO broadcast skipped:");
    console.warn(socketError.message);
  }
};

const handlePublicIncidentEmits = (incident) => {
  if (incident && incident.verificationStatus === true) {
    const publicIncident = {
      _id: incident._id,
      title: incident.title,
      description: incident.description,
      category: incident.category,
      severity: incident.severity,
      location: incident.location,
      status: incident.status,
      images: incident.images,
      createdAt: incident.createdAt
    };
    emitIncidentSocketEvent("publicIncidentUpdate", publicIncident);
    if (["High", "Critical"].includes(incident.severity) && incident.status !== "Resolved") {
      emitIncidentSocketEvent("publicAlert", {
        id: incident._id,
        source: "incident",
        type: `${incident.category} Alert`,
        severity: incident.severity,
        message: incident.description,
        district: incident.location.district,
        latitude: incident.location.latitude,
        longitude: incident.location.longitude,
        timestamp: incident.createdAt
      });
    }
  }
};

const createAndEmitNotification = async ({
  user,
  title,
  message,
  type,
  incident,
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

/*
=========================================
Create Incident
=========================================
*/
export const createIncident = async (req, res) => {
  try {
    const incident = await Incident.create({
      ...req.body,
      reportedBy: req.user._id,
    });

    const admins = await User.find({ role: "admin" }).select("_id");

    await Promise.all(
      admins.map((admin) =>
        createAndEmitNotification({
          user: admin._id,
          title: "New Incident Reported",
          message: `A new incident has been reported: ${incident.title}`,
          type: "incident",
          incident: incident._id,
        })
      )
    );

    emitIncidentSocketEvent("incidentCreated", incident);
    handlePublicIncidentEmits(incident);

    // Trigger AI Decision Support smart assignment recommendations for the new incident
    generateSmartAssignment("Incident", incident._id).catch((err) =>
      console.error("AI Smart Assignment failed for incident:", err.message)
    );

    // Trigger risk engine recalculation on new incident
    updateAllDistrictsRisk().catch((err) =>
      console.error("Risk update failed after incident creation:", err)
    );

    logActivity({
      userId: req.user?._id || req.user?.id,
      userEmail: req.user?.email || "",
      userRole: req.user?.role || "guest",
      action: "Create Incident",
      module: "Incident",
      targetId: incident._id.toString(),
      targetType: "Incident",
      description: `Reported incident: ${incident.title} (Severity: ${incident.severity})`,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
      userAgent: req.headers["user-agent"] || "",
      severity: ["High", "Critical"].includes(incident.severity) ? "High" : "Low"
    }).catch(err => console.error("Audit log creation error:", err));

    res.status(201).json({
      success: true,
      message: "Incident reported successfully.",
      data: incident,
    });
  } catch (error) {
    console.error("CREATE INCIDENT ERROR:");
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/*
=========================================
Get All Incidents
GET /api/incidents
=========================================
*/
export const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find()
      .populate("reportedBy", "name email role")
      .populate("assignedTo", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: incidents.length,
      data: incidents,
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
Get Single Incident
GET /api/incidents/:id
=========================================
*/
export const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate("reportedBy", "name email role")
      .populate("assignedTo", "name email role");

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: incident,
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
Update Incident
PUT /api/incidents/:id
=========================================
*/
export const updateIncident = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found.",
      });
    }

    emitIncidentSocketEvent("incidentUpdated", incident);
    handlePublicIncidentEmits(incident);

    // Trigger risk engine recalculation on incident edit
    updateAllDistrictsRisk().catch((err) =>
      console.error("Risk update failed after incident update:", err)
    );

    logActivity({
      userId: req.user?._id || req.user?.id,
      userEmail: req.user?.email || "",
      userRole: req.user?.role || "guest",
      action: "Update Incident",
      module: "Incident",
      targetId: incident._id.toString(),
      targetType: "Incident",
      description: `Updated incident properties for: ${incident.title}`,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
      userAgent: req.headers["user-agent"] || "",
      severity: "Low"
    }).catch(err => console.error("Audit log creation error:", err));

    res.status(200).json({
      success: true,
      message: "Incident updated successfully.",
      data: incident,
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
Delete Incident
DELETE /api/incidents/:id
=========================================
*/
export const deleteIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found.",
      });
    }

    await incident.deleteOne();

    emitIncidentSocketEvent("incidentDeleted", incident._id);

    res.status(200).json({
      success: true,
      message: "Incident deleted successfully.",
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
Update Incident Status
PATCH /api/incidents/:id/status
=========================================
*/
export const updateIncidentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found.",
      });
    }

    incident.status = status;

    await incident.save();

    await createAndEmitNotification({
      user: incident.reportedBy,
      title: "Incident Status Updated",
      message: `Status changed to ${status}`,
      type: "status",
      incident: incident._id,
    });

    emitIncidentSocketEvent("incidentStatusUpdated", incident);
    handlePublicIncidentEmits(incident);

    // Trigger risk engine recalculation on status update
    updateAllDistrictsRisk().catch((err) =>
      console.error("Risk update failed after incident status change:", err)
    );

    logActivity({
      userId: req.user?._id || req.user?.id,
      userEmail: req.user?.email || "",
      userRole: req.user?.role || "guest",
      action: "Update Incident Status",
      module: "Incident",
      targetId: incident._id.toString(),
      targetType: "Incident",
      description: `Transitioned incident status for "${incident.title}" to "${status}"`,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
      userAgent: req.headers["user-agent"] || "",
      severity: "Low"
    }).catch(err => console.error("Audit log creation error:", err));

    res.status(200).json({
      success: true,
      message: "Incident status updated.",
      data: incident,
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
Assign Volunteer
PATCH /api/incidents/:id/assign
=========================================
*/
export const assignVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.body;

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: "Incident not found.",
      });
    }

    incident.assignedTo = volunteerId;
    incident.status = "Assigned";

    await incident.save();

    await createAndEmitNotification({
      user: volunteerId,
      title: "Incident Assigned",
      message: `You have been assigned to incident: ${incident.title}`,
      type: "assignment",
      incident: incident._id,
    });

    emitIncidentSocketEvent("incidentAssigned", incident);

    logActivity({
      userId: req.user?._id || req.user?.id,
      userEmail: req.user?.email || "",
      userRole: req.user?.role || "guest",
      action: "Volunteer Assignment",
      module: "Volunteer",
      targetId: volunteerId,
      targetType: "User",
      description: `Assigned volunteer (ID: ${volunteerId}) to incident: "${incident.title}"`,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
      userAgent: req.headers["user-agent"] || "",
      severity: "Low"
    }).catch(err => console.error("Audit log creation error:", err));

    res.status(200).json({
      success: true,
      message: "Volunteer assigned successfully.",
      data: incident,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};