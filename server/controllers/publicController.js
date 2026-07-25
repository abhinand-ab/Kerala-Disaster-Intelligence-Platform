import {
    getAggregatedPublicDashboard,
    getPublicSheltersList,
    getPublicIncidentsList,
    getPublicWeatherData,
    getPublicActiveAlerts,
    getPublicRiskAssessments,
    EMERGENCY_CONTACTS,
    DISTRICT_EMERGENCY_CONTACTS,
    FAQS
} from "../services/publicInfoService.js";
import Incident from "../models/Incident.js";

/**
 * GET /api/public/dashboard
 * Fetch aggregated public dashboard statistics
 */
export const getPublicDashboard = async (req, res) => {
    try {
        const data = await getAggregatedPublicDashboard();
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        console.error("GET PUBLIC DASHBOARD ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/public/shelters
 * Fetch active shelters list (Open or Full)
 */
export const getPublicShelters = async (req, res) => {
    try {
        const filters = {
            district: req.query.district
        };
        const shelters = await getPublicSheltersList(filters);
        res.status(200).json({
            success: true,
            count: shelters.length,
            data: shelters
        });
    } catch (error) {
        console.error("GET PUBLIC SHELTERS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/public/incidents
 * Fetch public active verified incidents
 */
export const getPublicIncidents = async (req, res) => {
    try {
        const filters = {
            district: req.query.district,
            category: req.query.category
        };
        const incidents = await getPublicIncidentsList(filters);
        res.status(200).json({
            success: true,
            count: incidents.length,
            data: incidents
        });
    } catch (error) {
        console.error("GET PUBLIC INCIDENTS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/public/weather
 * Fetch public weather snapshots
 */
export const getPublicWeather = async (req, res) => {
    try {
        const district = req.query.district;
        const weather = await getPublicWeatherData(district);
        res.status(200).json({
            success: true,
            data: weather
        });
    } catch (error) {
        console.error("GET PUBLIC WEATHER ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/public/alerts
 * Fetch public active alerts
 */
export const getPublicAlerts = async (req, res) => {
    try {
        const alerts = await getPublicActiveAlerts();
        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts
        });
    } catch (error) {
        console.error("GET PUBLIC ALERTS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/public/emergency-contacts
 * Fetch emergency contacts and district control rooms
 */
export const getEmergencyContactsList = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                general: EMERGENCY_CONTACTS,
                district: DISTRICT_EMERGENCY_CONTACTS
            }
        });
    } catch (error) {
        console.error("GET EMERGENCY CONTACTS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/public/faqs
 * Fetch disaster safety and platform FAQs
 */
export const getFAQs = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: FAQS
        });
    } catch (error) {
        console.error("GET FAQS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/public/safe-routes
 * Get available roadblocks or active hazards to overlay route routing planning
 */
export const getSafeRoutes = async (req, res) => {
    try {
        // Fetch active hazard points
        const hazards = await Incident.find({
            verificationStatus: true,
            status: { $in: ["Reported", "Verified", "Assigned"] },
            category: { $in: ["Road Block", "Flood", "Landslide"] }
        }).select("title description category severity location status createdAt");

        res.status(200).json({
            success: true,
            count: hazards.length,
            data: hazards
        });
    } catch (error) {
        console.error("GET SAFE ROUTES ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/public/risk
 * Get district-wise risk assessment intelligence (flooding threat scale / landslide propensity scores)
 */
export const getPublicRisk = async (req, res) => {
    try {
        const { district } = req.query;
        const assessments = await getPublicRiskAssessments(district);
        res.status(200).json({
            success: true,
            data: assessments
        });
    } catch (error) {
        console.error("GET PUBLIC RISK ASSESSMENTS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
