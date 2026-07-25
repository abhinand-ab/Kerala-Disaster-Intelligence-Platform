import mongoose from "mongoose";

const AIRecommendationSchema = new mongoose.Schema(
    {
        recommendationType: {
            type: String,
            enum: [
                "EvacuationShelter",
                "RescueTeamDeploy",
                "VehicleDispatch",
                "WarehouseSelection",
                "ResourceAllocation",
                "EvacuationPlanning",
                "IncidentPrioritization",
                "RouteSuggestion",
                "HighRiskAlert",
                "ShelterOvercrowding",
                "ResourceShortage",
                "FloodPrediction",
                "LandslidePrediction",
                "DemandForecast",
            ],
            required: true,
        },
        priority: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Medium",
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        generatedFor: {
            type: String,
            enum: ["Incident", "SOS", "Prediction", "Optimization", "System"],
            default: "System",
        },
        recommendation: {
            type: String,
            required: true,
        },
        reasoning: {
            type: String,
            default: "",
        },
        confidenceScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 75,
        },
        relatedIncident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            default: null,
        },
        relatedEmergency: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EmergencyRequest",
            default: null,
        },
        relatedShelter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shelter",
            default: null,
        },
        relatedVehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            default: null,
        },
        relatedTeam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RescueTeam",
            default: null,
        },
        relatedWarehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            default: null,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: ["Pending", "Accepted", "Rejected", "Expired"],
            default: "Pending",
        },
        acceptedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        generatedAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
        },
    },
    {
        timestamps: true,
    }
);

AIRecommendationSchema.index({ district: 1, status: 1 });
AIRecommendationSchema.index({ recommendationType: 1, priority: -1 });
AIRecommendationSchema.index({ generatedAt: -1 });
AIRecommendationSchema.index({ status: 1, expiresAt: 1 });

export default mongoose.model("AIRecommendation", AIRecommendationSchema);
