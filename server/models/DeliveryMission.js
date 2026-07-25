import mongoose from "mongoose";

const DispatchedResourceSchema = new mongoose.Schema({
    resource: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Resource",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
});

const DeliveryMissionSchema = new mongoose.Schema(
    {
        destinationShelter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shelter",
            required: true,
        },
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true,
        },
        assignedVehicle: {
            type: String,
            required: true,
            trim: true,
        },
        assignedVolunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Volunteer",
            default: null,
        },
        assignedDriver: {
            type: String,
            required: true,
            trim: true,
        },
        dispatchedResources: [DispatchedResourceSchema],
        missionStatus: {
            type: String,
            enum: ["Pending", "Dispatched", "In Transit", "Completed", "Cancelled"],
            default: "Pending",
        },
        estimatedArrival: {
            type: String, // String representation or Date description, e.g. "2 hours", "15:30"
            default: "",
        },
        liveGPS: {
            latitude: {
                type: Number,
                required: true,
            },
            longitude: {
                type: Number,
                required: true,
            },
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

export default mongoose.model("DeliveryMission", DeliveryMissionSchema);
