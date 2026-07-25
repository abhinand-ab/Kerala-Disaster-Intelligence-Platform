import RiskAssessment from "../models/RiskAssessment.js";
import WeatherSnapshot from "../models/WeatherSnapshot.js";
import { getSocketIO } from "../sockets/socket.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Sensor from "../models/Sensor.js";

// Kerala districts metadata with coordinates, slope, vegetation, and historical baselines
export const DISTRICT_RISK_METADATA = {
    "Thiruvananthapuram": { lat: 8.5241, lon: 76.9366, slope: 25, vegetation: 65, floodHistory: 4, landslideHistory: 1 },
    "Kollam": { lat: 8.8932, lon: 76.6141, slope: 20, vegetation: 60, floodHistory: 5, landslideHistory: 1 },
    "Pathanamthitta": { lat: 9.2648, lon: 76.7870, slope: 45, vegetation: 75, floodHistory: 6, landslideHistory: 4 },
    "Alappuzha": { lat: 9.4981, lon: 76.3388, slope: 5, vegetation: 45, floodHistory: 10, landslideHistory: 0 },
    "Kottayam": { lat: 9.5916, lon: 76.5222, slope: 25, vegetation: 70, floodHistory: 7, landslideHistory: 3 },
    "Idukki": { lat: 9.8516, lon: 77.0697, slope: 80, vegetation: 85, floodHistory: 3, landslideHistory: 12 },
    "Ernakulam": { lat: 9.9816, lon: 76.2999, slope: 10, vegetation: 40, floodHistory: 9, landslideHistory: 0 },
    "Thrissur": { lat: 10.5276, lon: 76.2144, slope: 15, vegetation: 55, floodHistory: 8, landslideHistory: 2 },
    "Palakkad": { lat: 10.7867, lon: 76.6548, slope: 30, vegetation: 50, floodHistory: 5, landslideHistory: 2 },
    "Malappuram": { lat: 11.0735, lon: 76.0740, slope: 35, vegetation: 65, floodHistory: 6, landslideHistory: 5 },
    "Kozhikode": { lat: 11.2588, lon: 75.7804, slope: 40, vegetation: 60, floodHistory: 7, landslideHistory: 6 },
    "Wayanad": { lat: 11.6854, lon: 76.1320, slope: 75, vegetation: 80, floodHistory: 4, landslideHistory: 10 },
    "Kannur": { lat: 11.8745, lon: 75.3704, slope: 30, vegetation: 65, floodHistory: 5, landslideHistory: 3 },
    "Kasaragod": { lat: 12.5102, lon: 74.9852, slope: 25, vegetation: 60, floodHistory: 4, landslideHistory: 2 }
};

/**
 * Calculates flood risk score (0 to 100)
 */
