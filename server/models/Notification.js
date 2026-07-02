import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		title: {
			type: String,
			required: true,
			trim: true,
		},

		message: {
			type: String,
			required: true,
			trim: true,
		},

		type: {
			type: String,
			enum: ["incident", "assignment", "status", "system"],
			default: "system",
		},

		incident: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Incident",
			default: null,
		},

		isRead: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

export default mongoose.model("Notification", NotificationSchema);
