import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getVehicles,
    getVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    assignVehicle,
    updateVehicleStatus,
    updateLiveLocation,
    markMissionComplete,
} from "../services/vehicleService";

const useVehicles = () => {
    const queryClient = useQueryClient();

    const {
        data: vehicles = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["vehicles"],
        queryFn: getVehicles,
        staleTime: 30000,
    });

    const addMutation = useMutation({
        mutationFn: createVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        },
    });

    const editMutation = useMutation({
        mutationFn: ({ id, data }) => updateVehicle(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        },
    });

    const removeMutation = useMutation({
        mutationFn: deleteVehicle,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        },
    });

    const assignMutation = useMutation({
        mutationFn: ({ id, incidentId }) => assignVehicle(id, incidentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            queryClient.invalidateQueries({ queryKey: ["incidents"] });
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status, currentMission }) => updateVehicleStatus(id, status, currentMission),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            queryClient.invalidateQueries({ queryKey: ["incidents"] });
        },
    });

    const locationMutation = useMutation({
        mutationFn: ({ id, latitude, longitude }) => updateLiveLocation(id, latitude, longitude),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
        },
    });

    const completeMutation = useMutation({
        mutationFn: (id) => markMissionComplete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            queryClient.invalidateQueries({ queryKey: ["incidents"] });
        },
    });

    return {
        vehicles,
        isLoading,
        error,
        refetch,
        addVehicle: addMutation.mutateAsync,
        editVehicle: editMutation.mutateAsync,
        deleteVehicle: removeMutation.mutateAsync,
        assignVehicle: assignMutation.mutateAsync,
        updateStatus: statusMutation.mutateAsync,
        updateLocation: locationMutation.mutateAsync,
        completeMission: completeMutation.mutateAsync,
        isAdding: addMutation.isPending,
        isEditing: editMutation.isPending,
        isDeleting: removeMutation.isPending,
        isAssigning: assignMutation.isPending,
        isStatusUpdating: statusMutation.isPending,
        isLocationUpdating: locationMutation.isPending,
        isCompleting: completeMutation.isPending,
    };
};

export default useVehicles;
