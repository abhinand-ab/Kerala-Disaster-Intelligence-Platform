import mongoose from "mongoose";

const AgencySchema = new mongoose.Schema(
    {
        agencyName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        agencyType: {
            type: String,
            required: true,
            enum: [
                "KSDMA",
                "Fire & Rescue Services",
                "Police Department",
                "Health Department",
                "Forest Department",
                "Public Works Department",
                "Local Self Government",
                "Electricity Board",
                "Water Authority",
                "NGOs",
                "Volunteers",
                "NDRF",
                "Army",
                "Other"
            ]
        },
        district: {
            type: String,
            required: true,
            trim: true,
        },
        headquarters: {
            address: { type: String, default: "" },
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        },
        contactPerson: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            default: "",
        },
        email: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Active",
        },
        logo: {
            type: String,
            default: "",
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Agency", AgencySchema);
