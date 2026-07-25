import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = `${API_BASE_URL}/api/rescue-teams`;

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        Authorization: `Bearer ${token}`,
    };
};

export const getRescueTeams = async () => {
    try {
        const response = await axios.get(API, {
            headers: getAuthHeaders(),
        });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch rescue teams.";
    }
};

export const getRescueTeam = async (id) => {
    try {
        const response = await axios.get(`${API}/${id}`, {
            headers: getAuthHeaders(),
        });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch rescue team.";
    }
};

export const createRescueTeam = async (data) => {
    try {
        const response = await axios.post(API, data, {
            headers: getAuthHeaders(),
        });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to create rescue team.";
    }
};

export const updateRescueTeam = async (id, data) => {
    try {
        const response = await axios.put(`${API}/${id}`, data, {
            headers: getAuthHeaders(),
        });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update rescue team.";
    }
};

export const deleteRescueTeam = async (id) => {
    try {
        const response = await axios.delete(`${API}/${id}`, {
            headers: getAuthHeaders(),
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to delete rescue team.";
    }
};

export const addTeamMember = async (id, volunteerId) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/members/add`,
            { volunteerId },
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to add member to team.";
    }
};

export const removeTeamMember = async (id, volunteerId) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/members/remove`,
            { volunteerId },
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to remove member from team.";
    }
};

export const assignTeamToIncident = async (id, incidentId) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/assign-incident`,
            { incidentId },
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to assign team to incident.";
    }
};

export const assignTeamToVehicle = async (id, vehicleId) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/assign-vehicle`,
            { vehicleId },
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to assign team to vehicle.";
    }
};

export const updateTeamStatus = async (id, status) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/status`,
            { status },
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update team status.";
    }
};
