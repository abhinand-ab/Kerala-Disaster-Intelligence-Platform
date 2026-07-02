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

import connectDB from "./config/db.js";

dotenv.config();

// Connect Database
connectDB();

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
// Future Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/incidents", incidentRoutes);
// app.use("/api/shelters", shelterRoutes);
// app.use("/api/weather", weatherRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});