import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
	getShelters,
	getShelter,
	createShelter,
	updateShelter,
	deleteShelter,
	updateOccupancy,
} from "../services/shelterService.js";

// Reusable shelters hook powered by React Query.
const useShelters = () => {
	const queryClient = useQueryClient();

	const {
		data,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["shelters"],
		queryFn: getShelters,
	});

	const shelters = data || [];

	const refreshShelters = async () => {
		await queryClient.invalidateQueries({
			queryKey: ["shelters"],
		});
	};

	const createShelterMutation = useMutation({
		mutationFn: createShelter,
		onSuccess: async () => {
			toast.success("Shelter created successfully.");
			await refreshShelters();
		},
		onError: (error) => {
			toast.error(
				error?.message ||
				error ||
				"Failed to create shelter."
			);
		},
	});

	const updateShelterMutation = useMutation({
		mutationFn: ({ id, data }) => updateShelter(id, data),
		onSuccess: async () => {
			toast.success("Shelter updated successfully.");
			await refreshShelters();
		},
		onError: (error) => {
			toast.error(
				error?.message ||
				error ||
				"Failed to update shelter."
			);
		},
	});

	const deleteShelterMutation = useMutation({
		mutationFn: deleteShelter,
		onSuccess: async () => {
			toast.success("Shelter deleted successfully.");
			await refreshShelters();
		},
		onError: (error) => {
			toast.error(
				error?.message ||
				error ||
				"Failed to delete shelter."
			);
		},
	});

	const updateOccupancyMutation = useMutation({
		mutationFn: ({ id, occupancy }) => updateOccupancy(id, occupancy),
		onSuccess: async () => {
			toast.success("Occupancy updated successfully.");
			await refreshShelters();
		},
		onError: (error) => {
			toast.error(
				error?.message ||
				error ||
				"Failed to update occupancy."
			);
		},
	});

	return {
		shelters,
		isLoading,
		error,
		refetch,
		createShelter: createShelterMutation.mutateAsync,
		updateShelter: updateShelterMutation.mutateAsync,
		deleteShelter: deleteShelterMutation.mutateAsync,
		updateOccupancy: updateOccupancyMutation.mutateAsync,
	};
};

export default useShelters;
