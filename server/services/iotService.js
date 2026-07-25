import Sensor from "../models/Sensor.js";
import SensorReading from "../models/SensorReading.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";
import { updateAllDistrictsRisk } from "./riskEngine.js";

// Helper for socket broadcasts (Step 6)
const emitSocket = (eventName, payload) => {
    try {
        const io = getSocketIO();
        io.emit(eventName, payload);
    } catch (error) {
        console.warn("IoT socket broadcast skipped:", error.message);
    }
};

// Helper to push admin alert notification (Step 11)
const triggerAdminAlert = async (title, message) => {
    try {
        const admins = await User.find({ role: "admin" }).select("_id");
        const io = getSocketIO();

        for (const admin of admins) {
            const notification = await Notification.create({
                user: admin._id,
                title,
                message,
                type: "system",
            });

            try {
                io.to(admin._id.toString()).emit("notificationCreated", notification);
            } catch (err) {
                console.warn("Failed to emit IoT notification:", err.message);
            }
        }
    } catch (err) {
        console.error("Error generating IoT alarm alerts:", err);
    }
};

/**
 * Processes a new incoming IoT sensor reading
 */
export const processReading = async (sensorId, data) => {
    try {
        // Find the sensor
        let sensor = await Sensor.findOne({ sensorId });
        if (!sensor) {
            throw new Error(`Sensor ${sensorId} is not registered in the system.`);
        }

        // Recovering from Offline State
        const wasOffline = sensor.status === "Offline";
        if (wasOffline) {
            sensor.status = "Active";
            emitSocket("sensorRecovered", { sensorId, sensorName: sensor.sensorName });
            await triggerAdminAlert(
                `🟢 Sensor Restored: ${sensor.sensorName}`,
                `Sensor ${sensorId} in ${sensor.district} is back online and transmitting telemetry data.`
            );
        }

        // Step 11 & anomaly checking
        const {
            waterLevel,
            rainfall,
            temperature,
            humidity,
            riverFlow,
            waterVelocity,
            pressure,
            battery = 100,
            signalStrength = 100,
        } = data;

        // Save Reading in DB
        const reading = await SensorReading.create({
            sensor: sensor._id,
            timestamp: new Date(),
            waterLevel,
            rainfall,
            temperature,
            humidity,
            riverFlow,
            waterVelocity,
            pressure,
            battery,
        });

        // Update sensor cache status
        sensor.batteryLevel = battery;
        sensor.signalStrength = signalStrength;
        sensor.lastReading = {
            waterLevel,
            rainfall,
            temperature,
            humidity,
            riverFlow,
            waterVelocity,
            pressure,
            battery,
            timestamp: new Date(),
        };
        await sensor.save();

        // Broadcasts (Step 6)
        emitSocket("sensorUpdated", sensor);

        if (waterLevel !== undefined && waterLevel !== null) {
            emitSocket("waterLevelUpdated", { sensorId, waterLevel, river: sensor.river });

            // Threshold rules (Step 11)
            if (waterLevel > 6.0) {
                emitSocket("floodThresholdExceeded", {
                    sensorId,
                    district: sensor.district,
                    level: waterLevel,
                    type: "Danger",
                });
                await triggerAdminAlert(
                    `🚨 DANGER Water Level Exceeded: ${sensor.sensorName}`,
                    `Critical alert! Sensor ${sensorId} at ${sensor.river || "River"} in ${sensor.district} reports dangerous water levels at ${waterLevel}m (Danger threshold: 6.0m).`
                );
            } else if (waterLevel > 4.5) {
                emitSocket("floodThresholdExceeded", {
                    sensorId,
                    district: sensor.district,
                    level: waterLevel,
                    type: "Warning",
                });
                await triggerAdminAlert(
                    `⚠️ WARNING Water Level Cleared baseline: ${sensor.sensorName}`,
                    `Warning: Sensor ${sensorId} at ${sensor.river || "River"} in ${sensor.district} reports high water levels at ${waterLevel}m (Warning threshold: 4.5m).`
                );
            }
        }

        if (rainfall !== undefined && rainfall !== null) {
            emitSocket("rainfallSensorUpdated", { sensorId, rainfall });

            if (rainfall > 50) {
                await triggerAdminAlert(
                    `🌧️ Extreme Rainfall Detected: ${sensor.sensorName}`,
                    `Heavy rainfall anomaly registered at sensor ${sensorId} in ${sensor.district}: ${rainfall}mm/hr.`
                );
            }
        }

        // Battery alert (Step 11)
        if (battery < 20) {
            await triggerAdminAlert(
                `🔋 Sensor Battery Low: ${sensor.sensorName}`,
                `Battery depletion hazard! Sensor ${sensorId} in ${sensor.district} is reporting low battery capacity (${battery}%).`
            );
        }

        // Temperature anomaly
        if (temperature !== undefined && (temperature > 55 || temperature < 0)) {
            await triggerAdminAlert(
                `🌡️ Abnormal Thermal Level: ${sensor.sensorName}`,
                `Abnormal temperature reading from sensor ${sensorId} in ${sensor.district}: ${temperature}°C.`
            );
        }

        // Update Flood Risk Engine automatically (Step 13)
        updateAllDistrictsRisk().catch((err) =>
            console.error("Flood risk sync from IoT Service failed:", err)
        );

        return { success: true, reading, sensor };
    } catch (error) {
        console.error("Failed to process sensor reading:", error);
        throw error;
    }
};

