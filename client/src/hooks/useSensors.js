import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getSensors,
    getSensorById,
    getSensorHistory,
    getSensorAnalytics,
    registerSensor,
    deleteSensor,
    updateSensorReading,
} from "../services/sensorService";
import { toast } from "react-hot-toast";

export const useSensorsList = (filters = {}, options = {}) => {
    return useQuery({
        queryKey: ["sensors", "list", filters],
        queryFn: () => getSensors(filters),
        select: (data) => data.data || [],
        ...options,
    });
};

export const useSensorDetail = (sensorId, options = {}) => {
    return useQuery({
        queryKey: ["sensors", "detail", sensorId],
        queryFn: () => getSensorById(sensorId),
        enabled: !!sensorId,
        select: (data) => data.data,
        ...options,
    });
};

export const useSensorHistory = (sensorId, limit = 30, options = {}) => {
    return useQuery({
        queryKey: ["sensors", "history", sensorId, limit],
        queryFn: () => getSensorHistory(sensorId, limit),
        enabled: !!sensorId,
        select: (data) => data.data || [],
        ...options,
    });
};

export const useSensorAnalytics = (options = {}) => {
    return useQuery({
        queryKey: ["sensors", "analytics"],
        queryFn: getSensorAnalytics,
        ...options,
    });
};

export const useRegisterSensor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: registerSensor,
        onSuccess: (res) => {
            toast.success(res?.message || "Sensor registered successfully.");
            queryClient.invalidateQueries({ queryKey: ["sensors"] });
        },
        onError: (err) => {
            toast.error(err || "Failed to register sensor.");
        },
    });
};

export const useDeleteSensor = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSensor,
        onSuccess: (res) => {
            toast.success(res?.message || "Sensor deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["sensors"] });
        },
        onError: (err) => {
            toast.error(err || "Failed to delete sensor.");
        },
    });
};

export const useUpdateSensorReading = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sensorId, data }) => updateSensorReading(sensorId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sensors"] });
            queryClient.invalidateQueries({ queryKey: ["risk"] });
        },
        onError: (err) => {
            toast.error(err || "Failed to submit telemetry.");
        },
    });
};
