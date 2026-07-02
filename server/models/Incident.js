import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Flood",
        "Fire",
        "Landslide",
        "Road Block",
        "Medical",
        "Rescue",
        "Accident",
        "Other",
      ],
      required: true,
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },

    location: {
      district: {
        type: String,
        required: true,
      },

      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },

      address: {
        type: String,
        default: "",
      },
    },

    images: [
      {
        type: String,
      },
    ],

    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "Reported",
        "Verified",
        "Assigned",
        "Resolved",
        "Rejected",
      ],
      default: "Reported",
    },

    verificationStatus: {
      type: Boolean,
      default: false,
    },

    priorityScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Incident", incidentSchema);