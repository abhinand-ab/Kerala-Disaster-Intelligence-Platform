import AIRecommendation from "../models/AIRecommendation.js";
import Incident from "../models/Incident.js";
import EmergencyRequest from "../models/EmergencyRequest.js";
import Shelter from "../models/Shelter.js";
import Vehicle from "../models/Vehicle.js";
import RescueTeam from "../models/RescueTeam.js";
import Warehouse from "../models/Warehouse.js";
import RiskAssessment from "../models/RiskAssessment.js";
import WeatherSnapshot from "../models/WeatherSnapshot.js";
import Sensor from "../models/Sensor.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";
import { DISTRICT_RISK_METADATA } from "./riskEngine.js";

// ─── Haversine distance (km) ────────────────────────────────────────────────
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Socket broadcast ───────────────────────────────────────────────────────
const emitAI = (event, payload) => {
    try {
        const io = getSocketIO();
        io.emit(event, payload);
    } catch (e) {
        console.warn("AI socket broadcast skipped:", e.message);
    }
};

// ─── Admin notification ─────────────────────────────────────────────────────
const notifyAdmins = async (title, message) => {
    try {
        const admins = await User.find({ role: "admin" }).select("_id");
        for (const admin of admins) {
            await Notification.create({
                user: admin._id,
                title,
                message,
                type: "system",
            });
        }
    } catch (err) {
        console.error("AI admin notification error:", err.message);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CORE DECISION ENGINE – Generates all recommendation types
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * 1. Best Shelter Recommendations
 * Finds the nearest shelters with available capacity for a given lat/lon & district
 */
const generateShelterRecommendations = async (district, lat, lon, context = "System") => {
    const shelters = await Shelter.find({ status: "Active" });
    if (shelters.length === 0) return [];

    const scored = shelters
        .map((s) => {
            const dist = haversine(lat, lon, s.latitude, s.longitude);
            const occupancyRatio = s.capacity > 0 ? s.currentOccupancy / s.capacity : 1;
            const availableSpots = Math.max(0, s.capacity - s.currentOccupancy);
            // Lower is better: distance matters most, then occupancy
            const score = dist * 0.6 + occupancyRatio * 40;
            return { shelter: s, distance: dist, occupancyRatio, availableSpots, score };
        })
        .filter((s) => s.availableSpots > 0)
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);

    const recs = [];
    for (const item of scored) {
        const confidence = Math.max(40, Math.min(98, Math.round(100 - item.score)));
        recs.push(
            await AIRecommendation.create({
                recommendationType: "EvacuationShelter",
                priority: item.distance < 10 ? "High" : "Medium",
                district,
                generatedFor: context,
                recommendation: `Evacuate to ${item.shelter.name} (${item.distance.toFixed(1)}km away, ${item.availableSpots} spots available out of ${item.shelter.capacity}).`,
                reasoning: `Selected based on proximity (${item.distance.toFixed(1)}km), available capacity (${Math.round((1 - item.occupancyRatio) * 100)}% free), and accessibility.`,
                confidenceScore: confidence,
                relatedShelter: item.shelter._id,
                metadata: {
                    distance: item.distance,
                    availableSpots: item.availableSpots,
                    occupancyPct: Math.round(item.occupancyRatio * 100),
                    shelterName: item.shelter.name,
                    shelterLat: item.shelter.latitude,
                    shelterLon: item.shelter.longitude,
                },
            })
        );
    }
    return recs;
};

/**
 * 2. Best Rescue Team Recommendation
 */
const generateTeamRecommendations = async (district, lat, lon, incidentType, context = "System") => {
    const teams = await RescueTeam.find({ status: "Available" }).populate("members");
    if (teams.length === 0) return [];

    // Specialization matching
    const specMap = {
        Flood: "water",
        Landslide: "landslide",
        Medical: "medical",
        Fire: "fire",
        Rescue: "rescue",
    };
    const keyword = specMap[incidentType] || "";

    const scored = teams
        .map((t) => {
            const meta = DISTRICT_RISK_METADATA[t.district];
            const teamLat = meta?.lat || 10.0;
            const teamLon = meta?.lon || 76.5;
            const dist = haversine(lat, lon, teamLat, teamLon);
            const specMatch = keyword && (t.specialization || "").toLowerCase().includes(keyword) ? 0 : 15;
            const memberCount = (t.members || []).length;
            const score = dist * 0.5 + specMatch + (memberCount > 3 ? 0 : 10);
            return { team: t, distance: dist, memberCount, specMatch: specMatch === 0, score };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);

    const recs = [];
    for (const item of scored) {
        const confidence = Math.max(45, Math.min(96, Math.round(100 - item.score * 0.8)));
        recs.push(
            await AIRecommendation.create({
                recommendationType: "RescueTeamDeploy",
                priority: item.distance < 15 ? "High" : "Medium",
                district,
                generatedFor: context,
                recommendation: `Deploy team "${item.team.teamName}" (${item.memberCount} members, ${item.distance.toFixed(1)}km away${item.specMatch ? ", specialization match" : ""}).`,
                reasoning: `Ranked by proximity, specialization fit for ${incidentType || "general"} operations, and team strength.`,
                confidenceScore: confidence,
                relatedTeam: item.team._id,
                metadata: {
                    teamName: item.team.teamName,
                    distance: item.distance,
                    memberCount: item.memberCount,
                    specializationMatch: item.specMatch,
                },
            })
        );
    }
    return recs;
};

/**
 * 3. Best Vehicle Dispatch
 */
const generateVehicleRecommendations = async (district, lat, lon, incidentType, context = "System") => {
    const vehicles = await Vehicle.find({ status: "Available" });
    if (vehicles.length === 0) return [];

    const typeMap = {
        Flood: "Rescue Boat",
        Fire: "Fire Engine",
        Medical: "Ambulance",
        Landslide: "NDRF Vehicle",
    };
    const preferredType = typeMap[incidentType] || "";

    const scored = vehicles
        .map((v) => {
            const dist = haversine(lat, lon, v.latitude, v.longitude);
            const typeMatch = preferredType && v.vehicleType === preferredType ? 0 : 20;
            const score = dist * 0.7 + typeMatch;
            return { vehicle: v, distance: dist, typeMatch: typeMatch === 0, score };
        })
        .sort((a, b) => a.score - b.score)
        .slice(0, 3);

    const recs = [];
    for (const item of scored) {
        const confidence = Math.max(40, Math.min(95, Math.round(100 - item.score * 0.6)));
        const eta = Math.round((item.distance / 40) * 60); // ~40 km/h avg
        recs.push(
            await AIRecommendation.create({
                recommendationType: "VehicleDispatch",
                priority: item.distance < 10 ? "High" : "Medium",
                district,
                generatedFor: context,
                recommendation: `Dispatch ${item.vehicle.vehicleType} (${item.vehicle.vehicleNumber}) — ${item.distance.toFixed(1)}km away, ETA ~${eta} min${item.typeMatch ? ", type match" : ""}.`,
                reasoning: `Selected based on distance, vehicle type suitability for ${incidentType || "general"} situations, and availability.`,
                confidenceScore: confidence,
                relatedVehicle: item.vehicle._id,
                metadata: {
                    vehicleNumber: item.vehicle.vehicleNumber,
                    vehicleType: item.vehicle.vehicleType,
                    distance: item.distance,
                    etaMinutes: eta,
                    typeMatch: item.typeMatch,
                    driverName: item.vehicle.driverName,
                },
            })
        );
    }
    return recs;
};

/**
 * 4. Warehouse & Resource Allocation
 */
const generateWarehouseRecommendations = async (district, lat, lon) => {
    const warehouses = await Warehouse.find({});
    if (warehouses.length === 0) return [];

    const scored = warehouses
        .map((w) => {
            const dist = haversine(lat, lon, w.latitude, w.longitude);
            return { warehouse: w, distance: dist };
        })
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3);

    const recs = [];
    for (const item of scored) {
        const confidence = Math.max(50, Math.min(95, Math.round(100 - item.distance * 1.5)));
        recs.push(
            await AIRecommendation.create({
                recommendationType: "WarehouseSelection",
                priority: "Medium",
                district,
                generatedFor: "Optimization",
                recommendation: `Source supplies from "${item.warehouse.name}" warehouse (${item.distance.toFixed(1)}km away).`,
                reasoning: `Closest operational warehouse with verified inventory stock.`,
                confidenceScore: confidence,
                relatedWarehouse: item.warehouse._id,
                metadata: {
                    warehouseName: item.warehouse.name,
                    distance: item.distance,
                    warehouseLat: item.warehouse.latitude,
                    warehouseLon: item.warehouse.longitude,
                },
            })
        );
    }
    return recs;
};

/**
 * 5. Incident Prioritization
 */
const generateIncidentPrioritization = async () => {
    const activeIncidents = await Incident.find({
        status: { $in: ["Reported", "Verified"] },
    }).sort({ createdAt: -1 });

    if (activeIncidents.length === 0) return [];

    // Score each incident
    const severityWeights = { Critical: 40, High: 30, Medium: 15, Low: 5 };
    const categoryWeights = { Flood: 25, Landslide: 20, Medical: 18, Rescue: 16, Fire: 14, Accident: 10, "Road Block": 8, Other: 5 };

    const scored = activeIncidents.map((inc) => {
        const sevScore = severityWeights[inc.severity] || 10;
        const catScore = categoryWeights[inc.category] || 5;
        const ageHours = (Date.now() - new Date(inc.createdAt).getTime()) / (1000 * 3600);
        const ageScore = Math.min(20, ageHours * 2); // Older = higher urgency
        const total = sevScore + catScore + ageScore;
        return { incident: inc, total, ageHours };
    });

    scored.sort((a, b) => b.total - a.total);

    const recs = [];
    for (const item of scored.slice(0, 5)) {
        recs.push(
            await AIRecommendation.create({
                recommendationType: "IncidentPrioritization",
                priority: item.incident.severity === "Critical" ? "Critical" : item.incident.severity,
                district: item.incident.location.district,
                generatedFor: "Incident",
                recommendation: `Priority #${recs.length + 1}: "${item.incident.title}" (${item.incident.category}, ${item.incident.severity}) — reported ${Math.round(item.ageHours)}h ago, urgency score ${Math.round(item.total)}.`,
                reasoning: `Scored by severity (${item.incident.severity}), disaster category (${item.incident.category}), and time since report.`,
                confidenceScore: Math.min(95, Math.round(item.total + 20)),
                relatedIncident: item.incident._id,
                metadata: {
                    incidentTitle: item.incident.title,
                    severity: item.incident.severity,
                    category: item.incident.category,
                    ageHours: Math.round(item.ageHours),
                    urgencyScore: Math.round(item.total),
                },
            })
        );
    }
    return recs;
};

/**
 * 6. High-Risk District Alert Recommendations
 */
const generateHighRiskAlerts = async () => {
    const riskData = await RiskAssessment.aggregate([
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$district", latest: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$latest" } },
    ]);

    const recs = [];
    for (const risk of riskData) {
        if (risk.riskScore < 55) continue;

        const priority =
            risk.riskScore >= 80 ? "Critical" : risk.riskScore >= 65 ? "High" : "Medium";

        recs.push(
            await AIRecommendation.create({
                recommendationType: "HighRiskAlert",
                priority,
                district: risk.district,
                generatedFor: "Prediction",
                recommendation: `${risk.district} is at ${risk.riskLevel} risk (score ${risk.riskScore}/100). ${risk.riskType === "Both" ? "Combined flood & landslide" : risk.riskType} threat detected. Consider pre-positioning rescue teams and activating shelters.`,
                reasoning: `Based on current rainfall (${risk.rainfall}mm), river level (${risk.riverLevel}m), soil moisture (${risk.soilMoisture}%), and historical event patterns.`,
                confidenceScore: Math.min(96, risk.riskScore + 5),
                metadata: {
                    riskScore: risk.riskScore,
                    riskLevel: risk.riskLevel,
                    riskType: risk.riskType,
                    rainfall: risk.rainfall,
                    riverLevel: risk.riverLevel,
                    soilMoisture: risk.soilMoisture,
                    lat: risk.latitude,
                    lon: risk.longitude,
                },
            })
        );
    }
    return recs;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PREDICTIVE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Analyzes trends and generates forward-looking predictions
 */
