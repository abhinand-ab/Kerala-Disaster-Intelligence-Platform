import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = `${API_BASE_URL}/api/public`;

export const getPublicDashboard = async () => {
    try {
        const response = await axios.get(`${API}/dashboard`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch public dashboard summary.";
    }
};

export const getPublicShelters = async (params = {}) => {
    try {
        const response = await axios.get(`${API}/shelters`, { params });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch shelters list.";
    }
};

export const getPublicIncidents = async (params = {}) => {
    try {
        const response = await axios.get(`${API}/incidents`, { params });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch verified incidents.";
    }
};

export const getPublicWeather = async (params = {}) => {
    try {
        const response = await axios.get(`${API}/weather`, { params });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch weather status.";
    }
};

export const getPublicAlerts = async () => {
    try {
        const response = await axios.get(`${API}/alerts`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch active alerts.";
    }
};

export const getEmergencyContacts = async () => {
    try {
        const response = await axios.get(`${API}/emergency-contacts`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch emergency contacts.";
    }
};

export const getFAQs = async () => {
    try {
        const response = await axios.get(`${API}/faqs`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch FAQs.";
    }
};

export const getSafeRoutes = async () => {
    try {
        const response = await axios.get(`${API}/safe-routes`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch safe routes hazards data.";
    }
};

export const getPublicRiskAssessments = async (params = {}) => {
    try {
        const response = await axios.get(`${API}/risk`, { params });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch risk assessments.";
    }
};
