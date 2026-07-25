import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getWarehouses,
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
} from "../services/warehouseService";

const useWarehouses = () => {
    const queryClient = useQueryClient();

    const {
        data: warehouses = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["warehouses"],
        queryFn: getWarehouses,
        staleTime: 30000,
    });

    const addMutation = useMutation({
        mutationFn: createWarehouse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        },
    });

    const editMutation = useMutation({
        mutationFn: ({ id, data }) => updateWarehouse(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        },
    });

    const removeMutation = useMutation({
        mutationFn: deleteWarehouse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        },
    });

    return {
        warehouses,
        isLoading,
        error,
        refetch,
        addWarehouse: addMutation.mutateAsync,
        editWarehouse: editMutation.mutateAsync,
        deleteWarehouse: removeMutation.mutateAsync,
        isAdding: addMutation.isPending,
        isEditing: editMutation.isPending,
        isDeleting: removeMutation.isPending,
    };
};

export default useWarehouses;
