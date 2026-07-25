import mongoose from "mongoose";

const CommandCenterSchema = new mongoose.Schema(
    {
        incident: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Incident",
            required: true,
        },
        participatingAgencies: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Agency",
            },
        ],
        assignedCommander: {
            type: String,
            required: true,
            trim: true,
        },
        objectives: [
            {
                type: String,
                trim: true,
            },
        ],
        activeMissions: [
            {
                missionName: { type: String, required: true },
                agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
                teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "RescueTeam" }],
                vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }],
                status: {
                    type: String,
                    enum: ["Dispatched", "On Site", "Completed", "Aborted"],
                    default: "Dispatched",
                },
                description: { type: String, default: "" },
                location: {
                    latitude: { type: Number },
                    longitude: { type: Number },
                },
                updatedAt: { type: Date, default: Date.now },
            },
        ],
        sharedResources: [
            {
                resourceType: {
                    type: String,
                    enum: ["Team", "Vehicle", "Warehouse Supplies", "Shelter Space", "Equipment", "Other"],
                    required: true,
                },
                name: { type: String, required: true },
                fromAgency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
                toAgency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" },
                status: {
                    type: String,
                    enum: ["Requested", "Approved", "Deployed", "Returned"],
                    default: "Requested",
                },
                details: { type: String, default: "" },
                quantity: { type: Number, default: 1 },
            },
        ],
        timeline: [
            {
                timestamp: { type: Date, default: Date.now },
                agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" },
                action: { type: String, required: true },
                details: { type: String, default: "" },
            },
        ],
        messages: [
            {
                sender: { type: String, required: true },
                agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" },
                message: { type: String, required: true },
                timestamp: { type: Date, default: Date.now },
            },
        ],
        status: {
            type: String,
            enum: ["Active", "Deactivated"],
            default: "Active",
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("CommandCenter", CommandCenterSchema);
