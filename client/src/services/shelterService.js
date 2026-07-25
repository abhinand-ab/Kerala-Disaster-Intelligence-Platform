import axios from "axios";

const API = "http://localhost:5000/api/shelters";

const getAuthHeaders = () => {
	const token = localStorage.getItem("token");

	return {
		Authorization: `Bearer ${token}`,
	};
};

export const getShelters = async () => {
	try {
		const response = await axios.get(API, {
			headers: getAuthHeaders(),
		});

		return response.data.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to fetch shelters.";
	}
};

export const getShelter = async (id) => {
	try {
		const response = await axios.get(`${API}/${id}`, {
			headers: getAuthHeaders(),
		});

		return response.data.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to fetch shelter.";
	}
};

export const createShelter = async (data) => {
	try {
		const response = await axios.post(API, data, {
			headers: getAuthHeaders(),
		});

		return response.data.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to create shelter.";
	}
};

export const updateShelter = async (id, data) => {
	try {
		const response = await axios.put(`${API}/${id}`, data, {
			headers: getAuthHeaders(),
		});

		return response.data.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to update shelter.";
	}
};

export const deleteShelter = async (id) => {
	try {
		const response = await axios.delete(`${API}/${id}`, {
			headers: getAuthHeaders(),
		});

		return response.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to delete shelter.";
	}
};

export const updateOccupancy = async (id, occupancy) => {
	try {
		const response = await axios.patch(
			`${API}/${id}/occupancy`,
			{ occupancy },
			{
				headers: getAuthHeaders(),
			}
		);

		return response.data.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to update shelter occupancy.";
	}
};
