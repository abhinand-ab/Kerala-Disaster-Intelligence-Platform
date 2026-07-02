import Incident from "../models/Incident.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";

const emitIncidentSocketEvent = (eventName, payload) => {
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
POST /api/incidents
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