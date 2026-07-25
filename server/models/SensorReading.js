import mongoose from "mongoose";

const SensorReadingSchema = new mongoose.Schema(
    {
        sensor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Sensor",
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            required: true,
        },
        waterLevel: {
            type: Number,
            default: null,
        },
        rainfall: {
            type: Number,
            default: null,
        },
        temperature: {
            type: Number,
            default: null,
        },
        humidity: {
            type: Number,
            default: null,
        },
        riverFlow: {
            type: Number,
            default: null,
        },
        waterVelocity: {
            type: Number,
            default: null,
        },
        pressure: {
            type: Number,
            default: null,
        },
        battery: {
            type: Number,
            default: 100,
        },
    },
    {
        timestamps: false, // Turn off default Mongoose timestamps since we track customized sensor timestamp field
    }
);

SensorReadingSchema.index({ sensor: 1, timestamp: -1 });

export default mongoose.model("SensorReading", SensorReadingSchema);
