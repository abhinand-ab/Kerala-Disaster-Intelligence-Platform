import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCurrentWeather,
  getDistrictWeather,
  getForecast,
  getActiveAlerts,
  getWeatherSummary,
  getWeatherHistory,
  triggerManualSync,
} from "../services/weatherService";

export const useWeather = (options = {}) => {
  const queryClient = useQueryClient();
  const { refetchInterval } = options;

  const currentQuery = useQuery({
    queryKey: ["weather", "current"],
    queryFn: getCurrentWeather,
    refetchInterval,
  });

  const alertsQuery = useQuery({
    queryKey: ["weather", "alerts"],
    queryFn: getActiveAlerts,
    refetchInterval: refetchInterval || 30000, // Refresh alerts every 30s by default
  });

  const summaryQuery = useQuery({
    queryKey: ["weather", "summary"],
    queryFn: getWeatherSummary,
    refetchInterval,
  });

  const syncMutation = useMutation({
    mutationFn: triggerManualSync,
    onSuccess: () => {
      // Invalidate all weather queries
      queryClient.invalidateQueries({ queryKey: ["weather"] });
    },
  });

  const invalidateWeather = () => {
    queryClient.invalidateQueries({ queryKey: ["weather"] });
  };

  return {
    weatherData: currentQuery.data || [],
    isLoading: currentQuery.isLoading,
    error: currentQuery.error,
    refetchWeather: currentQuery.refetch,

    alerts: alertsQuery.data || [],
    isAlertsLoading: alertsQuery.isLoading,
    refetchAlerts: alertsQuery.refetch,

    summary: summaryQuery.data || {},
    isSummaryLoading: summaryQuery.isLoading,
    refetchSummary: summaryQuery.refetch,

    syncWeather: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    invalidateWeather,
  };
};

export const useDistrictWeather = (districtName) => {
  return useQuery({
    queryKey: ["weather", "district", districtName],
    queryFn: () => getDistrictWeather(districtName),
    enabled: !!districtName,
  });
};

export const useWeatherForecast = (districtName) => {
  return useQuery({
    queryKey: ["weather", "forecast", districtName],
    queryFn: () => getForecast(districtName),
    enabled: !!districtName,
  });
};

export const useWeatherHistory = (params = {}) => {
  return useQuery({
    queryKey: ["weather", "history", params],
    queryFn: () => getWeatherHistory(params),
  });
};