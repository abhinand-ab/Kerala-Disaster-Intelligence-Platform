import mongoose from "mongoose";

const ShelterInventorySchema = new mongoose.Schema(
    {
        shelter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shelter",
            required: true,
        },
        resourceName: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },
        unit: {
            type: String,
            required: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure unique combination of shelter and resourceName
ShelterInventorySchema.index({ shelter: 1, resourceName: 1 }, { unique: true });

export default mongoose.model("ShelterInventory", ShelterInventorySchema);
