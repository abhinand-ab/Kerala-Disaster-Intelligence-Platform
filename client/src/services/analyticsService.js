import axios from "axios";

const API = "http://localhost:5000/api/analytics";

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

const analyticsService = {
    // KPI metrics
    getDashboardMetrics: async () => {
        const { data } = await axios.get(`${API}/dashboard`, getHeaders());
        return data.data;
    },

    // Trend analysis
    getTrendAnalysis: async (days = 7) => {
        const { data } = await axios.get(`${API}/trend`, {
            ...getHeaders(),
            params: { days },
        });
        return data.data;
    },

    // District comparisons
    getDistrictComparison: async () => {
        const { data } = await axios.get(`${API}/districts`, getHeaders());
        return data.data;
    },

    // Resource allocation breakdown
    getResourceUtilization: async () => {
        const { data } = await axios.get(`${API}/resources`, getHeaders());
        return data.data;
    },

    // AI recommendation analytics
    getAIStats: async () => {
        const { data } = await axios.get(`${API}/ai-stats`, getHeaders());
        return data.data;
    },

    // Report generation URL builder (for file downloads/printing)
    getReportUrl: (params = {}) => {
        const token = localStorage.getItem("token");
        const queryParams = new URLSearchParams({
            ...params,
            token, // Pass token for potential direct template access or authorization
        }).toString();
        // Since we protect it via auth middleware, passing Authorization header is best.
        // For direct window.open download, we can pass it as query token if the server parses it,
        // or trigger axios file download (blob) which is much more secure!
        return `${API}/report?${queryParams}`;
    },

    // Download/export API via Blob (fully supports auth headers)
    downloadReport: async (params = {}) => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(`${API}/report`, {
                params,
                headers: { Authorization: `Bearer ${token}` },
                responseType: params.format === "csv" || params.format === "excel" ? "blob" : "text",
            });

            if (params.format === "pdf" || params.format === "html") {
                // Open HTML printable view in a new window/tab
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                    printWindow.document.write(response.data);
                    printWindow.document.close();
                }
                return;
            }

            // CSV/Excel download
            const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `${params.reportType}_report_${params.timeframe}_${Date.now()}.${params.format === "excel" ? "xls" : "csv"}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Report download failed:", error);
            throw error;
        }
    }
};

export default analyticsService;
