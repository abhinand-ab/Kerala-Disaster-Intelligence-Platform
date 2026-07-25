import axios from "axios";

const API = "http://localhost:5000/api/deliveries";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const getDeliveries = async () => {
    try {
        const response = await axios.get(API);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch deliveries.";
    }
};

export const getDelivery = async (id) => {
    try {
        const response = await axios.get(`${API}/${id}`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch delivery details.";
    }
};

export const createDelivery = async (data) => {
    try {
        const response = await axios.post(API, data, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to create delivery.";
    }
};

export const updateDelivery = async (id, data) => {
    try {
        const response = await axios.put(`${API}/${id}`, data, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update delivery.";
    }
};

export const deleteDelivery = async (id) => {
    try {
        const response = await axios.delete(`${API}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to delete delivery.";
    }
};
