import axios from "axios";

export const getVolunteers = async () => {
	try {
		const token = localStorage.getItem("token");

		const response = await axios.get(
			"http://localhost:5000/api/users/volunteers",
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);

		return response.data.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message;
	}
};
