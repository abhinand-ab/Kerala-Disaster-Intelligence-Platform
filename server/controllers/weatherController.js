import WeatherSnapshot, { default as _ } from "../models/WeatherSnapshot.js";
import { updateAllDistrictsWeather, KERALA_DISTRICTS } from "../services/weatherService.js";

// Helper to check if we have any snap in DB, if not, pull them immediately.
const ensureWeatherExists = async () => {
    const count = await WeatherSnapshot.estimatedDocumentCount();
    if (count === 0) {
        console.log("No weather snapshots exist. Initializing database weather data...");
        await updateAllDistrictsWeather();
    }
};

/*
=========================================
Get Current Weather (All Districts)
GET /api/weather
=========================================
*/
export const getCurrentWeather = async (req, res) => {
    try {
        await ensureWeatherExists();

        // Get the latest snapshot for each district
        const latestSnapshots = await Promise.all(
            KERALA_DISTRICTS.map(async (dist) => {
                return WeatherSnapshot.findOne({ district: dist.name })
                    .sort({ fetchedAt: -1 });
            })
        );

        // Filter out null values
        const data = latestSnapshots.filter(Boolean);

        res.status(200).json({
            success: true,
            count: data.length,
            data,
        });
    } catch (error) {
        console.error("GET CURRENT WEATHER ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Get Single District Weather
GET /api/weather/district/:name
=========================================
*/
export const getDistrictWeather = async (req, res) => {
    try {
        await ensureWeatherExists();
        const { name } = req.params;

        const data = await WeatherSnapshot.findOne({ district: { $regex: new RegExp(`^${name}$`, "i") } })
            .sort({ fetchedAt: -1 });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: `Weather data for district '${name}' not found.`,
            });
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("GET DISTRICT WEATHER ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Get District Forecast
GET /api/weather/district/:name/forecast
=========================================
*/
export const getForecast = async (req, res) => {
    try {
        await ensureWeatherExists();
        const { name } = req.params;

        const snapshot = await WeatherSnapshot.findOne({ district: { $regex: new RegExp(`^${name}$`, "i") } })
            .sort({ fetchedAt: -1 })
            .select("forecast fetchedAt district");

        if (!snapshot) {
            return res.status(404).json({
                success: false,
                message: `Forecast data for district '${name}' not found.`,
            });
        }

        res.status(200).json({
            success: true,
            data: snapshot,
        });
    } catch (error) {
        console.error("GET FORECAST ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Get Weather Alerts
GET /api/weather/alerts
=========================================
*/
export const getActiveAlerts = async (req, res) => {
    try {
        await ensureWeatherExists();

        const latestSnapshots = await Promise.all(
            KERALA_DISTRICTS.map(async (dist) => {
                return WeatherSnapshot.findOne({ district: dist.name })
                    .sort({ fetchedAt: -1 })
                    .select("district latitude longitude alerts fetchedAt weather");
            })
        );

        const alerts = [];
        latestSnapshots.filter(Boolean).forEach((snap) => {
            if (snap.alerts && snap.alerts.length > 0) {
                snap.alerts.forEach((alert) => {
                    alerts.push({
                        district: snap.district,
                        latitude: snap.latitude,
                        longitude: snap.longitude,
                        weather: snap.weather,
                        alertId: alert._id,
                        type: alert.type,
                        severity: alert.severity,
                        message: alert.message,
                        issuedAt: alert.issuedAt,
                    });
                });
            }
        });

        res.status(200).json({
            success: true,
            count: alerts.length,
            data: alerts,
        });
    } catch (error) {
        console.error("GET ACTIVE ALERTS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Get Weather History (Trends)
GET /api/weather/history
=========================================
*/
export const getWeatherHistory = async (req, res) => {
    try {
        await ensureWeatherExists();
        const { district, limit = 50, days = 7 } = req.query;

        const query = {};
        if (district) {
            query.district = { $regex: new RegExp(`^${district}$`, "i") };
        }

        // Filter by days
        const rangeDate = new Date();
        rangeDate.setDate(rangeDate.getDate() - parseInt(days));
        query.fetchedAt = { $gte: rangeDate };

        const history = await WeatherSnapshot.find(query)
            .sort({ fetchedAt: 1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: history.length,
            data: history,
        });
    } catch (error) {
        console.error("GET WEATHER HISTORY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Get Weather Summary (Dashboard Stats)
GET /api/weather/summary
=========================================
*/
export const getWeatherSummary = async (req, res) => {
    try {
        await ensureWeatherExists();

        const latestSnapshots = (await Promise.all(
            KERALA_DISTRICTS.map(async (dist) => {
                return WeatherSnapshot.findOne({ district: dist.name })
                    .sort({ fetchedAt: -1 });
            })
        )).filter(Boolean);

        if (latestSnapshots.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    highestTemp: { district: "N/A", value: 0 },
                    maxWind: { district: "N/A", value: 0 },
                    maxRain: { district: "N/A", value: 0 },
                    avgRainfall: 0,
                    activeAlertsCount: 0,
                    alerts: [],
                },
            });
        }

        let highestTemp = { district: "", value: -Infinity };
        let maxWind = { district: "", value: -Infinity };
        let maxRain = { district: "", value: -Infinity };
        let totalRainfall = 0;
        let alertsCount = 0;
        const alerts = [];

        latestSnapshots.forEach((snap) => {
            if (snap.temperature > highestTemp.value) {
                highestTemp = { district: snap.district, value: snap.temperature };
            }
            if (snap.wind.speed > maxWind.value) {
                maxWind = { district: snap.district, value: snap.wind.speed };
            }
            if (snap.rainfall > maxRain.value) {
                maxRain = { district: snap.district, value: snap.rainfall };
            }
            totalRainfall += snap.rainfall;

            if (snap.alerts && snap.alerts.length > 0) {
                alertsCount += snap.alerts.length;
                snap.alerts.forEach((alert) => {
                    alerts.push({
                        district: snap.district,
                        latitude: snap.latitude,
                        longitude: snap.longitude,
                        ...alert.toObject(),
                    });
                });
            }
        });

        res.status(200).json({
            success: true,
            data: {
                highestTemp,
                maxWind,
                maxRain,
                avgRainfall: parseFloat((totalRainfall / latestSnapshots.length).toFixed(2)),
                activeAlertsCount: alertsCount,
                alerts,
            },
        });
    } catch (error) {
        console.error("GET WEATHER SUMMARY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/*
=========================================
Manual Weather Sync (Admin Only)
POST /api/weather/sync
=========================================
*/
export const triggerManualWeatherSync = async (req, res) => {
    try {
        const data = await updateAllDistrictsWeather();
        res.status(200).json({
            success: true,
            message: "Weather synced successfully.",
            count: data.length,
            data,
        });
    } catch (error) {
        console.error("MANUAL WEATHER SYNC ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
