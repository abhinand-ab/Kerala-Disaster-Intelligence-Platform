import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
    submitSOS,
    trackRequestByPhone,
    getEmergencyRequests,
    getEmergencyRequestById,
    updateEmergencyRequest,
    assignResponders,
    changeRequestStatus,
    getEmergencyAnalytics,
} from "../services/emergencyService";

export const useEmergencyRequests = (filters = {}, options = {}) => {
    return useQuery({
        queryKey: ["emergency", "list", filters],
        queryFn: () => getEmergencyRequests(filters),
        refetchInterval: options.refetchInterval,
    });
};

export const useEmergencyDetail = (id) => {
    return useQuery({
        queryKey: ["emergency", "detail", id],
        queryFn: () => getEmergencyRequestById(id),
        enabled: !!id,
    });
};

export const useTrackSOS = (phone) => {
    return useQuery({
        queryKey: ["emergency", "track", phone],
        queryFn: () => trackRequestByPhone(phone),
        enabled: !!phone,
    });
};

export const useEmergencyAnalytics = () => {
    return useQuery({
        queryKey: ["emergency", "analytics"],
        queryFn: getEmergencyAnalytics,
    });
};

export const useSubmitSOS = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: submitSOS,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["emergency"] });
            toast.success("SOS Alert Sent! Rescue coordinators are tracking your location.");
        },
        onError: (err) => {
            toast.error(err || "Failed to transmit SOS request.");
        },
    });
};

export const useUpdateSOS = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => updateEmergencyRequest(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["emergency"] });
            toast.success("Emergency details updated.");
        },
        onError: (err) => {
            toast.error(err || "Failed to update emergency.");
        },
    });
};

export const useAssignSOS = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, assignments }) => assignResponders(id, assignments),
        onSuccess: (data) => {
            // Invalidate both lists and detail query
            queryClient.invalidateQueries({ queryKey: ["emergency"] });
            toast.success("Responders assigned to emergency.");
        },
        onError: (err) => {
            toast.error(err || "Incident dispatch failed.");
        },
    });
};

export const useChangeSOSStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => changeRequestStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["emergency"] });
            toast.success("SOS status updated successfully.");
        },
        onError: (err) => {
            toast.error(err || "Failed to update SOS status.");
        },
    });
};
