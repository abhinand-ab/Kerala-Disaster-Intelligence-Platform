import WeatherSnapshot from "../models/WeatherSnapshot.js";
import Incident from "../models/Incident.js";
import Shelter from "../models/Shelter.js";
import RiskAssessment from "../models/RiskAssessment.js";
import { KERALA_DISTRICTS } from "./weatherService.js";

// Hardcoded Emergency Contacts
export const EMERGENCY_CONTACTS = [
    { name: "Police Department Helpline", number: "112", icon: "Phone", description: "Statewide Helpline for any immediate threat or emergency." },
    { name: "Fire & Rescue Services", number: "101", icon: "Flame", description: "First responders for fire, rescue, and evacuation emergencies." },
    { name: "Ambulance / Health Helpline", number: "108", icon: "Heart", description: "Free emergency ambulance coordination and state health aid." },
    { name: "State Disaster Management (SEOC)", number: "1070", icon: "AlertTriangle", description: "State Emergency Operations Center toll-free helpline." },
    { name: "District Disaster Control Rooms", number: "1077", icon: "MapPin", description: "Toll-free district level emergency operations (no prefix needed from landline)." },
    { name: "Women Helpline (Mitra)", number: "1091", icon: "User", description: "Emergency helpline contact for women in distress." },
    { name: "Child Helpline", number: "1098", icon: "Smile", description: "National helpline for child rescue, care, and emergency aid." }
];

export const DISTRICT_EMERGENCY_CONTACTS = [
    { district: "Thiruvananthapuram", controlRoom: "0471-2730045" },
    { district: "Kollam", controlRoom: "0474-2794002" },
    { district: "Pathanamthitta", controlRoom: "0468-2322515" },
    { district: "Alappuzha", controlRoom: "0477-2238630" },
    { district: "Kottayam", controlRoom: "0481-2562144" },
    { district: "Idukki", controlRoom: "0486-2233111" },
    { district: "Ernakulam", controlRoom: "0484-2423513" },
    { district: "Thrissur", controlRoom: "0487-2362424" },
    { district: "Palakkad", controlRoom: "0491-2505309" },
    { district: "Malappuram", controlRoom: "0483-2736320" },
    { district: "Kozhikode", controlRoom: "0495-2371002" },
    { district: "Wayanad", controlRoom: "0493-6202071" },
    { district: "Kannur", controlRoom: "0497-2700645" },
    { district: "Kasaragod", controlRoom: "0499-4255010" }
];

export const FAQS = [
    {
        id: 1,
        question: "What should I do immediately during a flood warning?",
        answer: "Immediately disconnect power and water supplies. Move essential belongings, food, and animals to higher floors. Do not walk or drive through flowing floodwaters. If recommended by the control room, pack emergency documents, medicine, and clean water and evacuate immediately."
    },
    {
        id: 2,
        question: "How do I find local shelters with empty beds?",
        answer: "Navigate to the Shelter Finder page in our portal, filter by your district, and you will see all active shelters, their current occupancy, maximum capacity, and the number of available beds, mapped out dynamically."
    },
    {
        id: 3,
        question: "What items should be in my family emergency kit?",
        answer: "A basic kit should include: Dry, non-perishable foodstuffs (energy bars, biscuits), at least 3 liters of water per person per day, a flashlight with extra batteries, a basic first aid kit with prescribed medications, copies of critical ID papers sealed in plastic wraps, a battery-powered radio, and liquid cash resource."
    },
    {
        id: 4,
        question: "How do landslide alerts work and what steps must I take?",
        answer: "Landslide alerts are triggered by rain threshold limits combined with district risk assessment slope data. If you are residing on a steep hillside during extreme weather and observe bulging ground, newly tilted trees, or unusual soil cracks, relocate immediately to safe plain regions or shelters."
    },
    {
        id: 5,
        question: "Can I report blocked roads or high water logging in my region?",
        answer: "Yes, citizens can report active hazards through the Citizen SOS page or call their district control room at 1077. Reports containing exact geo-coordinates allow our response teams to take rapid action."
    },
    {
        id: 6,
        question: "How can I volunteer to support relief operations?",
        answer: "You can sign up as a volunteer by logging in to the system. Volunteers are assigned to resource distribution, shelter management support, or rescue operations based on location and background skills."
    }
];

/**
 * Fetch all public-safe incidents (verified, not rejected/resolved unless resolved is requested)
 */
export const getPublicIncidentsList = async (filters = {}) => {
    const query = {
        verificationStatus: true,
        status: { $in: ["Reported", "Verified", "Assigned"] }
    };

    if (filters.district) {
        query["location.district"] = { $regex: new RegExp(`^${filters.district}$`, "i") };
    }
    if (filters.category) {
        query.category = filters.category;
    }

    return Incident.find(query)
        .select("title description category severity location status images createdAt")
        .sort({ createdAt: -1 });
};

/**
 * Fetch all active public shelters (exclude closed)
 */
export const getPublicSheltersList = async (filters = {}) => {
    const query = {
        status: { $in: ["Open", "Full"] }
    };

    if (filters.district) {
        query.district = { $regex: new RegExp(`^${filters.district}$`, "i") };
    }

    return Shelter.find(query)
        .select("name district address latitude longitude capacity occupancy availableBeds status foodAvailable waterAvailable medicalSupport contactPerson phone")
        .sort({ district: 1, name: 1 });
};

/**
 * Fetch latest weather info and active alerts per district
 */
