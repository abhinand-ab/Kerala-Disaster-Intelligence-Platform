import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import analyticsService from "../services/analyticsService";
import { toast } from "react-hot-toast";

/**
 * 1. Hook for Executive KPI Metrics
 */
export const useAnalyticsDashboard = (options = {}) => {
    return useQuery({
        queryKey: ["analytics", "dashboard"],
        queryFn: () => analyticsService.getDashboardMetrics(),
        staleTime: 30000, // 30 seconds
        ...options,
    });
};

/**
 * 2. Hook for Trend Analysis Charts
 */
export const useAnalyticsTrends = (days = 7, options = {}) => {
    return useQuery({
        queryKey: ["analytics", "trend", days],
        queryFn: () => analyticsService.getTrendAnalysis(days),
        staleTime: 60000, // 1 minute
        ...options,
    });
};

/**
 * 3. Hook for District Comparison Rankings
 */
export const useAnalyticsDistricts = (options = {}) => {
    return useQuery({
        queryKey: ["analytics", "districts"],
        queryFn: () => analyticsService.getDistrictComparison(),
        staleTime: 45000,
        ...options,
    });
};

/**
 * 4. Hook for Resources and Logistics summary
 */
export const useAnalyticsResources = (options = {}) => {
    return useQuery({
        queryKey: ["analytics", "resources"],
        queryFn: () => analyticsService.getResourceUtilization(),
        staleTime: 60000,
        ...options,
    });
};

/**
 * 5. Hook for AI recommendations evaluation statistics
 */
export const useAnalyticsAIStats = (options = {}) => {
    return useQuery({
        queryKey: ["analytics", "ai-stats"],
        queryFn: () => analyticsService.getAIStats(),
        staleTime: 45000,
        ...options,
    });
};

/**
 * 6. Mutation for generating and exporting report files
 */
export const useExportReport = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params) => analyticsService.downloadReport(params),
        onSuccess: () => {
            toast.success("Operations report compiled and downloaded successfully!");
        },
        onError: (err) => {
            toast.error(err?.message || "Report generation failed. Please verify credentials.");
        },
    });
};
