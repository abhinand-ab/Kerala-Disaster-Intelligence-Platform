import mongoose from "mongoose";

const WeatherSnapshotSchema = new mongoose.Schema(
    {
        district: {
            type: String,
            required: true,
            trim: true,
        },
        latitude: {
            type: Number,
            required: true,
        },
        longitude: {
            type: Number,
            required: true,
        },
        weather: {
            condition: { type: String, required: true }, // e.g. "Clear", "Rainy", "Thunderstorm"
            code: { type: Number, required: true }, // WMO weather code
            description: { type: String }, // e.g. "Heavy Rain"
        },
        rainfall: {
            type: Number, // in mm
            required: true,
            default: 0,
        },
        temperature: {
            type: Number, // in Celsius
            required: true,
        },
        humidity: {
            type: Number, // percentage
            required: true,
        },
        pressure: {
            type: Number, // hPa
            required: true,
        },
        wind: {
            speed: { type: Number, required: true }, // km/h
            direction: { type: Number, required: true }, // degrees
        },
        forecast: {
            hourly: [
                {
                    time: { type: Date },
                    temperature: { type: Number },
                    precipitation: { type: Number },
                    humidity: { type: Number },
                    windSpeed: { type: Number },
                },
            ],
            daily: [
                {
                    date: { type: Date },
                    condition: { type: String },
                    code: { type: Number },
                    tempMax: { type: Number },
                    tempMin: { type: Number },
                    precipitationSum: { type: Number },
                    windSpeedMax: { type: Number },
                },
            ],
        },
        alerts: [
            {
                type: { type: String }, // e.g. "Heavy Rain", "Flood Risk", "Cyclone Warning"
                severity: { type: String }, // "Minor", "Moderate", "Severe", "Extreme"
                message: { type: String },
                issuedAt: { type: Date, default: Date.now },
            },
        ],
        fetchedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index to quickly find the latest snapshot for each district
WeatherSnapshotSchema.index({ district: 1, fetchedAt: -1 });

export default mongoose.model("WeatherSnapshot", WeatherSnapshotSchema);
