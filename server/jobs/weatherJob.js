import cron from "node-cron";
import { updateAllDistrictsWeather } from "../services/weatherService.js";
import { checkOnlineStatuses } from "../services/iotService.js";
import { runFullAnalysis } from "../services/aiDecisionEngine.js";

export const initWeatherJobs = () => {
    // Weather updates every 15 minutes
    cron.schedule("*/15 * * * *", async () => {
        console.log("⏰ Running scheduled weather sync...");
        try {
            await updateAllDistrictsWeather();
        } catch (error) {
            console.error("Scheduled weather sync failed:", error);
        }
    });

    // IoT Sensor connectivity sweeps every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
        console.log("⏰ Running scheduled IoT sensor connectivity sweeps...");
        try {
            await checkOnlineStatuses();
        } catch (error) {
            console.error("Scheduled IoT status sweep failed:", error);
        }
    });

    // AI Decision Engine analysis every 20 minutes
    cron.schedule("*/20 * * * *", async () => {
        console.log("🤖 Running scheduled AI Decision Engine analysis...");
        try {
            await runFullAnalysis();
        } catch (error) {
            console.error("Scheduled AI analysis failed:", error);
        }
    });

    console.log("⏰ Weather, IoT & AI Decision Engine cron jobs initialized.");

    // Run startup sync after 5 seconds to ensure DB and socket.io are online
    setTimeout(async () => {
        try {
            console.log("⏰ Running initial startup weather sync...");
            await updateAllDistrictsWeather();
        } catch (error) {
            console.error("Startup weather sync failed:", error);
        }
    }, 5000);

    // Run startup IoT sensor check after 8 seconds
    setTimeout(async () => {
        try {
            console.log("⏰ Running initial startup IoT sensor connectivity sweep...");
            await checkOnlineStatuses();
        } catch (error) {
            console.error("Startup IoT connectivity check failed:", error);
        }
    }, 8000);

    // Run startup AI analysis after 12 seconds (after weather + IoT data is available)
    setTimeout(async () => {
        try {
            console.log("🤖 Running initial startup AI Decision Engine analysis...");
            await runFullAnalysis();
        } catch (error) {
            console.error("Startup AI analysis failed:", error);
        }
    }, 12000);
};
