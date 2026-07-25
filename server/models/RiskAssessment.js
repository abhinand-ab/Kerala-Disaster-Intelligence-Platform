import mongoose from "mongoose";

const RiskAssessmentSchema = new mongoose.Schema(
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
        riskType: {
            type: String,
            enum: ["Flood", "Landslide", "Both"],
            required: true,
        },
        rainfall: {
            type: Number,
            default: 0,
        },
        riverLevel: {
            type: Number,
            default: 0,
        },
        soilMoisture: {
            type: Number,
            default: 0,
        },
        slopeIndex: {
            type: Number,
            default: 0,
        },
        vegetationIndex: {
            type: Number,
            default: 0,
        },
        historicalEvents: {
            type: Number,
            default: 0,
        },
        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        riskLevel: {
            type: String,
            enum: ["Low", "Moderate", "High", "Extreme"],
            default: "Low",
        },
        recommendations: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

RiskAssessmentSchema.index({ district: 1, createdAt: -1 });

export default mongoose.model("RiskAssessment", RiskAssessmentSchema);
