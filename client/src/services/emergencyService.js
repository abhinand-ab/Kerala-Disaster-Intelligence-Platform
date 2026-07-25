import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = `${API_BASE_URL}/api/emergency`;

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const submitSOS = async (data) => {
    try {
        const response = await axios.post(`${API}/sos`, data);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to submit SOS.";
    }
};

export const trackRequestByPhone = async (phone) => {
    try {
        const response = await axios.get(`${API}/track/${phone}`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to find tracking records.";
    }
};

export const getEmergencyRequests = async (params = {}) => {
    try {
        const response = await axios.get(`${API}/requests`, {
            params,
            headers: getAuthHeaders(),
        });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch emergency requests.";
    }
};

export const getEmergencyRequestById = async (id) => {
    try {
        const response = await axios.get(`${API}/requests/${id}`, {
            headers: getAuthHeaders(),
        });
        return response.data; // Returns { success, data, suggestions }
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch SOS request details.";
    }
};

export const updateEmergencyRequest = async (id, data) => {
    try {
        const response = await axios.put(`${API}/requests/${id}`, data, {
            headers: getAuthHeaders(),
        });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update emergency request.";
    }
};

export const assignResponders = async (id, assignments) => {
    try {
        const response = await axios.patch(`${API}/requests/${id}/assign`, assignments, {
            headers: getAuthHeaders(),
        });
        return response.data.data;
    } catch (error) {
        throw (
            error?.response?.data?.message ||
            error.message ||
            "Failed to update emergency responder assignments."
        );
    }
};

export const changeRequestStatus = async (id, status) => {
    try {
        const response = await axios.patch(
            `${API}/requests/${id}/status`,
            { status },
            { headers: getAuthHeaders() }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update emergency status.";
    }
};

export const getEmergencyAnalytics = async () => {
    try {
        const response = await axios.get(`${API}/analytics`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch emergency analytics.";
    }
};
