import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getResources,
    getResource,
    createResource,
    updateResource,
    deleteResource,
} from "../services/resourceService";

const useResources = () => {
    const queryClient = useQueryClient();

    const {
        data: resources = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["resources"],
        queryFn: getResources,
        staleTime: 30000,
    });

    const addMutation = useMutation({
        mutationFn: createResource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        },
    });

    const editMutation = useMutation({
        mutationFn: ({ id, data }) => updateResource(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        },
    });

    const removeMutation = useMutation({
        mutationFn: deleteResource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resources"] });
            queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        },
    });

    return {
        resources,
        isLoading,
        error,
        refetch,
        addResource: addMutation.mutateAsync,
        editResource: editMutation.mutateAsync,
        deleteResource: removeMutation.mutateAsync,
        isAdding: addMutation.isPending,
        isEditing: editMutation.isPending,
        isDeleting: removeMutation.isPending,
    };
};

export default useResources;
