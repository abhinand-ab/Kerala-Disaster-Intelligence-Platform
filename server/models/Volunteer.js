import mongoose from "mongoose";

const VolunteerSchema = new mongoose.Schema(
    {
        fullName: {
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
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        age: {
            type: Number,
        },
        gender: {
            type: String,
        },
        bloodGroup: {
            type: String,
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
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
        skills: {
            type: [String],
            default: [],
        },
        certifications: {
            type: String,
            default: "",
        },
        organization: {
            type: String,
            default: "",
        },
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
        assignedShelter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shelter",
            default: null,
        },
        team: {
            type: String,
            default: "",
        },
        availability: {
            type: Boolean,
            default: true,
        },
        status: {
            type: String,
            enum: ["Available", "Assigned", "On Duty", "Off Duty", "Unavailable"],
            default: "Available",
        },
        emergencyContact: {
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

export default mongoose.model("Volunteer", VolunteerSchema);
