import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
    getVolunteers,
    getVolunteer,
    createVolunteer,
    updateVolunteer,
    deleteVolunteer,
    assignVolunteerToIncident,
    markAvailable,
    markBusy,
    updateLiveLocation,
} from "../services/volunteerService.js";

const useVolunteers = () => {
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["volunteers"],
        queryFn: getVolunteers,
    });

    const volunteers = data || [];

    const refreshVolunteers = async () => {
        await queryClient.invalidateQueries({
            queryKey: ["volunteers"],
        });
    };

    const createVolunteerMutation = useMutation({
        mutationFn: createVolunteer,
        onSuccess: async () => {
            toast.success("Volunteer created successfully.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(
                error?.message ||
                error ||
                "Failed to create volunteer."
            );
        },
    });

    const updateVolunteerMutation = useMutation({
        mutationFn: ({ id, data }) => updateVolunteer(id, data),
        onSuccess: async () => {
            toast.success("Volunteer updated successfully.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(
                error?.message ||
                error ||
                "Failed to update volunteer."
            );
        },
    });

    const deleteVolunteerMutation = useMutation({
        mutationFn: deleteVolunteer,
        onSuccess: async () => {
            toast.success("Volunteer deleted successfully.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(
                error?.message ||
                error ||
                "Failed to delete volunteer."
            );
        },
    });

    const assignVolunteerMutation = useMutation({
        mutationFn: ({ id, incidentId }) => assignVolunteerToIncident(id, incidentId),
        onSuccess: async () => {
            toast.success("Volunteer assignment updated successfully.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(
                error?.message ||
                error ||
                "Failed to assign volunteer."
            );
        },
    });

    const markAvailableMutation = useMutation({
        mutationFn: markAvailable,
        onSuccess: async () => {
            toast.success("Volunteer marked as available.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(
                error?.message ||
                error ||
                "Failed to update status."
            );
        },
    });

    const markBusyMutation = useMutation({
        mutationFn: markBusy,
        onSuccess: async () => {
            toast.success("Volunteer marked as busy.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(
                error?.message ||
                error ||
                "Failed to update status."
            );
        },
    });

    const updateLocationMutation = useMutation({
        mutationFn: ({ id, latitude, longitude }) => updateLiveLocation(id, latitude, longitude),
        onSuccess: async () => {
            await refreshVolunteers();
        },
        onError: (error) => {
            console.error("Location update failed:", error);
        },
    });

    const unassignVolunteerMutation = useMutation({
        mutationFn: (id) => import("../services/volunteerService.js").then(m => m.unassignVolunteer(id)),
        onSuccess: async () => {
            toast.success("Volunteer assignments cleared.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to unassign volunteer.");
        },
    });

    const updateAvailabilityMutation = useMutation({
        mutationFn: ({ id, availability }) => import("../services/volunteerService.js").then(m => m.updateAvailability(id, availability)),
        onSuccess: async () => {
            toast.success("Volunteer availability updated.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to update availability.");
        },
    });

    const markOnDutyMutation = useMutation({
        mutationFn: (id) => import("../services/volunteerService.js").then(m => m.markOnDuty(id)),
        onSuccess: async () => {
            toast.success("Volunteer marked On Duty.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to update status.");
        },
    });

    const markOffDutyMutation = useMutation({
        mutationFn: (id) => import("../services/volunteerService.js").then(m => m.markOffDuty(id)),
        onSuccess: async () => {
            toast.success("Volunteer marked Off Duty.");
            await refreshVolunteers();
        },
        onError: (error) => {
            toast.error(error?.message || error || "Failed to update status.");
        },
    });

    return {
        volunteers,
        isLoading,
        error,
        refetch,
        createVolunteer: createVolunteerMutation.mutateAsync,
        updateVolunteer: updateVolunteerMutation.mutateAsync,
        deleteVolunteer: deleteVolunteerMutation.mutateAsync,
        assignVolunteer: assignVolunteerMutation.mutateAsync,
        markAvailable: markAvailableMutation.mutateAsync,
        markBusy: markBusyMutation.mutateAsync,
        updateLocation: updateLocationMutation.mutateAsync,
        unassignVolunteer: unassignVolunteerMutation.mutateAsync,
        updateAvailability: updateAvailabilityMutation.mutateAsync,
        markOnDuty: markOnDutyMutation.mutateAsync,
        markOffDuty: markOffDutyMutation.mutateAsync,
    };
};

export default useVolunteers;
