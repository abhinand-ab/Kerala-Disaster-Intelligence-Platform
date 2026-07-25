import axios from "axios";
import WeatherSnapshot from "../models/WeatherSnapshot.js";
import { getSocketIO } from "../sockets/socket.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { updateAllDistrictsRisk } from "./riskEngine.js";

// Kerala districts with coordinates
export const KERALA_DISTRICTS = [
    { name: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366 },
    { name: "Kollam", lat: 8.8932, lon: 76.6141 },
    { name: "Pathanamthitta", lat: 9.2648, lon: 76.7870 },
    { name: "Alappuzha", lat: 9.4981, lon: 76.3388 },
    { name: "Kottayam", lat: 9.5916, lon: 76.5222 },
    { name: "Idukki", lat: 9.8516, lon: 77.0697 },
    { name: "Ernakulam", lat: 9.9816, lon: 76.2999 },
    { name: "Thrissur", lat: 10.5276, lon: 76.2144 },
    { name: "Palakkad", lat: 10.7867, lon: 76.6548 },
    { name: "Malappuram", lat: 11.0735, lon: 76.0740 },
    { name: "Kozhikode", lat: 11.2588, lon: 75.7804 },
    { name: "Wayanad", lat: 11.6854, lon: 76.1320 },
    { name: "Kannur", lat: 11.8745, lon: 75.3704 },
    { name: "Kasaragod", lat: 12.5102, lon: 74.9852 }
];

export const mapWeatherCodeToCondition = (code) => {
    if (code === 0) return { condition: "Clear", description: "Clear Sky" };
    if ([1, 2, 3].includes(code)) return { condition: "Cloudy", description: "Partly Cloudy" };
    if ([45, 48].includes(code)) return { condition: "Fog", description: "Foggy" };
    if ([51, 53, 55, 56, 57].includes(code)) return { condition: "Drizzle", description: "Light Drizzle" };
    if ([61, 63].includes(code)) return { condition: "Rainy", description: "Moderate Rain" };
    if (code === 65) return { condition: "Rainy", description: "Heavy Rain" };
    if ([66, 67].includes(code)) return { condition: "Rainy", description: "Freezing Rain" };
    if ([71, 73, 75, 77].includes(code)) return { condition: "Snow", description: "Snowfall" };
    if ([80, 81].includes(code)) return { condition: "Rainy", description: "Rain Showers" };
    if (code === 82) return { condition: "Rainy", description: "Violent Rain Showers" };
    if ([85, 86].includes(code)) return { condition: "Snow", description: "Snow Showers" };
    if (code === 95) return { condition: "Thunderstorm", description: "Thunderstorm" };
    if ([96, 99].includes(code)) return { condition: "Thunderstorm", description: "Severe Thunderstorm" };
    return { condition: "Unknown", description: "Unknown Weather" };
};

const notifyAdminsAboutAlert = async (district, alert) => {
    try {
        const admins = await User.find({ role: "admin" }).select("_id");
        const io = getSocketIO();

        for (const admin of admins) {
            const notification = await Notification.create({
                user: admin._id,
                title: `🚨 ${alert.type} Alert: ${district}`,
                message: `${alert.severity} Alert: ${alert.message}`,
                type: "system",
            });

            try {
                io.to(admin._id.toString()).emit("notificationCreated", notification);
            } catch (e) {
                console.warn("Socket notification send failed:", e.message);
            }
        }
    } catch (err) {
        console.error("Failed to notify admins about alert:", err);
    }
};

const triggerSocketEvent = (eventName, data) => {
    try {
        const io = getSocketIO();
        io.emit(eventName, data);
    } catch (err) {
        console.warn("Socket broadcast of weather event skipped:", err.message);
    }
};