export const getPublicWeatherData = async (districtName = null) => {
    if (districtName) {
        return WeatherSnapshot.findOne({ district: { $regex: new RegExp(`^${districtName}$`, "i") } })
            .sort({ fetchedAt: -1 });
    }

    const weatherList = await Promise.all(
        KERALA_DISTRICTS.map(async (dist) => {
            return WeatherSnapshot.findOne({ district: dist.name })
                .sort({ fetchedAt: -1 });
        })
    );

    return weatherList.filter(Boolean);
};

/**
 * Fetch latest risk assessments per district
 */
export const getPublicRiskAssessments = async (districtName = null) => {
    if (districtName) {
        return RiskAssessment.findOne({ district: { $regex: new RegExp(`^${districtName}$`, "i") } })
            .sort({ createdAt: -1 });
    }

    const riskLevels = await Promise.all(
        KERALA_DISTRICTS.map(async (dist) => {
            return RiskAssessment.findOne({ district: dist.name })
                .sort({ createdAt: -1 });
        })
    );

    return riskLevels.filter(Boolean);
};

/**
 * Aggregate public alerts from weather alerts, evacuation notices, and critical incidents
 */
export const getPublicActiveAlerts = async () => {
    const alertsList = [];
    const now = new Date();

    // 1. Fetch Weather Alerts
    const weatherData = await getPublicWeatherData();
    weatherData.forEach(snapshot => {
        if (snapshot.alerts && snapshot.alerts.length > 0) {
            snapshot.alerts.forEach(alert => {
                alertsList.push({
                    id: alert._id || `weather_${snapshot.district}_${alert.type}`,
                    source: "weather",
                    type: alert.type || "Weather Warning",
                    severity: alert.severity || "Moderate",
                    message: alert.message,
                    district: snapshot.district,
                    latitude: snapshot.latitude,
                    longitude: snapshot.longitude,
                    timestamp: alert.issuedAt || snapshot.fetchedAt
                });
            });
        }
    });

    // 2. Fetch Critical incidents (Verified & High/Critical Severity)
    const criticalIncidents = await Incident.find({
        verificationStatus: true,
        status: { $in: ["Reported", "Verified", "Assigned"] },
        severity: { $in: ["High", "Critical"] }
    }).select("title description category severity location createdAt");

    criticalIncidents.forEach(inc => {
        alertsList.push({
            id: inc._id,
            source: "incident",
            type: `${inc.category} Alert`,
            severity: inc.severity,
            message: inc.description,
            district: inc.location.district,
            latitude: inc.location.latitude,
            longitude: inc.location.longitude,
            timestamp: inc.createdAt
        });
    });

    // Sort by severity (Extreme/Critical first, than High, then Moderate, etc.) and timestamp
    const severityWeight = { "Extreme": 4, "Critical": 4, "High": 3, "Moderate": 2, "Low": 1 };
    alertsList.sort((a, b) => {
        const weightA = severityWeight[a.severity] || 1;
        const weightB = severityWeight[b.severity] || 1;
        if (weightA !== weightB) {
            return weightB - weightA;
        }
        return new Date(b.timestamp) - new Date(a.timestamp);
    });

    return alertsList;
};

/**
 * Get Aggregated Public Dashboard Data
 */
export const getAggregatedPublicDashboard = async () => {
    const [incidents, shelters, weatherList, riskList, alerts] = await Promise.all([
        getPublicIncidentsList(),
        getPublicSheltersList(),
        getPublicWeatherData(),
        getPublicRiskAssessments(),
        getPublicActiveAlerts()
    ]);

    const activeRoadBlocks = incidents.filter(i => i.category === "Road Block");
    const openSheltersCount = shelters.filter(s => s.status === "Open").length;

    // Determine state risk metrics
    let maxRiskScore = 0;
    let maxRiskLevel = "Low";
    const riskMap = {};
    riskList.forEach(r => {
        riskMap[r.district] = {
            riskLevel: r.riskLevel,
            riskScore: r.riskScore,
            riskType: r.riskType
        };
        if (r.riskScore > maxRiskScore) {
            maxRiskScore = r.riskScore;
            maxRiskLevel = r.riskLevel;
        }
    });

    // Aggregate districts metadata
    const districtSummaries = KERALA_DISTRICTS.map(dist => {
        const dWeather = weatherList.find(w => w.district === dist.name);
        const dRisk = riskMap[dist.name];
        const dShelters = shelters.filter(s => s.district === dist.name && s.status === "Open");

        return {
            district: dist.name,
            latitude: dist.lat,
            longitude: dist.lon,
            riskLevel: dRisk ? dRisk.riskLevel : "Low",
            riskScore: dRisk ? dRisk.riskScore : 0,
            weatherCondition: dWeather?.weather?.condition || "Clear",
            weatherDescription: dWeather?.weather?.description || "Clear Sky",
            temperature: dWeather?.temperature || 28,
            rainfall: dWeather?.rainfall || 0,
            openSheltersCount: dShelters.length
        };
    });

    return {
        activeIncidentsCount: incidents.length,
        openSheltersCount,
        activeRoadBlocksCount: activeRoadBlocks.length,
        overallRiskLevel: maxRiskLevel,
        weatherAlertsCount: alerts.filter(a => a.source === "weather").length,
        recentAlerts: alerts.slice(0, 10), // Return top 10 alert notifications
        districtSummaries
    };
};
