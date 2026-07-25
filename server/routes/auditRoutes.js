import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    getAuditLogs,
    getSecurityEvents,
    getUserHistory,
    exportAuditLogs
} from "../controllers/auditController.js";

const router = express.Router();

// Authorize Admin or Auditor role
const adminOrAuditor = (req, res, next) => {
    if (req.user.role !== "admin" && req.user.role !== "auditor") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Requires Administrator or Auditor privileges."
        });
    }
    next();
};

// All audit routes are private and restricted to admin/auditor roles
router.use(protect);
router.use(adminOrAuditor);

router.get("/", getAuditLogs);
router.get("/security", getSecurityEvents);
router.get("/user/:userId", getUserHistory);
router.get("/export", exportAuditLogs);

export default router;
