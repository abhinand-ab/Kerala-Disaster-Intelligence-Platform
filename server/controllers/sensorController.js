import Sensor from "../models/Sensor.js";
import SensorReading from "../models/SensorReading.js";
import { processReading } from "../services/iotService.js";

/**
 * Register a new Sensor (Protected)
 * POST /api/sensors
 */
export const registerSensor = async (req, res) => {
    try {
        const existing = await Sensor.findOne({ sensorId: req.body.sensorId });
        if (existing) {
            return res.status(400).json({ success: false, message: "Sensor ID is already registered." });
        }

        const sensor = await Sensor.create(req.body);
        res.status(201).json({ success: true, message: "Sensor registered successfully.", data: sensor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Upload manual telemetry or simulator reading (Public/IoT device API client)
 * POST /api/sensors/:sensorId/reading
 */
export const updateReading = async (req, res) => {
    try {
        const { sensorId } = req.params;
        const result = await processReading(sensorId, req.body);
        res.status(200).json({ success: true, message: "Telemetry reading saved and evaluated.", data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get all/latest readings (Protected)
 * GET /api/sensors
 */
export const getLatestReadings = async (req, res) => {
    try {
        const { district, status, type, search } = req.query;
        const filter = {};

        if (district) filter.district = district;
        if (status) filter.status = status;
        if (type) filter.sensorType = type;
        if (search) {
            filter.$or = [
                { sensorName: { $regex: search, $options: "i" } },
                { sensorId: { $regex: search, $options: "i" } },
                { river: { $regex: search, $options: "i" } },
            ];
        }

        const sensors = await Sensor.find(filter).sort({ sensorId: 1 });
        res.status(200).json({ success: true, count: sensors.length, data: sensors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Single Sensor Detail
 * GET /api/sensors/:sensorId
 */
export const getSensorById = async (req, res) => {
    try {
        const { sensorId } = req.params;
        const sensor = await Sensor.findOne({ sensorId });
        if (!sensor) {
            return res.status(404).json({ success: false, message: "Sensor not found." });
        }
        res.status(200).json({ success: true, data: sensor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Sensor Reading History (Protected)
 * GET /api/sensors/:sensorId/history
 */
export const getSensorHistory = async (req, res) => {
    try {
        const { sensorId } = req.params;
        const { limit = 30 } = req.query;

        const sensor = await Sensor.findOne({ sensorId });
        if (!sensor) {
            return res.status(404).json({ success: false, message: "Sensor not found." });
        }

        const readings = await SensorReading.find({ sensor: sensor._id })
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.status(200).json({ success: true, count: readings.length, data: readings.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get District Specific Sensors
 * GET /api/sensors/district/:district
 */
export const getDistrictSensors = async (req, res) => {
    try {
        const sensors = await Sensor.find({ district: req.params.district });
        res.status(200).json({ success: true, count: sensors.length, data: sensors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get River specific Water Gauges
 * GET /api/sensors/river/:river
 */
export const getRiverSensors = async (req, res) => {
    try {
        const sensors = await Sensor.find({ river: req.params.river });
        res.status(200).json({ success: true, count: sensors.length, data: sensors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Offline Sensors
 * GET /api/sensors/status/offline
 */
export const getOfflineSensors = async (req, res) => {
    try {
        const sensors = await Sensor.find({ status: "Offline" });
        res.status(200).json({ success: true, count: sensors.length, data: sensors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete Sensor Definition
 * DELETE /api/sensors/:sensorId
 */
export const deleteSensor = async (req, res) => {
    try {
        const { sensorId } = req.params;
        const sensor = await Sensor.findOneAndDelete({ sensorId });
        if (!sensor) {
            return res.status(404).json({ success: false, message: "Sensor not found." });
        }

        // Delete associated readings
        await SensorReading.deleteMany({ sensor: sensor._id });

        res.status(200).json({ success: true, message: "Sensor and history purged successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Sensor Analytics Widgets & Reporting Reports (Step 12 & 14)
 * GET /api/sensors/analytics
 */
export const getSensorAnalytics = async (req, res) => {
    try {
        const sensors = await Sensor.find({});

        // Uptime & Status counts
        const total = sensors.length;
        const active = sensors.filter(s => s.status === "Active").length;
        const maintenance = sensors.filter(s => s.status === "Maintenance").length;
        const offline = sensors.filter(s => s.status === "Offline").length;

        // Water level summary (Max waterLevel)
        const riverGauges = sensors.filter(s => s.lastReading?.waterLevel !== null && s.lastReading?.waterLevel !== undefined);
        const maxWaterLevel = riverGauges.length > 0 ? Math.max(...riverGauges.map(s => s.lastReading.waterLevel)) : 0;

        // Rainfall summaries
        const rainGauges = sensors.filter(s => s.lastReading?.rainfall !== null && s.lastReading?.rainfall !== undefined);
        const maxRainfall = rainGauges.length > 0 ? Math.max(...rainGauges.map(s => s.lastReading.rainfall)) : 0;

        // Batter capacity
        let batterySum = 0;
        sensors.forEach(s => batterySum += s.batteryLevel);
        const avgBattery = total > 0 ? Math.round(batterySum / total) : 0;
        const lowBatteryCount = sensors.filter(s => s.batteryLevel < 20).length;

        // District-wise distribution details
        const districtStats = {};
        sensors.forEach(s => {
            districtStats[s.district] = (districtStats[s.district] || 0) + 1;
        });

        res.status(200).json({
            success: true,
            widgets: {
                totalSensors: total,
                onlineSensors: active + maintenance,
                offlineSensors: offline,
                maxWaterLevel, // m
                maxRainfall, // mm/hr
                avgBattery,
                lowBatteryCount
            },
            reports: {
                districtStats,
                statusSpread: { active, maintenance, offline },
                uptimePercentage: total > 0 ? Math.round(((active + maintenance) / total) * 100) : 0
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