export const calculateFloodRisk = (rainfall, riverLevel, soilMoisture, floodHistory) => {
    // Normalize rainfall (0-100 mm -> 0-100 score)
    const rainScore = Math.min(100, (rainfall / 60) * 100);

    // Normalize river level (assume warning level threshold is ~4m, danger is ~6m, max is 8m)
    const riverScore = Math.min(100, (riverLevel / 7) * 100);

    // Soil moisture is already 0-100%
    const moistureScore = Math.min(100, soilMoisture);

    // Historical events factor (max 10 events -> 100 score contribution)
    const historyScore = Math.min(100, (floodHistory / 10) * 100);

    // Weights: Rainfall 40%, River Level 30%, Soil Moisture 20%, Flood History 10%
    const score = (rainScore * 0.40) + (riverScore * 0.30) + (moistureScore * 0.20) + (historyScore * 0.10);
    return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Calculates landslide risk score (0 to 100)
 */
export const calculateLandslideRisk = (rainfall, slopeIndex, soilMoisture, vegetationIndex, landslideHistory) => {
    // Normalize rainfall (heavy rainfall strongly triggers landslides, e.g. 50mm+)
    const rainScore = Math.min(100, (rainfall / 50) * 100);

    // Slope Index is 0-100
    const slopeScore = Math.min(100, slopeIndex);

    // Soil moisture is 0-100% (saturated soil triggers landslide)
    const moistureScore = Math.min(100, soilMoisture);

    // Vegetation index: lower vegetation index (Ndvi/density) leads to higher erosion risk
    // NDVI is 0-100. Inverse relationship.
    const vegetationRisk = Math.max(0, 100 - vegetationIndex);

    // Historical events factor (max 12 events -> 100 score contribution)
    const historyScore = Math.min(100, (landslideHistory / 12) * 100);

    // Weights: Rainfall 30%, Slope Index 35%, Soil Moisture 15%, Vegetation 10%, History 10%
    const score = (rainScore * 0.30) + (slopeScore * 0.35) + (moistureScore * 0.15) + (vegetationRisk * 0.10) + (historyScore * 0.10);
    return Math.round(Math.min(100, Math.max(0, score)));
};

/**
 * Combines flood and landslide scores to return overall risk level, type, and recommendations
 */
export const evaluateRiskCombined = (floodScore, landslideScore) => {
    const riskScore = Math.max(floodScore, landslideScore);

    let riskLevel = "Low";
    if (riskScore >= 75) {
        riskLevel = "Extreme";
    } else if (riskScore >= 55) {
        riskLevel = "High";
    } else if (riskScore >= 35) {
        riskLevel = "Moderate";
    }

    let riskType = "Flood";
    if (Math.abs(floodScore - landslideScore) <= 15 && floodScore >= 35 && landslideScore >= 35) {
        riskType = "Both";
    } else if (landslideScore > floodScore) {
        riskType = "Landslide";
    }

    // Compile recommendations
    const recommendations = [];

    if (riskLevel === "Extreme" || riskLevel === "High") {
        recommendations.push("Evacuate active hazard areas and follow emergency instructions immediately.");
        if (riskType === "Flood" || riskType === "Both") {
            recommendations.push("Move to designated high-ground emergency shelters. Do not traverse flooded streets.");
            recommendations.push("Store clean drinking water and elevate electronic equipment/valuable assets.");
        }
        if (riskType === "Landslide" || riskType === "Both") {
            recommendations.push("Evacuate steep slope structures immediately. Stay alert to crack sounds or soil movement.");
            recommendations.push("Avoid traveling through hilly ghat cuts or winding pass ways.");
        }
        recommendations.push("Keep emergency response contacts handy and listen to local hazard alerts on radio/SMS.");
    } else if (riskLevel === "Moderate") {
        recommendations.push("Monitor local weather forecast trends closely.");
        if (riskType === "Flood" || riskType === "Both") {
            recommendations.push("Clear neighborhood sewer/water drainage blocks.");
        }
        if (riskType === "Landslide" || riskType === "Both") {
            recommendations.push("Watch for signs of soil erosion; clear rain gutters run-offs.");
        }
        recommendations.push("Secure basic emergency supplies (medical kits, flashlights, water).");
    } else {
        recommendations.push("Normal operations. No immediate actions required.");
        recommendations.push("Maintain baseline storm preparation habits.");
    }

    return { riskScore, riskLevel, riskType, recommendations };
};

/**
 * Generates warning alerts to admins and system notifications
 */
export const notifyAdminsAboutHighRisk = async (district, riskScore, riskLevel, riskType, prevScore) => {
    try {
        const io = getSocketIO();
        const admins = await User.find({ role: "admin" }).select("_id");

        let title = "";
        let message = "";

        if (riskLevel === "Extreme") {
            title = `🚨 EXTREME ${riskType.toUpperCase()} RISK DETECTED: ${district}`;
            message = `Critical threat! ${district} is registered under Extreme ${riskType} risk with a score of ${riskScore}/100. Emergency services should prepare for evacuations, and rescue resources must be mobilized immediately.`;
        } else if (riskLevel === "High") {
            title = `⚠️ High ${riskType} Risk: ${district}`;
            message = `High warning: ${district} risk assessment is High (${riskScore}/100). Initiate monitoring of shelters, warehouses, and rescue teams in nearby vicinity.`;
        } else if (prevScore !== undefined && riskScore - prevScore >= 20) {
            title = `📈 Rapid Risk Escalation: ${district}`;
            message = `Rapid risk score escalation detected in ${district}. Score jumped from ${prevScore} to ${riskScore} (+${riskScore - prevScore}).`;
        } else {
            return; // No notification trigger needed
        }

        // Find local rescue teams, volunteer responders & drivers in the vicinity (Step 12)
        const localResponders = await User.find({
            district: { $regex: new RegExp("^" + district + "$", "i") },
            role: { $in: ["volunteer", "driver"] }
        }).select("_id");

        // Merge admin and local lists dynamically
        const uniqueUserIds = new Set([
            ...admins.map(a => a._id.toString()),
            ...localResponders.map(lr => lr._id.toString())
        ]);

        // Save Notifications in DB
        for (const userId of uniqueUserIds) {
            const notification = await Notification.create({
                user: userId,
                title,
                message,
                type: "system",
            });

            try {
                io.to(userId).emit("notificationCreated", notification);
            } catch (e) {
                console.warn("Socket notification send failed:", e.message);
            }
        }

        // Broadcast High Risk to everyone
        io.emit("highRiskDetected", {
            district,
            riskScore,
            riskLevel,
            riskType,
            message,
            timestamp: new Date()
        });

    } catch (err) {
        console.error("Failed to notification admins about risk levels:", err);
    }
};

/**
 * Periodically recalculates risk for all districts based on weather data and inserts new RiskAssessment snapshots
 */
export const updateAllDistrictsRisk = async () => {
    try {
        const io = getSocketIO();
        const now = new Date();
        const assessments = [];

        console.log("⚙️ recalculating risk indexes for Kerala districts...");

        for (const name of Object.keys(DISTRICT_RISK_METADATA)) {
            const meta = DISTRICT_RISK_METADATA[name];

            // Get the latest weather snapshot
            const weatherSnap = await WeatherSnapshot.findOne({ district: name }).sort({ fetchedAt: -1 });
            let rainfall = weatherSnap ? weatherSnap.rainfall : 0;

            // Step 13: IoT Flood Intelligence Integration
            // Look up active sensors in this district
            const activeSensors = await Sensor.find({ district: name, status: "Active" });

            // Check if we have active rainfall sensors
            const rainSensors = activeSensors.filter(
                (s) =>
                    (s.sensorType === "RainfallSensor" || s.sensorType === "WeatherStation") &&
                    s.lastReading?.rainfall !== null &&
                    s.lastReading?.rainfall !== undefined
            );
            if (rainSensors.length > 0) {
                // Combine weather snapshots with live sensor rainfall
                const sensorMaxRain = Math.max(...rainSensors.map((s) => s.lastReading.rainfall));
                rainfall = Math.max(rainfall, sensorMaxRain);
            }

            // Derive dynamic soil moisture: increases with rainfall, drops slowly.
            // We simulate this by applying a baseline + rain correlation + diurnal fluctuation
            const baseMoisture = meta.slope > 50 ? 55 : 45; // Hilly retains some base moisture, flat retains other
            const soilMoisture = Math.min(100, Math.round(baseMoisture + (rainfall * 1.5) + (Math.sin(now.getTime() / (3600 * 1000 * 2)) * 5)));

            // Check if we have active river level / water level gauges
            let riverLevel = 0;
            const waterSensors = activeSensors.filter(
                (s) =>
                    (s.sensorType === "RiverGauge" || s.sensorType === "WaterLevelGauge") &&
                    s.lastReading?.waterLevel !== null &&
                    s.lastReading?.waterLevel !== undefined
            );

            if (waterSensors.length > 0) {
                // Use maximum active sensor water level to reflect highest risk
                riverLevel = Math.max(...waterSensors.map((s) => s.lastReading.waterLevel));
            } else {
                // Derive river level simulation fallback
                const rainFlowRatio = meta.slope <= 15 ? 0.08 : 0.04;
                const baseRiver = meta.slope <= 15 ? 2.5 : 1.2;
                riverLevel = parseFloat(Math.min(8.0, baseRiver + (rainfall * rainFlowRatio) + (Math.cos(now.getTime() / (3600 * 1000 * 4)) * 0.2)).toFixed(2));
            }

            // Calculate
            const floodScore = calculateFloodRisk(rainfall, riverLevel, soilMoisture, meta.floodHistory);
            const landslideScore = calculateLandslideRisk(rainfall, meta.slope, soilMoisture, meta.vegetation, meta.landslideHistory);

            // Extract combined
            const { riskScore, riskLevel, riskType, recommendations } = evaluateRiskCombined(floodScore, landslideScore);

            // Fetch the previous risk assessment to check for rapid increase or alerts change
            const previousAssessment = await RiskAssessment.findOne({ district: name }).sort({ createdAt: -1 });
            const prevScore = previousAssessment ? previousAssessment.riskScore : 0;

            // Save new assessment
            const newAssessment = await RiskAssessment.create({
                district: name,
                latitude: meta.lat,
                longitude: meta.lon,
                riskType,
                rainfall,
                riverLevel,
                soilMoisture,
                slopeIndex: meta.slope,
                vegetationIndex: meta.vegetation,
                historicalEvents: meta.floodHistory + meta.landslideHistory,
                riskScore,
                riskLevel,
                recommendations,
            });

            assessments.push(newAssessment);

            // Trigger Socket events if risk values changed
            if (!previousAssessment || previousAssessment.riskScore !== riskScore || previousAssessment.riskLevel !== riskLevel) {
                io.emit("riskUpdated", newAssessment);

                if (previousAssessment && previousAssessment.riskType !== riskType) {
                    if (riskType === "Flood" || riskType === "Both") {
                        io.emit("floodRiskChanged", { district: name, score: floodScore, level: riskLevel });
                    }
                    if (riskType === "Landslide" || riskType === "Both") {
                        io.emit("landslideRiskChanged", { district: name, score: landslideScore, level: riskLevel });
                    }
                }
            }

            // Check of risk levels require alerting/notifications
            await notifyAdminsAboutHighRisk(name, riskScore, riskLevel, riskType, prevScore);
        }

        console.log(`Risk calculations updated. Snapshots created: ${assessments.length}`);
        return assessments;
    } catch (error) {
        console.error("Error in updateAllDistrictsRisk:", error);
        throw error;
    }
};

/**
 * Returns district risk summaries
 */
export const getDistrictRiskSummary = async () => {
    const currentRisk = await Promise.all(
        Object.keys(DISTRICT_RISK_METADATA).map(async (name) => {
            return RiskAssessment.findOne({ district: name }).sort({ createdAt: -1 });
        })
    );

    const assessments = currentRisk.filter(Boolean);

    const countHighRisk = assessments.filter(a => a.riskLevel === "High" || a.riskLevel === "Extreme").length;
    const avgRiskScore = assessments.length > 0 ? (assessments.reduce((acc, a) => acc + a.riskScore, 0) / assessments.length) : 0;

    return {
        assessments,
        summary: {
            totalDistricts: Object.keys(DISTRICT_RISK_METADATA).length,
            highRiskCount: countHighRisk,
            avgRiskScore: parseFloat(avgRiskScore.toFixed(1)),
            extremeRiskDistricts: assessments.filter(a => a.riskLevel === "Extreme").map(a => a.district),
            highRiskDistricts: assessments.filter(a => a.riskLevel === "High").map(a => a.district),
        }
    };
};
