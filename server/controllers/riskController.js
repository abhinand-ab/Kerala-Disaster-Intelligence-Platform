import RiskAssessment from "../models/RiskAssessment.js";
import { updateAllDistrictsRisk, DISTRICT_RISK_METADATA } from "../services/riskEngine.js";

// Helper to ensure risk data exists
const ensureRiskDataExists = async () => {
    const count = await RiskAssessment.estimatedDocumentCount();
    if (count === 0) {
        console.log("No risk assessment data found. Executing risk evaluation engine...");
        await updateAllDistrictsRisk();
    }
};

/**
 * Get Current Risk (All Districts)
 * GET /api/risk
 */
export const getCurrentRisk = async (req, res) => {
    try {
        await ensureRiskDataExists();

        const latestAssessments = await Promise.all(
            Object.keys(DISTRICT_RISK_METADATA).map(async (name) => {
                return RiskAssessment.findOne({ district: name }).sort({ createdAt: -1 });
            })
        );

        const data = latestAssessments.filter(Boolean);

        // Calculate metadata
        const highRiskCount = data.filter((a) => a.riskLevel === "High" || a.riskLevel === "Extreme").length;
        const avgRiskScore = data.length > 0 ? data.reduce((acc, current) => acc + current.riskScore, 0) / data.length : 0;

        res.status(200).json({
            success: true,
            count: data.length,
            summary: {
                totalDistricts: Object.keys(DISTRICT_RISK_METADATA).length,
                highRiskCount,
                avgRiskScore: parseFloat(avgRiskScore.toFixed(1)),
                extremeDistricts: data.filter((a) => a.riskLevel === "Extreme").map((a) => a.district),
                highDistricts: data.filter((a) => a.riskLevel === "High").map((a) => a.district),
            },
            data,
        });
    } catch (error) {
        console.error("GET CURRENT RISK ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get Single District Risk Assessment
 * GET /api/risk/district/:name
 */
export const getDistrictRisk = async (req, res) => {
    try {
        await ensureRiskDataExists();
        const { name } = req.params;

        // Direct case-insensitive search
        const data = await RiskAssessment.findOne({
            district: { $regex: new RegExp(`^${name}$`, "i") },
        }).sort({ createdAt: -1 });

        if (!data) {
            return res.status(404).json({
                success: false,
                message: `Risk assessment data for district '${name}' not found.`,
            });
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("GET DISTRICT RISK ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get Historical Risk (Trends)
 * GET /api/risk/history
 */
export const getHistoricalRisk = async (req, res) => {
    try {
        await ensureRiskDataExists();
        const { district, limit = 100, days = 7 } = req.query;

        const query = {};
        if (district) {
            query.district = { $regex: new RegExp(`^${district}$`, "i") };
        }

        const rangeDate = new Date();
        rangeDate.setDate(rangeDate.getDate() - parseInt(days));
        query.createdAt = { $gte: rangeDate };

        const history = await RiskAssessment.find(query)
            .sort({ createdAt: 1 })
            .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            count: history.length,
            data: history,
        });
    } catch (error) {
        console.error("GET HISTORICAL RISK ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get Risk Heatmap Data
 * GET /api/risk/heatmap
 */
export const getRiskHeatmapData = async (req, res) => {
    try {
        await ensureRiskDataExists();

        const latest = await Promise.all(
            Object.keys(DISTRICT_RISK_METADATA).map(async (name) => {
                return RiskAssessment.findOne({ district: name })
                    .sort({ createdAt: -1 })
                    .select("district latitude longitude riskScore riskLevel riskType");
            })
        );

        const data = latest.filter(Boolean).map((a) => ({
            district: a.district,
            latitude: a.latitude,
            longitude: a.longitude,
            riskScore: a.riskScore,
            riskLevel: a.riskLevel,
            riskType: a.riskType,
        }));

        res.status(200).json({
            success: true,
            count: data.length,
            data,
        });
    } catch (error) {
        console.error("GET RISK HEATMAP ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Get Risk Recommendations (grouped or filtered)
 * GET /api/risk/recommendations
 */
export const getRiskRecommendations = async (req, res) => {
    try {
        await ensureRiskDataExists();

        const latest = await Promise.all(
            Object.keys(DISTRICT_RISK_METADATA).map(async (name) => {
                return RiskAssessment.findOne({ district: name })
                    .sort({ createdAt: -1 })
                    .select("district riskScore riskLevel riskType recommendations");
            })
        );

        const assessments = latest.filter(Boolean);
        const highRiskRecs = assessments
            .filter((a) => a.riskLevel === "High" || a.riskLevel === "Extreme")
            .map((a) => ({
                district: a.district,
                riskScore: a.riskScore,
                riskLevel: a.riskLevel,
                riskType: a.riskType,
                recommendations: a.recommendations,
            }));

        res.status(200).json({
            success: true,
            count: highRiskRecs.length,
            data: {
                highRiskRecommendations: highRiskRecs,
                allRecommendations: assessments.map((a) => ({
                    district: a.district,
                    riskLevel: a.riskLevel,
                    recommendations: a.recommendations,
                })),
            },
        });
    } catch (error) {
        console.error("GET RISK RECOMMENDATIONS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * Admin-triggered manual risk recalculation
 * POST /api/risk/recalculate
 */
export const recalculateRiskManually = async (req, res) => {
    try {
        const data = await updateAllDistrictsRisk();
        res.status(200).json({
            success: true,
            message: "Risk parameters computed for all districts successfully.",
            count: data.length,
            data,
        });
    } catch (error) {
        console.error("MANUAL RISK RECALCULATION ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
