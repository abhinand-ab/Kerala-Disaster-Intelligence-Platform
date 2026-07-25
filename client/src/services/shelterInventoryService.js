import axios from "axios";

const API = "http://localhost:5000/api/shelter-inventory";

export const getShelterInventory = async (shelterId) => {
    try {
        const response = await axios.get(`${API}/shelter/${shelterId}`);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch shelter inventory.";
    }
};

export const getAllShelterInventories = async () => {
    try {
        const response = await axios.get(API);
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch all shelter inventories.";
    }
};
