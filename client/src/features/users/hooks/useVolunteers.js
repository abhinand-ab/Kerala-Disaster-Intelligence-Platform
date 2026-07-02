import { useQuery } from "@tanstack/react-query";

import { getVolunteers } from "../services/userService";

const useVolunteers = () => {
	const {
		data = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["volunteers"],
		queryFn: getVolunteers,
		staleTime: 60000,
		refetchOnWindowFocus: false,
	});

	return {
		volunteers: data,
		loading: isLoading,
		error,
		refresh: refetch,
	};
};

export default useVolunteers;
