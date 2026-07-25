import axios from "axios";

const API = "http://localhost:5000/api/ai";

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

const aiService = {
    // Recommendations
    getRecommendations: async (params = {}) => {
        const { data } = await axios.get(`${API}/recommendations`, {
            ...getHeaders(),
            params,
        });
        return data;
    },

    // Predictions
    getPredictions: async () => {
        const { data } = await axios.get(`${API}/predictions`, getHeaders());
        return data;
    },

    // Risk Summary
    getRiskSummary: async () => {
        const { data } = await axios.get(`${API}/risk-summary`, getHeaders());
        return data;
    },

    // Evacuation Suggestions
    getEvacuationSuggestions: async () => {
        const { data } = await axios.get(`${API}/evacuation-suggestions`, getHeaders());
        return data;
    },

    // Resource Optimization
    getResourceOptimization: async () => {
        const { data } = await axios.get(`${API}/resource-optimization`, getHeaders());
        return data;
    },

    // Analytics
    getAnalytics: async () => {
        const { data } = await axios.get(`${API}/analytics`, getHeaders());
        return data;
    },

    // Run full analysis
    runAnalysis: async () => {
        const { data } = await axios.post(`${API}/run-analysis`, {}, getHeaders());
        return data;
    },

    // Smart assign
    smartAssign: async (targetType, targetId) => {
        const { data } = await axios.post(`${API}/smart-assign`, { targetType, targetId }, getHeaders());
        return data;
    },

    // Accept recommendation
    acceptRecommendation: async (id) => {
        const { data } = await axios.patch(`${API}/recommendations/${id}/accept`, {}, getHeaders());
        return data;
    },

    // Reject recommendation
    rejectRecommendation: async (id) => {
        const { data } = await axios.patch(`${API}/recommendations/${id}/reject`, {}, getHeaders());
        return data;
    },
};

export default aiService;
