import axios from "axios";

const API = "http://localhost:5000/api/vehicles";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const getVehicles = async () => {
    try {
        const response = await axios.get(API, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch vehicles.";
    }
};

export const getVehicle = async (id) => {
    try {
        const response = await axios.get(`${API}/${id}`, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch vehicle details.";
    }
};

export const createVehicle = async (data) => {
    try {
        const response = await axios.post(API, data, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to create vehicle.";
    }
};

export const updateVehicle = async (id, data) => {
    try {
        const response = await axios.put(`${API}/${id}`, data, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update vehicle.";
    }
};

export const deleteVehicle = async (id) => {
    try {
        const response = await axios.delete(`${API}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to delete vehicle.";
    }
};

export const assignVehicle = async (id, incidentId) => {
    try {
        const response = await axios.put(`${API}/${id}/assign`, { incidentId }, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to assign vehicle.";
    }
};

export const updateVehicleStatus = async (id, status, currentMission) => {
    try {
        const response = await axios.put(`${API}/${id}/status`, { status, currentMission }, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update vehicle status.";
    }
};

export const updateLiveLocation = async (id, latitude, longitude) => {
    try {
        const response = await axios.put(`${API}/${id}/location`, { latitude, longitude }, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update vehicle coordinate tracking.";
    }
};

export const markMissionComplete = async (id) => {
    try {
        const response = await axios.put(`${API}/${id}/complete`, {}, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to mark mission as complete.";
    }
};
