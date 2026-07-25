import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";

/**
 * GET /api/audit
 * Fetch and filter audit logs with pagination
 */
export const getAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 25,
            module,
            severity,
            userEmail,
            action,
            search,
            startDate,
            endDate
        } = req.query;

        const query = {};

        // Apply filters
        if (module) {
            query.module = module;
        }

        if (severity) {
            query.severity = severity;
        }

        if (userEmail) {
            query.userEmail = { $regex: userEmail, $options: "i" };
        }

        if (action) {
            query.action = action;
        }

        if (search) {
            query.$or = [
                { userEmail: { $regex: search, $options: "i" } },
                { action: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        // Date range filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) {
                query.timestamp.$gte = new Date(startDate);
            }
            if (endDate) {
                // Include the entire end day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.timestamp.$lte = end;
            }
        }

        const skipIndex = (parseInt(page) - 1) * parseInt(limit);

        const logs = await AuditLog.find(query)
            .populate("user", "name email role")
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skipIndex);

        const totalLogs = await AuditLog.countDocuments(query);

        res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                total: totalLogs,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(totalLogs / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("GET AUDIT LOGS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/audit/security
 * Fetch security-specific monitoring events (e.g. High/Critical severity, failed logins, lockouts)
 */
export const getSecurityEvents = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const query = {
            $or: [
                { severity: { $in: ["High", "Critical"] } },
                { action: { $in: ["Failed Login", "Multiple Failed Logins", "Account Lockout", "Unauthorized Access Attempt", "Locked Account Login Attempt"] } }
            ]
        };

        const skipIndex = (parseInt(page) - 1) * parseInt(limit);

        const logs = await AuditLog.find(query)
            .populate("user", "name email role")
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skipIndex);

        const total = await AuditLog.countDocuments(query);

        // Aggregate statistics for widget charts
        const failedLoginsCount = await AuditLog.countDocuments({ action: "Failed Login" });
        const lockoutsCount = await AuditLog.countDocuments({ action: "Account Lockout" });
        const unauthorizedCount = await AuditLog.countDocuments({ action: "Unauthorized Access Attempt" });

        // Count locked accounts currently in the system
        const activeLockouts = await User.countDocuments({ isActive: false });

        res.status(200).json({
            success: true,
            data: logs,
            stats: {
                failedLoginsCount,
                lockoutsCount,
                unauthorizedCount,
                activeLockouts,
                totalSecurityEvents: total
            },
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error("GET SECURITY EVENTS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/audit/user/:userId
 * Fetch activity logs history for a single user
 */
export const getUserHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const skipIndex = (parseInt(page) - 1) * parseInt(limit);

        const logs = await AuditLog.find({ user: userId })
            .populate("user", "name email role")
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skipIndex);

        const total = await AuditLog.countDocuments({ user: userId });

        res.status(200).json({
            success: true,
            data: logs,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error("GET USER HISTORY ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * GET /api/audit/export
 * Download audit logs format (CSV or JSON)
 */
export const exportAuditLogs = async (req, res) => {
    try {
        const { format = "csv", module, severity, search } = req.query;

        const query = {};
        if (module) query.module = module;
        if (severity) query.severity = severity;
        if (search) {
            query.$or = [
                { userEmail: { $regex: search, $options: "i" } },
                { action: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const logs = await AuditLog.find(query)
            .populate("user", "name email role")
            .sort({ timestamp: -1 })
            .limit(1000); // safety cap

        if (format.toLowerCase() === "json") {
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Content-Disposition", 'attachment; filename="audit_logs.json"');
            return res.status(200).send(JSON.stringify(logs, null, 2));
        }

        // CSV format
        let csv = "Timestamp,Severity,Module,Action,User Email,User Role,Description,IP Address,User Agent\n";
        logs.forEach(log => {
            const ts = log.timestamp ? new Date(log.timestamp).toISOString() : "";
            const sev = log.severity || "";
            const mod = log.module || "";
            const act = log.action || "";
            const email = log.userEmail || (log.user ? log.user.email : "");
            const role = log.userRole || (log.user ? log.user.role : "");
            // sanitize description, commas, quotes
            const desc = `"${(log.description || "").replace(/"/g, '""')}"`;
            const ip = log.ipAddress || "";
            const agent = `"${(log.userAgent || "").replace(/"/g, '""')}"`;

            csv += `${ts},${sev},${mod},${act},${email},${role},${desc},${ip},${agent}\n`;
        });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", 'attachment; filename="audit_logs.csv"');
        res.status(200).send(csv);

    } catch (error) {
        console.error("EXPORT AUDIT LOGS ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
