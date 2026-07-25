import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getDeliveries,
    getDelivery,
    createDelivery,
    updateDelivery,
    deleteDelivery,
} from "../services/deliveryService";

const useDeliveries = () => {
    const queryClient = useQueryClient();

    const {
        data: deliveries = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["deliveries"],
        queryFn: getDeliveries,
        staleTime: 30000,
    });

    const addMutation = useMutation({
        mutationFn: createDelivery,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] });
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            queryClient.invalidateQueries({ queryKey: ["shelters"] });
            queryClient.invalidateQueries({ queryKey: ["shelterInventories"] });
        },
    });

    const editMutation = useMutation({
        mutationFn: ({ id, data }) => updateDelivery(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] });
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
            queryClient.invalidateQueries({ queryKey: ["shelters"] });
            queryClient.invalidateQueries({ queryKey: ["shelterInventories"] });
        },
    });

    const removeMutation = useMutation({
        mutationFn: deleteDelivery,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["deliveries"] });
        },
    });

    return {
        deliveries,
        isLoading,
        error,
        refetch,
        addDelivery: addMutation.mutateAsync,
        editDelivery: editMutation.mutateAsync,
        deleteDelivery: removeMutation.mutateAsync,
        isAdding: addMutation.isPending,
        isEditing: editMutation.isPending,
        isDeleting: removeMutation.isPending,
    };
};

export default useDeliveries;
