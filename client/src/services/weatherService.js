import axios from "axios";

const API = "http://localhost:5000/api/weather";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const getCurrentWeather = async () => {
  try {
    const response = await axios.get(API);
    return response.data.data;
  } catch (error) {
    throw error?.response?.data?.message || error.message || "Failed to fetch current weather.";
  }
};

export const getDistrictWeather = async (name) => {
  try {
    const response = await axios.get(`${API}/district/${name}`);
    return response.data.data;
  } catch (error) {
    throw error?.response?.data?.message || error.message || `Failed to fetch weather for ${name}.`;
  }
};

export const getForecast = async (name) => {
  try {
    const response = await axios.get(`${API}/district/${name}/forecast`);
    return response.data.data;
  } catch (error) {
    throw error?.response?.data?.message || error.message || `Failed to fetch forecast for ${name}.`;
  }
};

export const getActiveAlerts = async () => {
  try {
    const response = await axios.get(`${API}/alerts`);
    return response.data.data;
  } catch (error) {
    throw error?.response?.data?.message || error.message || "Failed to fetch weather alerts.";
  }
};

export const getWeatherSummary = async () => {
  try {
    const response = await axios.get(`${API}/summary`);
    return response.data.data;
  } catch (error) {
    throw error?.response?.data?.message || error.message || "Failed to fetch weather summary.";
  }
};

export const getWeatherHistory = async (params = {}) => {
  try {
    const response = await axios.get(`${API}/history`, { params });
    return response.data.data;
  } catch (error) {
    throw error?.response?.data?.message || error.message || "Failed to fetch weather history.";
  }
};

export const triggerManualSync = async () => {
  try {
    const response = await axios.post(`${API}/sync`, {}, { headers: getAuthHeaders() });
    return response.data.data;
  } catch (error) {
    throw error?.response?.data?.message || error.message || "Failed to trigger weather sync.";
  }
};