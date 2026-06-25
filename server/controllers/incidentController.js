import Incident from "../models/Incident.js";

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

    res.status(201).json({
      success: true,
      message: "Incident reported successfully.",
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