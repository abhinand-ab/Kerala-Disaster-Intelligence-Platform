import AIRecommendation from "../models/AIRecommendation.js";
import {
    runFullAnalysis,
    generatePredictions,
    generateSmartAssignment,
    getRiskSummary,
    getResourceOptimization,
} from "../services/aiDecisionEngine.js";

/**
 * GET /api/ai/recommendations
 * Fetch recommendations with optional filters
 */
export const getRecommendations = async (req, res) => {
    try {
        const { status, type, priority, district, limit = 50 } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (type) filter.recommendationType = type;
        if (priority) filter.priority = priority;
        if (district) filter.district = district;

        const recommendations = await AIRecommendation.find(filter)
            .sort({ generatedAt: -1 })
            .limit(parseInt(limit))
            .populate("relatedIncident", "title category severity")
            .populate("relatedShelter", "name district")
            .populate("relatedVehicle", "vehicleNumber vehicleType")
            .populate("relatedTeam", "teamName specialization")
            .populate("relatedWarehouse", "name")
            .populate("acceptedBy", "name email");

        // Summary stats
        const stats = {
            total: recommendations.length,
            pending: recommendations.filter((r) => r.status === "Pending").length,
            accepted: recommendations.filter((r) => r.status === "Accepted").length,
            critical: recommendations.filter((r) => r.priority === "Critical").length,
            avgConfidence: recommendations.length > 0
                ? Math.round(recommendations.reduce((sum, r) => sum + r.confidenceScore, 0) / recommendations.length)
                : 0,
        };

        res.status(200).json({ success: true, stats, data: recommendations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/ai/predictions
 * Run predictive analysis and return forecasts
 */
export const getPredictions = async (req, res) => {
    try {
        const predictions = await generatePredictions();
        res.status(200).json({ success: true, count: predictions.length, data: predictions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/ai/risk-summary
 * Comprehensive district risk summary
 */
export const getAIRiskSummary = async (req, res) => {
    try {
        const summary = await getRiskSummary();
        res.status(200).json({ success: true, count: summary.length, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/ai/evacuation-suggestions
 * Get current evacuation shelter recommendations
 */
export const getEvacuationSuggestions = async (req, res) => {
    try {
        const recs = await AIRecommendation.find({
            recommendationType: "EvacuationShelter",
            status: "Pending",
        })
            .sort({ confidenceScore: -1 })
            .limit(20)
            .populate("relatedShelter", "name district latitude longitude capacity currentOccupancy");

        res.status(200).json({ success: true, count: recs.length, data: recs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/ai/resource-optimization
 * Resource distribution and optimization analysis
 */
export const getResourceOptimizationData = async (req, res) => {
    try {
        const optimization = await getResourceOptimization();
        res.status(200).json({ success: true, data: optimization });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/ai/run-analysis
 * Trigger full AI analysis pipeline (admin only)
 */
export const triggerFullAnalysis = async (req, res) => {
    try {
        const result = await runFullAnalysis();
        res.status(200).json({
            success: true,
            message: "AI analysis pipeline completed successfully.",
            data: result,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/ai/smart-assign
 * Generate smart assignment for a specific incident or SOS
 */
export const triggerSmartAssignment = async (req, res) => {
    try {
        const { targetType, targetId } = req.body;
        if (!targetType || !targetId) {
            return res.status(400).json({ success: false, message: "targetType and targetId are required." });
        }

        const recs = await generateSmartAssignment(targetType, targetId);
        res.status(200).json({
            success: true,
            message: `Smart assignment generated: ${recs.length} recommendations.`,
            count: recs.length,
            data: recs,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /api/ai/recommendations/:id/accept
 * Accept/Approve a recommendation
 */
export const acceptRecommendation = async (req, res) => {
    try {
        const rec = await AIRecommendation.findById(req.params.id);
        if (!rec) return res.status(404).json({ success: false, message: "Recommendation not found." });

        rec.status = "Accepted";
        rec.acceptedBy = req.user._id;
        await rec.save();

        res.status(200).json({ success: true, message: "Recommendation accepted.", data: rec });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PATCH /api/ai/recommendations/:id/reject
 * Reject a recommendation
 */
export const rejectRecommendation = async (req, res) => {
    try {
        const rec = await AIRecommendation.findById(req.params.id);
        if (!rec) return res.status(404).json({ success: false, message: "Recommendation not found." });

        rec.status = "Rejected";
        await rec.save();

        res.status(200).json({ success: true, message: "Recommendation rejected.", data: rec });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /api/ai/analytics
 * AI reporting analytics (Step 13)
 */
export const getAIAnalytics = async (req, res) => {
    try {
        const total = await AIRecommendation.countDocuments();
        const accepted = await AIRecommendation.countDocuments({ status: "Accepted" });
        const rejected = await AIRecommendation.countDocuments({ status: "Rejected" });
        const pending = await AIRecommendation.countDocuments({ status: "Pending" });
        const expired = await AIRecommendation.countDocuments({ status: "Expired" });

        const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

        // By type distribution
        const byType = await AIRecommendation.aggregate([
            { $group: { _id: "$recommendationType", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // By district distribution
        const byDistrict = await AIRecommendation.aggregate([
            { $group: { _id: "$district", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Average confidence by type
        const confidenceByType = await AIRecommendation.aggregate([
            { $group: { _id: "$recommendationType", avgConfidence: { $avg: "$confidenceScore" } } },
        ]);

        // Recent trend (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
        const recentTrend = await AIRecommendation.aggregate([
            { $match: { generatedAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$generatedAt" } },
                    count: { $sum: 1 },
                    accepted: { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        res.status(200).json({
            success: true,
            data: {
                overview: { total, accepted, rejected, pending, expired, acceptanceRate },
                byType,
                byDistrict,
                confidenceByType,
                recentTrend,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