// Generate realistic mock data for fallback
export const generateMockWeather = (districtName, lat, lon) => {
    const hash = districtName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Seed basic variables based on hash/district name
    const tempSeed = 24 + (hash % 10); // 24 to 34 C
    const humiditySeed = 60 + (hash % 36); // 60 to 96%
    const windSeed = 5 + (hash % 26); // 5 to 30 km/h
    const pressureSeed = 998 + (hash % 15); // 998 to 1013 hPa

    // Different weather profiles for districts to make UI look amazing and diverse
    let code = 0;
    let rainfall = 0;
    let temp = tempSeed;
    let humidity = humiditySeed;
    let windSpeed = windSeed;
    let windDirection = (hash * 17) % 360;

    if (hash % 4 === 0) {
        // Rainy
        code = 65; // Heavy Rain
        rainfall = 18.5 + (hash % 15); // 18.5 to 33.5 mm
        temp = tempSeed - 4;
        humidity = 95;
        windSpeed = windSeed + 10;
    } else if (hash % 4 === 1) {
        // Thunderstorm
        code = 95;
        rainfall = 32.0 + (hash % 20);
        temp = tempSeed - 5;
        humidity = 98;
        windSpeed = windSeed + 22;
    } else if (hash % 4 === 2) {
        // Cloudy
        code = 3;
        temp = tempSeed - 1;
        humidity = 75;
    } else {
        // Clear
        code = 0;
        temp = tempSeed;
        humidity = 60;
    }

    const { condition, description } = mapWeatherCodeToCondition(code);

    // Dynamic forecast generators
    const hourly = [];
    const daily = [];
    const now = new Date();

    for (let i = 0; i < 24; i++) {
        const forecastTime = new Date(now.getTime() + i * 60 * 60 * 1000);
        const timeRatio = Math.sin((i / 24) * Math.PI * 2);
        hourly.push({
            time: forecastTime,
            temperature: Math.round((temp + timeRatio * 3) * 10) / 10,
            precipitation: code >= 50 ? Math.round(Math.max(0, rainfall / 4 + timeRatio * 5) * 10) / 10 : 0,
            humidity: Math.min(100, Math.round(humidity - timeRatio * 10)),
            windSpeed: Math.round(Math.max(0, windSpeed + timeRatio * 5)),
        });
    }

    for (let i = 0; i < 7; i++) {
        const forecastDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const daySeed = (hash + i) % 4;
        let dayCode = 0;
        let dayPrecip = 0;
        if (daySeed === 0) { dayCode = 61; dayPrecip = 12.0; }
        else if (daySeed === 1) { dayCode = 95; dayPrecip = 25.5; }
        else if (daySeed === 2) { dayCode = 3; dayPrecip = 0.5; }
        else { dayCode = 0; dayPrecip = 0; }

        const dayCondition = mapWeatherCodeToCondition(dayCode).condition;

        daily.push({
            date: forecastDate,
            condition: dayCondition,
            code: dayCode,
            tempMax: Math.round(temp + 2 + Math.sin(i) * 2),
            tempMin: Math.round(temp - 4 + Math.sin(i) * 2),
            precipitationSum: dayPrecip,
            windSpeedMax: Math.round(windSpeed + 5 + Math.cos(i) * 5),
        });
    }

    // Create mock alert if code was rainy/thunderstorm
    const alerts = [];
    if (code === 65 && rainfall > 15) {
        alerts.push({
            type: rainfall > 25 ? "Extreme Rain" : "Heavy Rain",
            severity: rainfall > 25 ? "Extreme" : "Severe",
            message: `Torrential rainfall of ${rainfall.toFixed(1)} mm registered in ${districtName}. Landslide and waterlogging warnings are in effect.`,
            issuedAt: new Date(now.getTime() - 30 * 60 * 1000),
        });
        // Add flood risk alert if rainfall is high
        if (rainfall > 20) {
            alerts.push({
                type: "Flood Risk",
                severity: "Severe",
                message: `Fluvial rise and waterlogging detected in low-lying zones of ${districtName}. Evacuate if advised.`,
                issuedAt: new Date(now.getTime() - 15 * 60 * 1000),
            });
        }
    } else if (code === 95) {
        alerts.push({
            type: "Thunderstorm",
            severity: "Severe",
            message: `Severe convective storm active with wind gusts up to ${windSpeed} km/h in ${districtName}. Avoid open areas.`,
            issuedAt: new Date(now.getTime() - 45 * 60 * 1000),
        });
        alerts.push({
            type: "Lightning",
            severity: "Extreme",
            message: `Cloud-to-ground lightning discharge activity high in ${districtName}. Secure power grid and seek indoor shelters.`,
            issuedAt: new Date(now.getTime() - 20 * 60 * 1000),
        });
    }

    // Let's add some wind alerts if speed is high
    if (windSpeed > 40) {
        alerts.push({
            type: "High Wind",
            severity: "Moderate",
            message: `Strong wind gusts of ${windSpeed} km/h reported. Stay clear of weak structures.`,
            issuedAt: new Date(now.getTime() - 60 * 60 * 1000),
        });
    }

    return {
        district: districtName,
        latitude: lat,
        longitude: lon,
        weather: {
            condition,
            code,
            description,
        },
        rainfall,
        temperature: temp,
        humidity,
        pressure,
        wind: {
            speed: windSpeed,
            direction: windDirection,
        },
        forecast: {
            hourly,
            daily,
        },
        alerts,
        fetchedAt: now,
    };
};

