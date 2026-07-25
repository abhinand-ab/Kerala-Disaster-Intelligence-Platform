import axios from "axios";
import { API_BASE_URL } from "../config/api";

const API = `${API_BASE_URL}/api/audit`;

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        Authorization: `Bearer ${token}`,
    };
};

export const getAuditLogs = async (params = {}) => {
    try {
        const response = await axios.get(API, {
            headers: getAuthHeaders(),
            params
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch audit logs.";
    }
};

export const getSecurityEvents = async (params = {}) => {
    try {
        const response = await axios.get(`${API}/security`, {
            headers: getAuthHeaders(),
            params
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch security events.";
    }
};

export const getUserHistory = async (userId, params = {}) => {
    try {
        const response = await axios.get(`${API}/user/${userId}`, {
            headers: getAuthHeaders(),
            params
        });
        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch user logs history.";
    }
};

/**
 * Download exported audit logs file using authentication headers
 */
export const downloadAuditLogsExport = async (params = {}) => {
    try {
        const { format = "csv", ...rest } = params;
        const response = await axios.get(`${API}/export`, {
            headers: getAuthHeaders(),
            params: { format, ...rest },
            responseType: "blob"
        });

        // Create an anchor node to trigger browser save dialog
        const blob = new Blob([response.data], {
            type: format === "json" ? "application/json" : "text/csv"
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `kerala_disaster_audit_logs.${format}`);
        document.body.appendChild(link);
        link.click();

        // Cleanup resources
        link.remove();
        window.URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to export audit logs.";
    }
};