/**
 * Scans for Sensors that haven't responded in 1 hour and mark them offline (Step 11)
 */
export const checkOnlineStatuses = async () => {
    try {
        const timeLimit = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

        // Find active sensors whose last reading is older than 1 hour
        const offlineSensors = await Sensor.find({
            status: "Active",
            $or: [
                { "lastReading.timestamp": { $lt: timeLimit } },
                { "lastReading.timestamp": null },
            ],
        });

        for (const sensor of offlineSensors) {
            sensor.status = "Offline";
            await sensor.save();

            emitSocket("sensorOffline", { sensorId: sensor.sensorId, sensorName: sensor.sensorName });
            await triggerAdminAlert(
                `🔌 Sensor Offline: ${sensor.sensorName}`,
                `Sensor communications breakdown! Sensor ${sensor.sensorId} in ${sensor.district} has gone offline.`
            );
        }

        if (offlineSensors.length > 0) {
            console.log(`⚠️ Offline check completed. ${offlineSensors.length} sensors mapped offline.`);
        }
    } catch (error) {
        console.error("Offline health checking failed:", error);
    }
};

/**
 * Seed initial sensors with mock data if none exist
 */
export const seedSensors = async () => {
    try {
        const count = await Sensor.countDocuments();
        if (count > 0) return;

        const mockSensors = [
            {
                sensorId: "SEN-001",
                sensorName: "Periyar River Gauge",
                sensorType: "RiverGauge",
                district: "Idukki",
                river: "Periyar",
                latitude: 9.8500,
                longitude: 77.0500,
                status: "Active",
                batteryLevel: 92,
                signalStrength: 85,
                lastReading: {
                    waterLevel: 4.1,
                    riverFlow: 350,
                    waterVelocity: 2.1,
                    battery: 92,
                    timestamp: new Date()
                }
            },
            {
                sensorId: "SEN-002",
                sensorName: "Meenachil River level Gauge",
                sensorType: "RiverGauge",
                district: "Kottayam",
                river: "Meenachil",
                latitude: 9.6800,
                longitude: 76.7200,
                status: "Active",
                batteryLevel: 88,
                signalStrength: 90,
                lastReading: {
                    waterLevel: 5.2,
                    riverFlow: 290,
                    waterVelocity: 3.4,
                    battery: 88,
                    timestamp: new Date()
                }
            },
            {
                sensorId: "SEN-003",
                sensorName: "Wayanad Rainfall Sensor",
                sensorType: "RainfallSensor",
                district: "Wayanad",
                latitude: 11.6854,
                longitude: 76.1320,
                status: "Active",
                batteryLevel: 95,
                signalStrength: 75,
                lastReading: {
                    rainfall: 42,
                    temperature: 24,
                    humidity: 89,
                    battery: 95,
                    timestamp: new Date()
                }
            },
            {
                sensorId: "SEN-004",
                sensorName: "Alappuzha Water Level Gauge",
                sensorType: "WaterLevelGauge",
                district: "Alappuzha",
                river: "Pamba",
                latitude: 9.4981,
                longitude: 76.3388,
                status: "Active",
                batteryLevel: 15,
                signalStrength: 80,
                lastReading: {
                    waterLevel: 6.3,
                    battery: 15,
                    timestamp: new Date()
                }
            },
            {
                sensorId: "SEN-005",
                sensorName: "Kozhikode Weather Hub",
                sensorType: "WeatherStation",
                district: "Kozhikode",
                latitude: 11.2588,
                longitude: 75.7804,
                status: "Active",
                batteryLevel: 100,
                signalStrength: 95,
                lastReading: {
                    rainfall: 12,
                    temperature: 28,
                    humidity: 82,
                    pressure: 1008,
                    battery: 100,
                    timestamp: new Date()
                }
            },
            {
                sensorId: "SEN-006",
                sensorName: "Thrissur River Gauge",
                sensorType: "RiverGauge",
                district: "Thrissur",
                river: "Chalakudy",
                latitude: 10.3120,
                longitude: 76.3250,
                status: "Offline",
                batteryLevel: 0,
                signalStrength: 0,
                lastReading: {
                    waterLevel: 1.8,
                    battery: 0,
                    timestamp: new Date(Date.now() - 3 * 3600 * 1000)
                }
            }
        ];

        await Sensor.insertMany(mockSensors);
        console.log("🌱 IoT Sensors seeded successfully with mock data.");
    } catch (error) {
        console.error("Failed to seed IoT sensors:", error);
    }
};
