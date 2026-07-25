import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
            default: null
        },
        userEmail: {
            type: String,
            required: false,
            default: ""
        },
        userRole: {
            type: String,
            required: false,
            default: "guest"
        },
        action: {
            type: String,
            required: true,
            trim: true
        },
        module: {
            type: String,
            required: true,
            trim: true
        },
        targetId: {
            type: String,
            required: false,
            default: null
        },
        targetType: {
            type: String,
            required: false,
            default: null
        },
        description: {
            type: String,
            required: true
        },
        ipAddress: {
            type: String,
            required: false,
            default: ""
        },
        userAgent: {
            type: String,
            required: false,
            default: ""
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        },
        severity: {
            type: String,
            enum: ["Info", "Low", "Medium", "High", "Critical"],
            default: "Low"
        }
    },
    {
        timestamps: true
    }
);

// Optimize query performance with compound indexes
auditLogSchema.index({ module: 1, severity: 1 });
auditLogSchema.index({ user: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
