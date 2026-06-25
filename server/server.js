import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";

import connectDB from "./config/db.js";

dotenv.config();

// Connect Database
connectDB();

const app = express();

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
app.use("/api/incidents", incidentRoutes);
// Future Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/incidents", incidentRoutes);
// app.use("/api/shelters", shelterRoutes);
// app.use("/api/weather", weatherRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});