import axios from "axios";

const API = "http://localhost:5000/api/resources";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const getResources = async () => {
    try {
        const response = await axios.get(API);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch resources.";
    }
};

export const getResource = async (id) => {
    try {
        const response = await axios.get(`${API}/${id}`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch resource details.";
    }
};

export const createResource = async (data) => {
    try {
        const response = await axios.post(API, data, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to create resource.";
    }
};

export const updateResource = async (id, data) => {
    try {
        const response = await axios.put(`${API}/${id}`, data, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update resource.";
    }
};

export const deleteResource = async (id) => {
    try {
        const response = await axios.delete(`${API}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to delete resource.";
    }
};
