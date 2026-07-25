import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import commandCenterService from "../services/commandCenterService";
import toast from "react-hot-toast";

// ── Fetch Hooks ─────────────────────────────────────────────────────────────

export const useCommandCenters = (options = {}) => {
    return useQuery({
        queryKey: ["commandCenters"],
        queryFn: commandCenterService.getCommandCenters,
        staleTime: 10_000,
        ...options,
    });
};

export const useCommandCenterById = (id, options = {}) => {
    return useQuery({
        queryKey: ["commandCenters", id],
        queryFn: () => commandCenterService.getCommandCenterById(id),
        enabled: !!id,
        staleTime: 5_000,
        ...options,
    });
};

export const useCommandCenterAvailability = (options = {}) => {
    return useQuery({
        queryKey: ["commandCenters", "availability"],
        queryFn: commandCenterService.getAgencyAvailability,
        staleTime: 15_000,
        ...options,
    });
};

export const useCommandCenterAgencies = (options = {}) => {
    return useQuery({
        queryKey: ["commandCenters", "agencies"],
        queryFn: commandCenterService.getAgencies,
        staleTime: 30_000,
        ...options,
    });
};

// ── Mutation Hooks ──────────────────────────────────────────────────────────

export const useCreateCommandCenter = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: commandCenterService.createCommandCenter,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["commandCenters"] });
            toast.success(`🏢 Command Center established for commander: ${data.assignedCommander}`);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to establish Command Center.");
        },
    });
};

export const useCreateAgency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: commandCenterService.createAgency,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["commandCenters", "agencies"] });
            queryClient.invalidateQueries({ queryKey: ["commandCenters", "availability"] });
            toast.success(`🛡️ Agency "${data.agencyName}" registered successfully.`);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to register agency.");
        },
    });
};

export const useJoinAgency = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, agencyId }) => commandCenterService.joinAgency(id, agencyId),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["commandCenters"] });
            queryClient.invalidateQueries({ queryKey: ["commandCenters", variables.id] });
            toast.success("Agency added/joined to Command Room.");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to join agency.");
        },
    });
};

export const useAssignMission = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, missionData }) => commandCenterService.assignMission(id, missionData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["commandCenters"] });
            queryClient.invalidateQueries({ queryKey: ["commandCenters", variables.id] });
            toast.success("🎯 Mission dispatched to participating agency.");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to assign mission.");
        },
    });
};

export const useUpdateMissionStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, missionId, status }) => commandCenterService.updateMissionStatus(id, missionId, status),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["commandCenters"] });
            queryClient.invalidateQueries({ queryKey: ["commandCenters", variables.id] });
            // Invalidate rescue teams & vehicles since status change releases them
            queryClient.invalidateQueries({ queryKey: ["rescueTeams"] });
            queryClient.invalidateQueries({ queryKey: ["vehicles"] });
            toast.success(`Mission state updated to: ${variables.status}`);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to update mission status.");
        },
    });
};

export const useShareResource = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, resourceData }) => commandCenterService.shareResource(id, resourceData),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["commandCenters"] });
            queryClient.invalidateQueries({ queryKey: ["commandCenters", variables.id] });
            toast.success("📦 Shared resource registered in the pool.");
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to share resource.");
        },
    });
};

export const useUpdateResourceStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, resourceId, status }) => commandCenterService.updateResourceStatus(id, resourceId, status),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["commandCenters"] });
            queryClient.invalidateQueries({ queryKey: ["commandCenters", variables.id] });
            toast.success(`Resource status updated to: ${variables.status}`);
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to update resource status.");
        },
    });
};

export const usePostCommandMessage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, messageData }) => commandCenterService.postCommandMessage(id, messageData),
        onSuccess: (data, variables) => {
            // Optimistic updates are handled or we invalidate the specific center query
            queryClient.invalidateQueries({ queryKey: ["commandCenters", variables.id] });
        },
        onError: (err) => {
            toast.error(err?.response?.data?.message || "Failed to send message.");
        },
    });
};