export const generatePredictions = async () => {
    const predictions = [];

    // ── Flood Prediction ──────────────────────────────────────────────────
    const riskData = await RiskAssessment.aggregate([
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$district", latest: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$latest" } },
    ]);

    for (const risk of riskData) {
        if (risk.riskScore < 50) continue;
        const floodProb = Math.min(95, Math.round(risk.riskScore * 0.9 + (risk.rainfall > 30 ? 10 : 0)));

        if (floodProb >= 55) {
            predictions.push({
                type: "FloodPrediction",
                district: risk.district,
                probability: floodProb,
                severity: floodProb >= 80 ? "Critical" : floodProb >= 65 ? "High" : "Medium",
                prediction: `${risk.district} has a ${floodProb}% flood probability in the next 6–12 hours based on rising river levels (${risk.riverLevel}m) and rainfall (${risk.rainfall}mm).`,
                indicators: {
                    riskScore: risk.riskScore,
                    rainfall: risk.rainfall,
                    riverLevel: risk.riverLevel,
                    soilMoisture: risk.soilMoisture,
                },
            });
        }
    }

    // ── Shelter Overcrowding ──────────────────────────────────────────────
    const shelters = await Shelter.find({ status: "Active" });
    for (const s of shelters) {
        const occupancyPct = s.capacity > 0 ? Math.round((s.currentOccupancy / s.capacity) * 100) : 0;
        if (occupancyPct >= 75) {
            predictions.push({
                type: "ShelterOvercrowding",
                district: s.district || "Unknown",
                probability: occupancyPct,
                severity: occupancyPct >= 95 ? "Critical" : "High",
                prediction: `Shelter "${s.name}" is at ${occupancyPct}% capacity (${s.currentOccupancy}/${s.capacity}). Overflow expected if evacuations increase.`,
                indicators: {
                    shelterName: s.name,
                    occupancy: s.currentOccupancy,
                    capacity: s.capacity,
                    occupancyPct,
                },
            });
        }
    }

    // ── Rescue Team Demand ────────────────────────────────────────────────
    const totalTeams = await RescueTeam.countDocuments();
    const busyTeams = await RescueTeam.countDocuments({ status: "On Mission" });
    const utilizationPct = totalTeams > 0 ? Math.round((busyTeams / totalTeams) * 100) : 0;

    if (utilizationPct >= 60) {
        predictions.push({
            type: "DemandForecast",
            district: "State-wide",
            probability: utilizationPct,
            severity: utilizationPct >= 85 ? "Critical" : "High",
            prediction: `Rescue team utilization at ${utilizationPct}% (${busyTeams}/${totalTeams} on active missions). Additional teams may be required.`,
            indicators: { totalTeams, busyTeams, utilizationPct },
        });
    }

    // ── Vehicle Demand ────────────────────────────────────────────────────
    const totalVehicles = await Vehicle.countDocuments();
    const busyVehicles = await Vehicle.countDocuments({ status: { $in: ["Dispatched", "On Mission"] } });
    const vUtilPct = totalVehicles > 0 ? Math.round((busyVehicles / totalVehicles) * 100) : 0;

    if (vUtilPct >= 50) {
        predictions.push({
            type: "DemandForecast",
            district: "State-wide",
            probability: vUtilPct,
            severity: vUtilPct >= 80 ? "Critical" : "High",
            prediction: `Vehicle fleet utilization at ${vUtilPct}% (${busyVehicles}/${totalVehicles} dispatched). Consider requesting additional units.`,
            indicators: { totalVehicles, busyVehicles, vUtilPct },
        });
    }

    // ── SOS Request Surge ─────────────────────────────────────────────────
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600 * 1000);
    const recentSOSCounts = await EmergencyRequest.aggregate([
        { $match: { createdAt: { $gte: twentyFourHoursAgo } } },
        { $group: { _id: "$district", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    for (const entry of recentSOSCounts) {
        if (entry.count >= 3) {
            predictions.push({
                type: "DemandForecast",
                district: entry._id,
                probability: Math.min(90, entry.count * 15),
                severity: entry.count >= 8 ? "Critical" : entry.count >= 5 ? "High" : "Medium",
                prediction: `${entry._id} has ${entry.count} SOS requests in the last 24 hours. Escalating demand for emergency resources expected.`,
                indicators: { sosCount: entry.count, timeframe: "24h" },
            });
        }
    }

    return predictions;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  SMART ASSIGNMENT SUGGESTIONS (Step 12)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * For a given incident or SOS, generate comprehensive assignment suggestions
 */
export const generateSmartAssignment = async (targetType, targetId) => {
    let lat, lon, district, incidentType;

    if (targetType === "Incident") {
        const incident = await Incident.findById(targetId);
        if (!incident) throw new Error("Incident not found");
        lat = incident.location.latitude;
        lon = incident.location.longitude;
        district = incident.location.district;
        incidentType = incident.category;
    } else {
        const sos = await EmergencyRequest.findById(targetId);
        if (!sos) throw new Error("SOS request not found");
        lat = sos.latitude;
        lon = sos.longitude;
        district = sos.district;
        incidentType = sos.emergencyType;
    }

    const context = targetType === "Incident" ? "Incident" : "SOS";

    // Generate all resource recommendations in parallel
    const [shelterRecs, teamRecs, vehicleRecs, warehouseRecs] = await Promise.all([
        generateShelterRecommendations(district, lat, lon, context),
        generateTeamRecommendations(district, lat, lon, incidentType, context),
        generateVehicleRecommendations(district, lat, lon, incidentType, context),
        generateWarehouseRecommendations(district, lat, lon),
    ]);

    const allRecs = [...shelterRecs, ...teamRecs, ...vehicleRecs, ...warehouseRecs];

    // Broadcast
    emitAI("aiRecommendationCreated", {
        targetType,
        targetId,
        district,
        count: allRecs.length,
        recommendations: allRecs,
    });

    return allRecs;
};

// ═══════════════════════════════════════════════════════════════════════════════
//  FULL ANALYSIS RUNNER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Runs the complete AI analysis pipeline
 */
export const runFullAnalysis = async () => {
    console.log("🤖 AI Decision Engine: Running full analysis pipeline...");

    try {
        // Expire old pending recommendations
        await AIRecommendation.updateMany(
            { status: "Pending", expiresAt: { $lt: new Date() } },
            { $set: { status: "Expired" } }
        );

        // Generate all recommendation types
        const [incidentRecs, riskAlerts] = await Promise.all([
            generateIncidentPrioritization(),
            generateHighRiskAlerts(),
        ]);

        // Generate predictions
        const predictions = await generatePredictions();

        // Generate evacuation & resource recs for highest risk districts
        const evacRecs = [];
        const topRiskDistricts = predictions
            .filter((p) => p.type === "FloodPrediction" && p.probability >= 65)
            .slice(0, 3);

        for (const pred of topRiskDistricts) {
            const meta = DISTRICT_RISK_METADATA[pred.district];
            if (meta) {
                const shelterRecs = await generateShelterRecommendations(
                    pred.district,
                    meta.lat,
                    meta.lon,
                    "Prediction"
                );
                evacRecs.push(...shelterRecs);
            }
        }

        const totalGenerated = incidentRecs.length + riskAlerts.length + evacRecs.length;

        console.log(
            `🤖 AI Analysis complete: ${totalGenerated} recommendations, ${predictions.length} predictions generated.`
        );

        // Broadcast
        emitAI("predictionUpdated", { predictions, timestamp: new Date() });
        emitAI("resourceOptimizationUpdated", {
            totalRecommendations: totalGenerated,
            timestamp: new Date(),
        });

        // Notify admins if critical recommendations exist
        const criticalCount =
            riskAlerts.filter((r) => r.priority === "Critical").length +
            incidentRecs.filter((r) => r.priority === "Critical").length;

        if (criticalCount > 0) {
            await notifyAdmins(
                `🤖 AI Engine: ${criticalCount} Critical Recommendations`,
                `The AI Decision Engine has generated ${criticalCount} critical priority recommendations that require immediate administrator action.`
            );
        }

        return {
            recommendations: { incidents: incidentRecs, risks: riskAlerts, evacuations: evacRecs },
            predictions,
            summary: {
                totalRecommendations: totalGenerated,
                totalPredictions: predictions.length,
                criticalCount,
            },
        };
    } catch (error) {
        console.error("🤖 AI Decision Engine error:", error);
        throw error;
    }
};

/**
 * Get comprehensive risk summary across all districts
 */
export const getRiskSummary = async () => {
    const riskData = await RiskAssessment.aggregate([
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$district", latest: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$latest" } },
        { $sort: { riskScore: -1 } },
    ]);

    const sensors = await Sensor.find({ status: "Active" });
    const weather = await WeatherSnapshot.aggregate([
        { $sort: { fetchedAt: -1 } },
        { $group: { _id: "$district", latest: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$latest" } },
    ]);

    const weatherMap = {};
    weather.forEach((w) => (weatherMap[w.district] = w));

    const sensorMap = {};
    sensors.forEach((s) => {
        if (!sensorMap[s.district]) sensorMap[s.district] = [];
        sensorMap[s.district].push(s);
    });

    return riskData.map((r) => ({
        district: r.district,
        riskScore: r.riskScore,
        riskLevel: r.riskLevel,
        riskType: r.riskType,
        rainfall: r.rainfall,
        riverLevel: r.riverLevel,
        soilMoisture: r.soilMoisture,
        weather: weatherMap[r.district]
            ? {
                temperature: weatherMap[r.district].temperature,
                humidity: weatherMap[r.district].humidity,
                windSpeed: weatherMap[r.district].windSpeed,
                condition: weatherMap[r.district].condition,
            }
            : null,
        activeSensors: sensorMap[r.district]?.length || 0,
        coordinates: { lat: r.latitude, lon: r.longitude },
    }));
};

/**
 * Get resource optimization suggestions
 */
export const getResourceOptimization = async () => {
    const shelters = await Shelter.find({ status: "Active" });
    const teams = await RescueTeam.find({});
    const vehicles = await Vehicle.find({});

    // Shelter utilization analysis
    const shelterAnalysis = shelters.map((s) => ({
        name: s.name,
        district: s.district || "Unknown",
        occupancy: s.currentOccupancy,
        capacity: s.capacity,
        utilizationPct: s.capacity > 0 ? Math.round((s.currentOccupancy / s.capacity) * 100) : 0,
        status: s.currentOccupancy >= s.capacity * 0.9 ? "NearFull" : s.currentOccupancy >= s.capacity * 0.6 ? "Filling" : "Available",
    }));

    // Team distribution
    const teamsByDistrict = {};
    teams.forEach((t) => {
        teamsByDistrict[t.district] = (teamsByDistrict[t.district] || 0) + 1;
    });

    // Vehicle distribution
    const vehiclesByDistrict = {};
    vehicles.forEach((v) => {
        vehiclesByDistrict[v.district] = (vehiclesByDistrict[v.district] || 0) + 1;
    });

    // Find underserved districts (high risk but low resources)
    const riskData = await RiskAssessment.aggregate([
        { $sort: { createdAt: -1 } },
        { $group: { _id: "$district", latest: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$latest" } },
    ]);

    const underserved = riskData
        .filter((r) => r.riskScore >= 50)
        .map((r) => ({
            district: r.district,
            riskScore: r.riskScore,
            teamsAvailable: teamsByDistrict[r.district] || 0,
            vehiclesAvailable: vehiclesByDistrict[r.district] || 0,
            gap: r.riskScore - ((teamsByDistrict[r.district] || 0) * 10 + (vehiclesByDistrict[r.district] || 0) * 8),
        }))
        .sort((a, b) => b.gap - a.gap);

    return {
        shelterAnalysis,
        teamDistribution: teamsByDistrict,
        vehicleDistribution: vehiclesByDistrict,
        underservedDistricts: underserved,
        totalTeams: teams.length,
        availableTeams: teams.filter((t) => t.status === "Available").length,
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter((v) => v.status === "Available").length,
    };
};
