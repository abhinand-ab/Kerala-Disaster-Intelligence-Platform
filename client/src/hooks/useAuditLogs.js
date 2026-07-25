import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuditLogs, getSecurityEvents, getUserHistory } from "../services/auditService";

/**
 * React Query hook for general Audit activity logs
 */
export const useAuditLogs = (filters = {}) => {
    return useQuery({
        queryKey: ["auditLogs", filters],
        queryFn: () => getAuditLogs(filters),
        placeholderData: (previousData) => previousData, // keep previous data while fetching new pages (v5 equivalent of keepPreviousData)
        staleTime: 5000,
        refetchOnWindowFocus: false
    });
};

/**
 * React Query hook for security-specific alert events
 */
export const useSecurityEvents = (filters = {}) => {
    return useQuery({
        queryKey: ["securityEvents", filters],
        queryFn: () => getSecurityEvents(filters),
        placeholderData: (previousData) => previousData,
        staleTime: 5000
    });
};

/**
 * React Query hook for specific user activity history
 */
export const useUserHistory = (userId, filters = {}) => {
    return useQuery({
        queryKey: ["userHistory", userId, filters],
        queryFn: () => getUserHistory(userId, filters),
        enabled: !!userId,
        placeholderData: (previousData) => previousData
    });
};
