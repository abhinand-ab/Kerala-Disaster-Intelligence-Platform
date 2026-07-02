import Incident from "../models/Incident.js";

export const getDashboardAnalytics = async (req, res) => {
	try {
		const [
			totalIncidents,
			activeIncidents,
			resolvedIncidents,
			criticalIncidents,
			floodIncidents,
			fireIncidents,
			medicalIncidents,
		] = await Promise.all([
			Incident.countDocuments(),
			Incident.countDocuments({
				status: {
					$in: ["Pending", "Assigned", "In Progress"],
				},
			}),
			Incident.countDocuments({ status: "Resolved" }),
			Incident.countDocuments({ severity: "Critical" }),
			Incident.countDocuments({ category: "Flood" }),
			Incident.countDocuments({ category: "Fire" }),
			Incident.countDocuments({ category: "Medical" }),
		]);

		return res.status(200).json({
			success: true,
			data: {
				totalIncidents,
				activeIncidents,
				resolvedIncidents,
				criticalIncidents,
				floodIncidents,
				fireIncidents,
				medicalIncidents,
			},
		});
	} catch (error) {
		console.error("DASHBOARD ANALYTICS ERROR:", error);

		return res.status(500).json({
			success: false,
			message: error.message,
		});
	}
};
