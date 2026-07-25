import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import aiService from "../services/aiService";
import toast from "react-hot-toast";

// ── Fetch Hooks ─────────────────────────────────────────────────────────────

export const useAIRecommendations = (params = {}, options = {}) => {
    return useQuery({
        queryKey: ["ai", "recommendations", params],
        queryFn: () => aiService.getRecommendations(params),
        staleTime: 30_000,
        ...options,
    });
};

export const useAIPredictions = (options = {}) => {
    return useQuery({
        queryKey: ["ai", "predictions"],
        queryFn: aiService.getPredictions,
        staleTime: 60_000,
        ...options,
    });
};

export const useAIRiskSummary = (options = {}) => {
    return useQuery({
        queryKey: ["ai", "risk-summary"],
        queryFn: aiService.getRiskSummary,
        staleTime: 60_000,
        ...options,
    });
};

export const useAIEvacuation = (options = {}) => {
    return useQuery({
        queryKey: ["ai", "evacuation"],
        queryFn: aiService.getEvacuationSuggestions,
        staleTime: 60_000,
        ...options,
    });
};

export const useAIResourceOptimization = (options = {}) => {
    return useQuery({
        queryKey: ["ai", "resource-optimization"],
        queryFn: aiService.getResourceOptimization,
        staleTime: 60_000,
        ...options,
    });
};

export const useAIAnalytics = (options = {}) => {
    return useQuery({
        queryKey: ["ai", "analytics"],
        queryFn: aiService.getAnalytics,
        staleTime: 60_000,
        ...options,
    });
};

// ── Mutation Hooks ──────────────────────────────────────────────────────────

export const useRunAnalysis = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: aiService.runAnalysis,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai"] });
            toast.success("🤖 AI Analysis pipeline completed successfully.");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "AI analysis failed.");
        },
    });
};

export const useSmartAssign = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ targetType, targetId }) => aiService.smartAssign(targetType, targetId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["ai"] });
            toast.success(`🤖 Smart assignment: ${data.count} recommendations generated.`);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Smart assignment failed.");
        },
    });
};

export const useAcceptRecommendation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => aiService.acceptRecommendation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai"] });
            toast.success("Recommendation accepted.");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to accept recommendation.");
        },
    });
};

export const useRejectRecommendation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => aiService.rejectRecommendation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["ai"] });
            toast("Recommendation rejected.", { icon: "🗑️" });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to reject recommendation.");
        },
    });
};
