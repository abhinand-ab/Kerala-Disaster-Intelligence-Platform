import AuditLog from "../models/AuditLog.js";
import User from "../models/User.js";
import { getSocketIO } from "../sockets/socket.js";

// In-memory failed logins storage
const failedLoginsTracker = new Map();
const FAILED_LOGIN_THRESHOLD = 3;
const LOCKOUT_THRESHOLD = 5;

/**
 * Universal Activity & Audit Logger
 */
export const logActivity = async ({
    userId = null,
    userEmail = "",
    userRole = "guest",
    action,
    module,
    targetId = null,
    targetType = null,
    description,
    ipAddress = "",
    userAgent = "",
    severity = "Low"
}) => {
    try {
        // 1. Create database log entry
        const newLog = await AuditLog.create({
            user: userId,
            userEmail,
            userRole,
            action,
            module,
            targetId,
            targetType,
            description,
            ipAddress,
            userAgent,
            severity
        });

        // Populate user if present for socket emits
        let populatedLog = newLog;
        if (userId) {
            populatedLog = await newLog.populate("user", "name email role");
        }

        // 2. Broadcast via Socket.IO
        try {
            const io = getSocketIO();
            if (io) {
                // Broadcast all audit logs to administrators or subscribers
                io.emit("auditCreated", populatedLog);

                // Broadcast critical warnings
                if (["High", "Critical"].includes(severity)) {
                    io.emit("securityAlert", populatedLog);
                }
            }
        } catch (socketError) {
            console.warn("Socket broadcast of audit log failed:", socketError.message);
        }

        return populatedLog;
    } catch (error) {
        console.error("FAILED TO WRITE AUDIT LOG:", error);
    }
};

/**
 * Record a failed login attempt, check threshold, and handle lockouts
 */
export const recordFailedLogin = async (email, ip, userAgent) => {
    const normEmail = email.toLowerCase().trim();
    const currentAttempts = (failedLoginsTracker.get(normEmail) || 0) + 1;
    failedLoginsTracker.set(normEmail, currentAttempts);

    let severity = "Low";
    let description = `Failed login attempt for account: ${normEmail}`;

    // Log the initial failure
    await logActivity({
        userEmail: normEmail,
        action: "Failed Login",
        module: "Auth",
        description,
        ipAddress: ip,
        userAgent,
        severity: "Low"
    });

    // Check Suspicious Activity (3 or more failed attempts)
    if (currentAttempts >= FAILED_LOGIN_THRESHOLD && currentAttempts < LOCKOUT_THRESHOLD) {
        severity = "High";
        description = `SUSPICIOUS ACTIVITY: Multiple failed login attempts (${currentAttempts}) detected on account ${normEmail}`;

        await logActivity({
            action: "Multiple Failed Logins",
            module: "Auth",
            description,
            ipAddress: ip,
            userAgent,
            severity
        });

        try {
            const io = getSocketIO();
            if (io) {
                io.emit("suspiciousActivity", {
                    type: "Failed Logins Alert",
                    email: normEmail,
                    attempts: currentAttempts,
                    ipAddress: ip,
                    timestamp: new Date()
                });
            }
        } catch (err) {
            console.warn(err);
        }
    }

    // Account Lockout threshold (5 failed attempts)
    if (currentAttempts >= LOCKOUT_THRESHOLD) {
        const user = await User.findOne({ email: normEmail });
        if (user) {
            if (user.isActive !== false) {
                user.isActive = false;
                await user.save();

                description = `ACCOUNT LOCKED: Account ${normEmail} has been temporarily locked due to ${currentAttempts} consecutive failed login attempts.`;
                await logActivity({
                    userId: user._id,
                    userEmail: normEmail,
                    userRole: user.role,
                    action: "Account Lockout",
                    module: "Auth",
                    targetId: user._id.toString(),
                    targetType: "User",
                    description,
                    ipAddress: ip,
                    userAgent,
                    severity: "Critical"
                });

                try {
                    const io = getSocketIO();
                    if (io) {
                        io.emit("securityAlert", {
                            type: "Account Lockout Event",
                            email: normEmail,
                            userId: user._id,
                            ipAddress: ip,
                            timestamp: new Date(),
                            severity: "Critical"
                        });
                    }
                } catch (err) {
                    console.warn(err);
                }
            }
        } else {
            // Inexistent account lockout attempt
            description = `CRITICAL: Inexistent user account ${normEmail} lockout threshold reached.`;
            await logActivity({
                userEmail: normEmail,
                action: "Inexistent Account Attacked",
                module: "Auth",
                description,
                ipAddress: ip,
                userAgent,
                severity: "High"
            });
        }
    }

    return currentAttempts;
};

/**
 * Clear failed login attempts tracker upon successful login
 */
export const recordSuccessfulLogin = async (user, ip, userAgent) => {
    const normEmail = user.email.toLowerCase().trim();
    failedLoginsTracker.delete(normEmail);

    await logActivity({
        userId: user._id,
        userEmail: user.email,
        userRole: user.role,
        action: "Login",
        module: "Auth",
        targetId: user._id.toString(),
        targetType: "User",
        description: `User ${user.name} logged in successfully`,
        ipAddress: ip,
        userAgent,
        severity: "Info"
    });
};

/**
 * Log unauthorized access attempt (ACL Policy Violation)
 */
export const logUnauthorizedAccess = async (req, moduleName, description = "") => {
    const user = req.user;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "";
    const userAgent = req.headers["user-agent"] || "";

    await logActivity({
        userId: user?.id || null,
        userEmail: user?.email || "anonymous",
        userRole: user?.role || "guest",
        action: "Unauthorized Access Attempt",
        module: moduleName || "Auth",
        description: description || `Access denied: user ${user?.email || "anonymous"} attempted unauthorized action on endpoint ${req.originalUrl}`,
        ipAddress,
        userAgent,
        severity: "High"
    });

    try {
        const io = getSocketIO();
        if (io) {
            io.emit("suspiciousActivity", {
                type: "Unauthorized Access Attempt",
                email: user?.email || "anonymous",
                ipAddress,
                url: req.originalUrl,
                timestamp: new Date()
            });
        }
    } catch (err) {
        console.warn("Socket emitter error:", err);
    }
};
