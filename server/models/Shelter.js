import mongoose from "mongoose";

const ShelterSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
		},

		district: {
			type: String,
			required: true,
			trim: true,
		},

		address: {
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

		capacity: {
			type: Number,
			required: true,
			min: 0,
		},

		occupancy: {
			type: Number,
			default: 0,
			min: 0,
		},

		availableBeds: {
			type: Number,
			default: 0,
		},

		foodAvailable: {
			type: Boolean,
			default: true,
		},

		waterAvailable: {
			type: Boolean,
			default: true,
		},

		medicalSupport: {
			type: Boolean,
			default: false,
		},

		contactPerson: {
			type: String,
			required: true,
			trim: true,
		},

		phone: {
			type: String,
			required: true,
			trim: true,
		},

		status: {
			type: String,
			enum: ["Open", "Full", "Closed"],
			default: "Open",
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

// Automatically calculate available beds
// Mongoose 9+ removed the next() callback — middleware is now sync/async, no next parameter.
ShelterSchema.pre("save", function () {
	this.availableBeds = Math.max(this.capacity - this.occupancy, 0);

	if (this.occupancy >= this.capacity) {
		this.status = "Full";
	} else if (this.status !== "Closed") {
		this.status = "Open";
	}
});

export default mongoose.model("Shelter", ShelterSchema);