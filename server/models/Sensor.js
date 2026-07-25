import mongoose from "mongoose";

const SensorSchema = new mongoose.Schema(
    {
        sensorId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        sensorName: {
            type: String,
            required: true,
            trim: true,
        },
        sensorType: {
            type: String,
            enum: ["RiverGauge", "RainfallSensor", "WeatherStation", "WaterLevelGauge"],
            required: true,
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        river: {
            type: String,
            trim: true,
            default: "",
        },
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["Active", "Maintenance", "Offline"],
            default: "Active",
        },
        lastReading: {
            waterLevel: { type: Number, default: null },
            rainfall: { type: Number, default: null },
            temperature: { type: Number, default: null },
            humidity: { type: Number, default: null },
            riverFlow: { type: Number, default: null },
            waterVelocity: { type: Number, default: null },
            pressure: { type: Number, default: null },
            battery: { type: Number, default: null },
            timestamp: { type: Date, default: null },
        },
        batteryLevel: {
            type: Number,
            default: 100,
        },
        signalStrength: {
            type: Number,
            default: 100,
        },
        installedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

SensorSchema.index({ district: 1 });
SensorSchema.index({ sensorId: 1 }, { unique: true });
SensorSchema.index({ status: 1 });

export default mongoose.model("Sensor", SensorSchema);
