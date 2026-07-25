import mongoose from "mongoose";

const RescueTeamSchema = new mongoose.Schema(
    {
        teamName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        leader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Volunteer",
            default: null,
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Volunteer",
            },
        ],
        assignedVehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            default: null,
        },
        assignedIncident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            default: null,
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["Available", "On Mission", "Returning", "Maintenance", "Inactive"],
            default: "Available",
        },
        specialization: {
            type: String,
            default: "",
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

export default mongoose.model("RescueTeam", RescueTeamSchema);
