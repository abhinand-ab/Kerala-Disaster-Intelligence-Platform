import User from "../models/User.js";

export const getVolunteers = async (req, res) => {
	try {
		const data = await User.find({
			role: "volunteer",
			isActive: true,
		})
			.select("_id name district email")
			.sort({ name: 1 });

		res.status(200).json({
			success: true,
			count: data.length,
			data,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server Error",
		});
	}
};

export const updateProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found.",
			});
		}

		const { name, phone, district } = req.body;

		if (name !== undefined) {
			user.name = name;
		}

		if (phone !== undefined) {
			user.phone = phone;
		}

		if (district !== undefined) {
			user.district = district;
		}

		await user.save();

		res.status(200).json({
			success: true,
			message: "Profile updated successfully.",
			user,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server Error",
		});
	}
};
