import Shelter from "../models/Shelter.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";
import { logActivity } from "../services/activityLogger.js";

const emitShelterSocketEvent = (eventName, payload) => {
	try {
		const io = getSocketIO();
		io.emit(eventName, payload);
	} catch (socketError) {
		console.warn("Socket.IO broadcast skipped:");
		console.warn(socketError.message);
	}
};

const createAndEmitNotification = async ({
	user,
	title,
	message,
	type = "system",
}) => {
	try {
		const notification = await Notification.create({
			user,
			title,
			message,
			type,
		});

		try {
			const io = getSocketIO();
			io.to(user.toString()).emit("notificationCreated", notification);
		} catch (socketError) {
			console.warn("Notification socket emit skipped:");
			console.warn(socketError.message);
		}

		return notification;
	} catch (notificationError) {
		console.warn("Notification creation skipped:");
		console.warn(notificationError.message);

		return null;
	}
};

/*
=========================================
Create Shelter
POST /api/shelters
=========================================
*/
export const createShelter = async (req, res) => {
	try {
		const shelter = await Shelter.create({
			...req.body,
			createdBy: req.user._id,
		});

		const admins = await User.find({ role: "admin" }).select("_id");

		await Promise.all(
			admins.map((admin) =>
				createAndEmitNotification({
					user: admin._id,
					title: "New Shelter Added",
					message: `A new shelter has been added: ${shelter.name}`,
				})
			)
		);

		emitShelterSocketEvent("shelterCreated", shelter);

		logActivity({
			userId: req.user?._id || req.user?.id,
			userEmail: req.user?.email || "",
			userRole: req.user?.role || "guest",
			action: "Create Shelter",
			module: "Shelter",
			targetId: shelter._id.toString(),
			targetType: "Shelter",
			description: `Created new shelter: "${shelter.name}" with capacity ${shelter.capacity}`,
			ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
			userAgent: req.headers["user-agent"] || "",
			severity: "Low"
		}).catch(err => console.error("Audit log creation error:", err));

		res.status(201).json({
			success: true,
			message: "Shelter created successfully.",
			data: shelter,
		});
	} catch (error) {
		console.error("CREATE SHELTER ERROR:");
		console.error(error);

		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

/*
=========================================
Get All Shelters
GET /api/shelters
=========================================
*/
export const getShelters = async (req, res) => {
	try {
		const shelters = await Shelter.find()
			.populate("createdBy", "name email role")
			.sort({ createdAt: -1 });

		res.status(200).json({
			success: true,
			count: shelters.length,
			data: shelters,
		});
	} catch (error) {
		console.error(error);

		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

/*
=========================================
Get Single Shelter
GET /api/shelters/:id
=========================================
*/
export const getShelterById = async (req, res) => {
	try {
		const shelter = await Shelter.findById(req.params.id).populate(
			"createdBy",
			"name email role"
		);

		if (!shelter) {
			return res.status(404).json({
				success: false,
				message: "Shelter not found.",
			});
		}

		res.status(200).json({
			success: true,
			data: shelter,
		});
	} catch (error) {
		console.error(error);

		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

/*
=========================================
Update Shelter
PUT /api/shelters/:id
=========================================
*/
export const updateShelter = async (req, res) => {
	try {
		const shelter = await Shelter.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
			runValidators: true,
		}).populate("createdBy", "name email role");

		if (!shelter) {
			return res.status(404).json({
				success: false,
				message: "Shelter not found.",
			});
		}

		const admins = await User.find({ role: "admin" }).select("_id");

		await Promise.all(
			admins.map((admin) =>
				createAndEmitNotification({
					user: admin._id,
					title: "Shelter Updated",
					message: `Shelter details have been updated: ${shelter.name}`,
				})
			)
		);

		emitShelterSocketEvent("shelterUpdated", shelter);

		logActivity({
			userId: req.user?._id || req.user?.id,
			userEmail: req.user?.email || "",
			userRole: req.user?.role || "guest",
			action: "Update Shelter",
			module: "Shelter",
			targetId: shelter._id.toString(),
			targetType: "Shelter",
			description: `Updated shelter details for: "${shelter.name}"`,
			ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
			userAgent: req.headers["user-agent"] || "",
			severity: "Low"
		}).catch(err => console.error("Audit log creation error:", err));

		res.status(200).json({
			success: true,
			message: "Shelter updated successfully.",
			data: shelter,
		});
	} catch (error) {
		console.error(error);

		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

/*
=========================================
Delete Shelter
DELETE /api/shelters/:id
=========================================
*/
export const deleteShelter = async (req, res) => {
	try {
		const shelter = await Shelter.findById(req.params.id);

		if (!shelter) {
			return res.status(404).json({
				success: false,
				message: "Shelter not found.",
			});
		}

		await shelter.deleteOne();

		const admins = await User.find({ role: "admin" }).select("_id");

		await Promise.all(
			admins.map((admin) =>
				createAndEmitNotification({
					user: admin._id,
					title: "Shelter Removed",
					message: `Shelter removed: ${shelter.name}`,
				})
			)
		);

		emitShelterSocketEvent("shelterDeleted", shelter._id);

		logActivity({
			userId: req.user?._id || req.user?.id,
			userEmail: req.user?.email || "",
			userRole: req.user?.role || "guest",
			action: "Delete Shelter",
			module: "Shelter",
			targetId: shelter._id.toString(),
			targetType: "Shelter",
			description: `Removed shelter: "${shelter.name}"`,
			ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
			userAgent: req.headers["user-agent"] || "",
			severity: "Medium"
		}).catch(err => console.error("Audit log creation error:", err));

		res.status(200).json({
			success: true,
			message: "Shelter deleted successfully.",
		});
	} catch (error) {
		console.error(error);

		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};

/*
=========================================
Update Shelter Occupancy
PATCH /api/shelters/:id/occupancy
=========================================
*/
export const updateOccupancy = async (req, res) => {
	try {
		const { occupancy } = req.body;

		const shelter = await Shelter.findById(req.params.id);

		if (!shelter) {
			return res.status(404).json({
				success: false,
				message: "Shelter not found.",
			});
		}

		const previousOccupancy = shelter.occupancy;
		shelter.occupancy = occupancy;

		await shelter.save();

		const admins = await User.find({ role: "admin" }).select("_id");

		await Promise.all(
			admins.map((admin) =>
				createAndEmitNotification({
					user: admin._id,
					title: "Shelter Occupancy Updated",
					message: `Occupancy updated for ${shelter.name}: ${shelter.occupancy}/${shelter.capacity}`,
				})
			)
		);

		if (previousOccupancy < shelter.capacity && shelter.occupancy >= shelter.capacity) {
			await Promise.all(
				admins.map((admin) =>
					createAndEmitNotification({
						user: admin._id,
						title: "Shelter Full",
						message: `${shelter.name} has reached full capacity.`,
					})
				)
			);

			emitShelterSocketEvent("evacuationNotice", {
				type: "Shelter Full Alert",
				title: "Shelter Reached Capacity",
				message: `Shelter "${shelter.name}" in ${shelter.district} has reached maximum occupancy (${shelter.occupancy}/${shelter.capacity}). If you are evacuating, please find alternate shelters.`,
				district: shelter.district,
				shelterId: shelter._id,
				timestamp: new Date()
			});
		}

		emitShelterSocketEvent("occupancyUpdated", shelter);

		res.status(200).json({
			success: true,
			message: "Shelter occupancy updated successfully.",
			data: shelter,
		});
	} catch (error) {
		console.error(error);

		res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
