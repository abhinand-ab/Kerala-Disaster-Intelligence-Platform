import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getCurrentRisk,
    getDistrictRisk,
    getHistoricalRisk,
    getRiskHeatmapData,
    getRiskRecommendations,
    recalculateRiskManually,
} from "../services/riskService.js";

export const useRisk = (options = {}) => {
    const queryClient = useQueryClient();
    const { refetchInterval } = options;

    const currentQuery = useQuery({
        queryKey: ["risk", "current"],
        queryFn: getCurrentRisk,
        refetchInterval,
    });

    const heatmapQuery = useQuery({
        queryKey: ["risk", "heatmap"],
        queryFn: getRiskHeatmapData,
        refetchInterval,
    });

    const recommendationsQuery = useQuery({
        queryKey: ["risk", "recommendations"],
        queryFn: getRiskRecommendations,
        refetchInterval,
    });

    const syncMutation = useMutation({
        mutationFn: recalculateRiskManually,
        onSuccess: () => {
            // Invalidate all risk queries
            queryClient.invalidateQueries({ queryKey: ["risk"] });
        },
    });

    const invalidateRisk = () => {
        queryClient.invalidateQueries({ queryKey: ["risk"] });
    };

    return {
        rawRiskResponse: currentQuery.data,
        riskAssessments: currentQuery.data?.data || [],
        riskSummary: currentQuery.data?.summary || {},
        isLoading: currentQuery.isLoading,
        error: currentQuery.error,
        refetchRisk: currentQuery.refetch,

        heatmapData: heatmapQuery.data || [],
        isHeatmapLoading: heatmapQuery.isLoading,
        refetchHeatmap: heatmapQuery.refetch,

        recommendations: recommendationsQuery.data || { highRiskRecommendations: [], allRecommendations: [] },
        isRecommendationsLoading: recommendationsQuery.isLoading,
        refetchRecommendations: recommendationsQuery.refetch,

        syncRisk: syncMutation.mutateAsync,
        isSyncing: syncMutation.isPending,
        invalidateRisk,
    };
};

export const useDistrictRisk = (districtName) => {
    return useQuery({
        queryKey: ["risk", "district", districtName],
        queryFn: () => getDistrictRisk(districtName),
        enabled: !!districtName,
    });
};

export const useRiskHistory = (params = {}) => {
    return useQuery({
        queryKey: ["risk", "history", params],
        queryFn: () => getHistoricalRisk(params),
    });
};
