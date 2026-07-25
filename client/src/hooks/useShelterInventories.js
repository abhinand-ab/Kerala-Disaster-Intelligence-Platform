import { useQuery } from "@tanstack/react-query";
import {
    getShelterInventory,
    getAllShelterInventories,
} from "../services/shelterInventoryService";

export const useShelterInventory = (shelterId) => {
    const {
        data: shelterInventory = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["shelterInventory", shelterId],
        queryFn: () => getShelterInventory(shelterId),
        enabled: !!shelterId,
        staleTime: 30000,
    });

    return {
        shelterInventory,
        isLoading,
        error,
        refetch,
    };
};

export const useAllShelterInventories = () => {
    const {
        data: shelterInventories = [],
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["shelterInventories"],
        queryFn: getAllShelterInventories,
        staleTime: 30000,
    });

    return {
        shelterInventories,
        isLoading,
        error,
        refetch,
    };
};
