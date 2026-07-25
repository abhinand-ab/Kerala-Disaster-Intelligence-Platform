import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = `${API_BASE_URL}/api/sensors`;

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const getSensors = async (params = {}) => {
    try {
        const response = await axios.get(API, { ...getHeaders(), params });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch sensors.";
    }
};

export const getSensorById = async (sensorId) => {
    try {
        const response = await axios.get(`${API}/${sensorId}`, getHeaders());
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch sensor details.";
    }
};

export const getSensorHistory = async (sensorId, limit = 30) => {
    try {
        const response = await axios.get(`${API}/${sensorId}/history`, {
            ...getHeaders(),
            params: { limit },
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch sensor readings history.";
    }
};

export const getSensorAnalytics = async () => {
    try {
        const response = await axios.get(`${API}/analytics`, getHeaders());
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to retrieve sensor analytics.";
    }
};

export const registerSensor = async (sensorData) => {
    try {
        const response = await axios.post(API, sensorData, getHeaders());
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to register sensor.";
    }
};

export const deleteSensor = async (sensorId) => {
    try {
        const response = await axios.delete(`${API}/${sensorId}`, getHeaders());
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to delete sensor.";
    }
};

export const updateSensorReading = async (sensorId, readingData) => {
    try {
        const response = await axios.post(`${API}/${sensorId}/reading`, readingData);
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to submit telemetry telemetry reading.";
    }
};
