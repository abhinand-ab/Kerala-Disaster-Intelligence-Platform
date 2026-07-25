import axios from "axios";
import { API_BASE_URL } from "../../../config/api";

export const getVolunteers = async () => {
	try {
		const token = localStorage.getItem("token");

		const response = await axios.get(
			`${API_BASE_URL}/api/users/volunteers`,
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
