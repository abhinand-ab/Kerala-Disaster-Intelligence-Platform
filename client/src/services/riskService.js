import axios from "axios";

const API = "http://localhost:5000/api/risk";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
};

export const getCurrentRisk = async () => {
    try {
        const response = await axios.get(API);
        // Return the response data directly so we can inspect summary and data
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch current risk assessments.";
    }
};

export const getDistrictRisk = async (name) => {
    try {
        const response = await axios.get(`${API}/district/${name}`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || `Failed to fetch risk for district ${name}.`;
    }
};

export const getHistoricalRisk = async (params = {}) => {
    try {
        const response = await axios.get(`${API}/history`, { params });
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch historical risk data.";
    }
};

export const getRiskHeatmapData = async () => {
    try {
        const response = await axios.get(`${API}/heatmap`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch risk heatmap data.";
    }
};

export const getRiskRecommendations = async () => {
    try {
        const response = await axios.get(`${API}/recommendations`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch risk recommendations.";
    }
};

export const recalculateRiskManually = async () => {
    try {
        const response = await axios.post(`${API}/recalculate`, {}, { headers: getAuthHeaders() });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to trigger manual risk recalculation.";
    }
};
