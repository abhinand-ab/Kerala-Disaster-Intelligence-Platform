import mongoose from "mongoose";

const ResourceSchema = new mongoose.Schema(
    {
        resourceName: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            enum: ["Food", "Water", "Medical", "Clothing", "Bedding", "Tools", "Other"],
            required: true,
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
        warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true,
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
        minimumStock: {
            type: Number,
            default: 10,
            min: 0,
        },
        expiryDate: {
            type: Date,
            default: null,
        },
        supplier: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: ["Available", "Low Stock", "Out of Stock"],
            default: "Available",
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

ResourceSchema.pre("save", function () {
    if (this.quantity === 0) {
        this.status = "Out of Stock";
    } else if (this.quantity <= this.minimumStock) {
        this.status = "Low Stock";
    } else {
        this.status = "Available";
    }
});

export default mongoose.model("Resource", ResourceSchema);
