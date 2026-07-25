import mongoose from "mongoose";

const WarehouseSchema = new mongoose.Schema(
    {
        warehouseName: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
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
        manager: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        storageCapacity: {
            type: Number,
            required: true,
            min: 0,
        },
        currentUtilization: {
            type: Number,
            default: 0,
            min: 0,
            max: 100, // percentage utilization
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Warehouse", WarehouseSchema);
