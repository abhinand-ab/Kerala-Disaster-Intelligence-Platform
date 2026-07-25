import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
    getRescueTeams,
    getRescueTeam,
    createRescueTeam,
    updateRescueTeam,
    deleteRescueTeam,
    addTeamMember,
    removeTeamMember,
    assignTeamToIncident,
    assignTeamToVehicle,
    updateTeamStatus,
} from "../services/rescueTeamService.js";

const useRescueTeams = () => {
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["rescueTeams"],
        queryFn: getRescueTeams,
    });

    const teams = data || [];

    const refreshTeams = async () => {
        await queryClient.invalidateQueries({
            queryKey: ["rescueTeams"],
        });
    };

    const createTeamMutation = useMutation({
        mutationFn: createRescueTeam,
        onSuccess: async () => {
            toast.success("Rescue team created successfully.");
            await refreshTeams();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to create rescue team.");
        },
    });

    const updateTeamMutation = useMutation({
        mutationFn: ({ id, data }) => updateRescueTeam(id, data),
        onSuccess: async () => {
            toast.success("Rescue team updated successfully.");
            await refreshTeams();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to update rescue team.");
        },
    });

    const deleteTeamMutation = useMutation({
        mutationFn: deleteRescueTeam,
        onSuccess: async () => {
            toast.success("Rescue team deleted successfully.");
            await refreshTeams();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to delete rescue team.");
        },
    });

    const addMemberMutation = useMutation({
        mutationFn: ({ id, volunteerId }) => addTeamMember(id, volunteerId),
        onSuccess: async () => {
            toast.success("Member added to rescue team.");
            await refreshTeams();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to add member.");
        },
    });

    const removeMemberMutation = useMutation({
        mutationFn: ({ id, volunteerId }) => removeTeamMember(id, volunteerId),
        onSuccess: async () => {
            toast.success("Member removed from rescue team.");
            await refreshTeams();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to remove member.");
        },
    });

    const assignIncidentMutation = useMutation({
        mutationFn: ({ id, incidentId }) => assignTeamToIncident(id, incidentId),
        onSuccess: async () => {
            toast.success("Rescue team incident assignment updated.");
            await refreshTeams();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to assign incident.");
        },
    });

    const assignVehicleMutation = useMutation({
        mutationFn: ({ id, vehicleId }) => assignTeamToVehicle(id, vehicleId),
        onSuccess: async () => {
            toast.success("Rescue team vehicle assignment updated.");
            await refreshTeams();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to assign vehicle.");
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }) => updateTeamStatus(id, status),
        onSuccess: async () => {
            toast.success("Rescue team status updated.");
            await refreshTeams();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to update status.");
        },
    });

    return {
        teams,
        isLoading,
        error,
        refetch,
        createTeam: createTeamMutation.mutateAsync,
        updateTeam: updateTeamMutation.mutateAsync,
        deleteTeam: deleteTeamMutation.mutateAsync,
        addMember: addMemberMutation.mutateAsync,
        removeMember: removeMemberMutation.mutateAsync,
        assignTeamToIncident: assignIncidentMutation.mutateAsync,
        assignTeamToVehicle: assignVehicleMutation.mutateAsync,
        updateStatus: updateStatusMutation.mutateAsync,
    };
};

export default useRescueTeams;
