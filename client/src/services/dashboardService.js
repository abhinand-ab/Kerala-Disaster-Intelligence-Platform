import axios from "axios";

// Fetch dashboard analytics from the backend API.
export const getDashboardAnalytics = async () => {
	try {
		const token = localStorage.getItem("token");

		const response = await axios.get("http://localhost:5000/api/dashboard", {
			headers: {
				Authorization: token ? `Bearer ${token}` : undefined,
			},
		});

		return response.data.data;
	} catch (error) {
		// Prefer backend error payloads when available, otherwise surface the Axios error message.
		throw error?.response?.data?.message || error.message || "Failed to fetch dashboard analytics.";
	}
};
