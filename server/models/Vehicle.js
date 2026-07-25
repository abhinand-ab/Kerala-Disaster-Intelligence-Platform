import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
    {
        vehicleNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        vehicleType: {
            type: String,
            required: true,
            enum: [
                "Ambulance",
                "Rescue Boat",
                "Fire Engine",
                "Police Vehicle",
                "Supply Truck",
                "NDRF Vehicle",
            ],
        },
        department: {
            type: String,
            required: true,
        },
        driverName: {
            type: String,
            required: true,
        },
        driverPhone: {
            type: String,
            required: true,
        },
        district: {
            type: String,
            required: true,
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
            required: true,
            enum: ["Available", "Assigned", "On Mission", "Returning", "Maintenance"],
            default: "Available",
        },
        fuelLevel: {
            type: Number,
            min: 0,
            max: 100,
            default: 100,
        },
        capacity: {
            type: String,
            default: "",
        },
        currentMission: {
            type: String,
            default: "",
        },
        assignedIncident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Vehicle", vehicleSchema);
