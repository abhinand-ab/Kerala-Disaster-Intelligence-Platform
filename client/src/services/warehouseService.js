import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = `${API_BASE_URL}/api/warehouses`;

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const getWarehouses = async () => {
    try {
        const response = await axios.get(API);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch warehouses.";
    }
};

export const getWarehouse = async (id) => {
    try {
        const response = await axios.get(`${API}/${id}`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch warehouse details.";
    }
};

export const createWarehouse = async (data) => {
    try {
        const response = await axios.post(API, data, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to create warehouse.";
    }
};

export const updateWarehouse = async (id, data) => {
    try {
        const response = await axios.put(`${API}/${id}`, data, { headers: getAuthHeaders() });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update warehouse.";
    }
};

export const deleteWarehouse = async (id) => {
    try {
        const response = await axios.delete(`${API}/${id}`, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to delete warehouse.";
    }
};
