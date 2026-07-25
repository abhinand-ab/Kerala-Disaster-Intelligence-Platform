import http from "http";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { setSocketIO } from "./sockets/socket.js";
import userRoutes from "./routes/userRoutes.js";
import shelterRoutes from "./routes/shelterRoutes.js";
import volunteerRoutes from "./routes/volunteerRoutes.js";
import warehouseRoutes from "./routes/warehouseRoutes.js";
import resourceRoutes from "./routes/resourceRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import shelterInventoryRoutes from "./routes/shelterInventoryRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import rescueTeamRoutes from "./routes/rescueTeamRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import riskRoutes from "./routes/riskRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import commandCenterRoutes from "./routes/commandCenterRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import { initWeatherJobs } from "./jobs/weatherJob.js";
import { seedSensors } from "./services/iotService.js";
import { seedAgencies } from "./services/coordinationService.js";

import connectDB from "./config/db.js";

dotenv.config();

// Connect Database
connectDB().then(() => {
  seedSensors();
  seedAgencies();
});

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
});

setSocketIO(io);
initWeatherJobs();

io.on("connection", (socket) => {
  console.log("Client Connected");

  socket.on("join", (userId) => {
    if (!userId) return;

    socket.join(userId);
    console.log(`User ${userId} joined notification room.`);
  });

  socket.on("disconnect", () => {
    console.log("Client Disconnected");
  });
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Kerala Disaster Intelligence Platform API",
    version: "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/shelters", shelterRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/warehouses", warehouseRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/shelter-inventory", shelterInventoryRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/rescue-teams", rescueTeamRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/command-center", commandCenterRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/audit", auditRoutes);

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});