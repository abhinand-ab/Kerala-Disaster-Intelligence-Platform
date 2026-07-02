import { useQuery } from "@tanstack/react-query";
import { getDashboardAnalytics } from "../services/dashboardService.js";

// Reusable dashboard analytics hook powered by React Query.
const useDashboard = () => {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["dashboard"],
		queryFn: getDashboardAnalytics,
		staleTime: 30000,
		refetchOnWindowFocus: false,
	});

	return {
		data,
		isLoading,
		error,
		refetch,
	};
};

export default useDashboard;
