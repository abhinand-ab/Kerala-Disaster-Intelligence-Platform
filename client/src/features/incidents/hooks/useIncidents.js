import { useQuery } from "@tanstack/react-query";
import { getIncidents } from "../services/incidentService";

const useIncidents = () => {
  const {
    data = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["incidents"],
    queryFn: getIncidents,
  });

  return {
    incidents: data,
    loading: isLoading,
    refresh: refetch,
  };
};

export default useIncidents;