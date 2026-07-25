import ShelterInventory from "../models/ShelterInventory.js";

export const getShelterInventoryByShelterId = async (req, res) => {
    try {
        const inventory = await ShelterInventory.find({ shelter: req.params.shelterId })
            .populate("shelter", "name district address");
        res.status(200).json({ success: true, count: inventory.length, data: inventory });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllShelterInventories = async (req, res) => {
    try {
        const inventories = await ShelterInventory.find()
            .populate("shelter", "name district address");
        res.status(200).json({ success: true, count: inventories.length, data: inventories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