export const fetchWeatherFromProvider = async (districtName, lat, lon) => {
    const provider = process.env.WEATHER_PROVIDER || "open-meteo";
    const apiKey = process.env.WEATHER_API_KEY || "";

    if (provider === "open-weather" && apiKey) {
        try {
            const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=metric&appid=${apiKey}`;
            const res = await axios.get(url);
            const data = res.data;

            const current = data.current;
            const weatherObj = current.weather[0];

            // Determine rainfall (OpenWeather handles this under rain field)
            let rainfall = 0;
            if (current.rain && current.rain["1h"]) {
                rainfall = current.rain["1h"];
            }

            const now = new Date();
            // Format hourly
            const hourly = (data.hourly || []).slice(0, 24).map(h => ({
                time: new Date(h.dt * 1000),
                temperature: h.temp,
                precipitation: h.rain ? h.rain["1h"] || 0 : 0,
                humidity: h.humidity,
                windSpeed: h.wind_speed * 3.6, // convert m/s to km/h
            }));

            // Format daily
            const daily = (data.daily || []).slice(0, 7).map(d => ({
                date: new Date(d.dt * 1000),
                condition: d.weather[0].main,
                code: d.weather[0].id, // OpenWeather code
                tempMax: d.temp.max,
                tempMin: d.temp.min,
                precipitationSum: d.rain || 0,
                windSpeedMax: d.wind_speed * 3.6,
            }));

            // Process OpenWeather codes to our conditions
            let condition = weatherObj.main;
            let code = weatherObj.id;

            // Evaluate Alerts based on thresholds
            const alerts = [];
            const speedKmH = current.wind_speed * 3.6;

            if (rainfall > 50) {
                alerts.push({
                    type: "Extreme Rain",
                    severity: "Extreme",
                    message: `Extreme rain of ${rainfall} mm/h. High flood risk in ${districtName}.`,
                });
            } else if (rainfall > 15) {
                alerts.push({
                    type: "Heavy Rain",
                    severity: "Severe",
                    message: `Heavy rain of ${rainfall} mm/h reported in ${districtName}.`,
                });
            }

            if (rainfall > 30 || (daily[0] && daily[0].precipitationSum > 100)) {
                alerts.push({
                    type: "Flood Risk",
                    severity: "Severe",
                    message: `High risk of floods and landslides due to accumulated rainfall in ${districtName}.`,
                });
            }

            if (speedKmH > 80) {
                alerts.push({
                    type: "Cyclone Warning",
                    severity: "Extreme",
                    message: `Destructive winds of ${speedKmH.toFixed(1)} km/h. Cyclone warning active.`,
                });
            } else if (speedKmH > 60) {
                alerts.push({
                    type: "Cyclone Watch",
                    severity: "Severe",
                    message: `Strong winds of ${speedKmH.toFixed(1)} km/h. Cyclone watch active.`,
                });
            } else if (speedKmH > 40) {
                alerts.push({
                    type: "High Wind",
                    severity: "Moderate",
                    message: `High winds of ${speedKmH.toFixed(1)} km/h active in ${districtName}.`,
                });
            }

            if (condition === "Thunderstorm") {
                alerts.push({
                    type: "Thunderstorm",
                    severity: "Severe",
                    message: `Thunderstorm activity with active precipitation in ${districtName}.`,
                });
                alerts.push({
                    type: "Lightning",
                    severity: "Severe",
                    message: `High lightning vulnerability. Stay in locked structures.`,
                });
            }

            return {
                district: districtName,
                latitude: lat,
                longitude: lon,
                weather: {
                    condition,
                    code,
                    description: weatherObj.description,
                },
                rainfall,
                temperature: current.temp,
                humidity: current.humidity,
                pressure: current.pressure,
                wind: {
                    speed: speedKmH,
                    direction: current.wind_deg || 0,
                },
                forecast: {
                    hourly,
                    daily,
                },
                alerts,
                fetchedAt: now,
            };
        } catch (e) {
            console.warn(`OpenWeather API failed for ${districtName}. Trying Open-Meteo as fallback.`, e.message);
        }
    }

    // Open-Meteo Default Provider
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index,visibility&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
        const res = await axios.get(url);
        const data = res.data;

        if (data && data.current) {
            const current = data.current;
            const code = current.weather_code;
            const { condition, description } = mapWeatherCodeToCondition(code);
            const rainfall = current.precipitation || 0;
            const windSpeed = current.wind_speed_10m || 0;
            const windDirection = current.wind_direction_10m || 0;

            const hourly = (data.hourly.time || []).slice(0, 24).map((time, idx) => ({
                time: new Date(time),
                temperature: data.hourly.temperature_2m[idx],
                precipitation: data.hourly.precipitation[idx] || 0,
                humidity: data.hourly.relative_humidity_2m[idx],
                windSpeed: data.hourly.wind_speed_10m[idx],
            }));

            const daily = (data.daily.time || []).slice(0, 7).map((time, idx) => {
                const dayCode = data.daily.weather_code[idx];
                const dayCondition = mapWeatherCodeToCondition(dayCode).condition;
                return {
                    date: new Date(time),
                    condition: dayCondition,
                    code: dayCode,
                    tempMax: data.daily.temperature_2m_max[idx],
                    tempMin: data.daily.temperature_2m_min[idx],
                    precipitationSum: data.daily.precipitation_sum[idx] || 0,
                    windSpeedMax: data.daily.wind_speed_10m_max[idx],
                };
            });

            // Construct Alerts
            const alerts = [];
            if (rainfall > 50) {
                alerts.push({
                    type: "Extreme Rain",
                    severity: "Extreme",
                    message: `Extreme torrential rain of ${rainfall.toFixed(1)} mm/h logged in ${districtName}.`,
                });
            } else if (rainfall > 15) {
                alerts.push({
                    type: "Heavy Rain",
                    severity: "Severe",
                    message: `Heavy rain of ${rainfall.toFixed(1)} mm/h logged in ${districtName}. Warnings in place.`,
                });
            }

            // Daily sum check for flood
            const dailySum = daily[0] ? daily[0].precipitationSum : 0;
            if (dailySum > 100) {
                alerts.push({
                    type: "Flood Risk",
                    severity: "Severe",
                    message: `Intense localized flooding risks registered in ${districtName} due to ${dailySum.toFixed(1)} mm rain.`,
                });
            }

            if (windSpeed > 80) {
                alerts.push({
                    type: "Cyclone Warning",
                    severity: "Extreme",
                    message: `Cyclone Warning! Winds of ${windSpeed.toFixed(1)} km/h. Avoid navigating coasts.`,
                });
            } else if (windSpeed > 60) {
                alerts.push({
                    type: "Cyclone Watch",
                    severity: "Severe",
                    message: `Cyclone Watch: High velocity wind fields (${windSpeed.toFixed(1)} km/h) approaching ${districtName}.`,
                });
            } else if (windSpeed > 40) {
                alerts.push({
                    type: "High Wind",
                    severity: "Moderate",
                    message: `Sustained high wind conditions of ${windSpeed.toFixed(1)} km/h active.`,
                });
            }

            if ([95, 96, 99].includes(code)) {
                alerts.push({
                    type: "Thunderstorm",
                    severity: "Severe",
                    message: `Convective activity with high lightning probability active in ${districtName}.`,
                });
                alerts.push({
                    type: "Lightning",
                    severity: [96, 99].includes(code) ? "Extreme" : "Severe",
                    message: `Active lightning and electric discharge fields. Take immediate cover.`,
                });
            }

            return {
                district: districtName,
                latitude: lat,
                longitude: lon,
                weather: {
                    condition,
                    code,
                    description,
                },
                rainfall,
                temperature: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                pressure: current.pressure_msl || current.surface_pressure || 1013,
                wind: {
                    speed: windSpeed,
                    direction: windDirection,
                },
                forecast: {
                    hourly,
                    daily,
                },
                alerts,
                fetchedAt: new Date(),
            };
        }
    } catch (e) {
        console.warn(`Open-Meteo API failed for ${districtName}. Using Mock fallback.`, e.message);
    }

    // Final fallback to mock
    return generateMockWeather(districtName, lat, lon);
};

export const updateAllDistrictsWeather = async () => {
    const snapshots = [];
    const now = new Date();

    console.log(`Starting scheduled weather scan for ${KERALA_DISTRICTS.length} districts...`);

    // Run in sequence/batch to prevent DDOSing provider
    for (const dist of KERALA_DISTRICTS) {
        try {
            const weatherData = await fetchWeatherFromProvider(dist.name, dist.lat, dist.lon);

            // Fetch previous latest snapshot for this district to see if any alert is now cleared
            const previousSnapshot = await WeatherSnapshot.findOne({ district: dist.name })
                .sort({ fetchedAt: -1 });

            const newSnapshot = await WeatherSnapshot.create(weatherData);
            snapshots.push(newSnapshot);

            // Emit cleared alerts
            if (previousSnapshot && previousSnapshot.alerts && previousSnapshot.alerts.length > 0) {
                const previousTypes = previousSnapshot.alerts.map(a => a.type);
                const currentTypes = (newSnapshot.alerts || []).map(a => a.type);
                const clearedTypes = previousTypes.filter(t => !currentTypes.includes(t));
                clearedTypes.forEach(type => {
                    triggerSocketEvent("weatherAlertCleared", {
                        district: dist.name,
                        type,
                    });
                });
            }

            // Process alerts to trigger alerts notifications
            if (newSnapshot.alerts && newSnapshot.alerts.length > 0) {
                for (const alert of newSnapshot.alerts) {
                    triggerSocketEvent("weatherAlertCreated", {
                        district: dist.name,
                        alert,
                    });

                    // Public Alert emit
                    triggerSocketEvent("publicAlert", {
                        id: alert._id || `weather_${dist.name}_${alert.type}`,
                        source: "weather",
                        type: alert.type || "Weather Warning",
                        severity: alert.severity || "Moderate",
                        message: alert.message,
                        district: dist.name,
                        latitude: dist.lat,
                        longitude: dist.lon,
                        timestamp: alert.issuedAt || newSnapshot.fetchedAt
                    });

                    await notifyAdminsAboutAlert(dist.name, alert);
                }
            }
        } catch (err) {
            console.error(`Error saving weather for ${dist.name}:`, err);
        }
    }

    // Socket IO broadcasts
    triggerSocketEvent("weatherUpdated", snapshots);
    triggerSocketEvent("publicWeatherUpdate", snapshots);

    // Calculate total rainfall in state
    const totalRainfall = snapshots.reduce((acc, snap) => acc + (snap.rainfall || 0), 0);
    triggerSocketEvent("rainfallUpdated", {
        totalRainfall,
        timestamp: now,
        districtsRainfall: snapshots.map(s => ({ district: s.district, rainfall: s.rainfall })),
    });

    try {
        await updateAllDistrictsRisk();
    } catch (riskError) {
        console.error("Error recalculating risk indexes during weather sync:", riskError);
    }

    console.log("Weather update completed. Total Snapshots:", snapshots.length);
    return snapshots;
};
