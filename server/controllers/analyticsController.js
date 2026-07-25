import * as analyticsService from "../services/analyticsService.js";
import * as reportService from "../services/reportService.js";

/**
 * GET /api/analytics/dashboard
 */
export const getDashboardMetrics = async (req, res) => {
    try {
        const metrics = await analyticsService.getDashboardMetrics();
        res.status(200).json({ success: true, data: metrics });
    } catch (error) {
        console.error("Analytics metrics error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/trend
 */
export const getTrendAnalysis = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const trend = await analyticsService.getTrendAnalysis(days);
        res.status(200).json({ success: true, data: trend });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/districts
 */
export const getDistrictComparison = async (req, res) => {
    try {
        const comparison = await analyticsService.getDistrictComparison();
        res.status(200).json({ success: true, data: comparison });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/resources
 */
export const getResourceUtilization = async (req, res) => {
    try {
        const resourceDetail = await analyticsService.getResourceUtilization();
        res.status(200).json({ success: true, data: resourceDetail });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/ai-stats
 */
export const getAIStats = async (req, res) => {
    try {
        const stats = await analyticsService.getAIRecommendationStats();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/analytics/report
 * Query params: reportType, format, timeframe, startDate, endDate, district, extraType
 */
export const generateReport = async (req, res) => {
    try {
        const { reportType, format } = req.query;

        if (!reportType || !format) {
            return res.status(400).json({ success: false, message: "reportType and format are required." });
        }

        const data = await reportService.fetchReportData(reportType, req.query);

        if (format === "csv" || format === "excel") {
            const csv = reportService.generateCSVReport(reportType, data);

            res.setHeader("Content-Type", "text/csv");
            res.setHeader("Content-Disposition", `attachment; filename=${reportType}_report_${Date.now()}.csv`);
            return res.status(200).send(csv);
        } else if (format === "pdf" || format === "html") {
            const html = reportService.generateHTMLReport(reportType, data, req.query);

            res.setHeader("Content-Type", "text/html");
            return res.status(200).send(html);
        } else {
            return res.status(400).json({ success: false, message: "Invalid format. Supported: csv, excel, pdf, html" });
        }
    } catch (error) {
        console.error("Report generation error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
