import mongoose from "mongoose";

const EmergencyRequestSchema = new mongoose.Schema(
    {
        citizenName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            default: "",
        },
        emergencyType: {
            type: String,
            enum: ["Flood", "Landslide", "Medical", "Trapped", "Other"],
            required: true,
        },
        severity: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            required: true,
            default: "Medium",
        },
        description: {
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
        district: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            default: "",
            trim: true,
        },
        photos: {
            type: [String],
            default: [],
        },
        videos: {
            type: [String],
            default: [],
        },
        requestStatus: {
            type: String,
            enum: ["Pending", "Reviewed", "Assigned", "Resolved", "Cancelled"],
            default: "Pending",
        },
        assignedTeam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RescueTeam",
            default: null,
        },
        assignedVehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            default: null,
        },
        assignedShelter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shelter",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for high-performance dashboard queries and geo-queries
EmergencyRequestSchema.index({ district: 1, requestStatus: 1 });
EmergencyRequestSchema.index({ requestStatus: 1, severity: -1 });
EmergencyRequestSchema.index({ createdAt: -1 });

export default mongoose.model("EmergencyRequest", EmergencyRequestSchema);
