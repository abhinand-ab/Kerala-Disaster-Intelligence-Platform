import axios from "axios";

const API = "http://localhost:5000/api/command-center";

const getHeaders = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

const commandCenterService = {
    getCommandCenters: async () => {
        const { data } = await axios.get(API, getHeaders());
        return data.data;
    },

    getCommandCenterById: async (id) => {
        const { data } = await axios.get(`${API}/${id}`, getHeaders());
        return data.data;
    },

    createCommandCenter: async (centerData) => {
        const { data } = await axios.post(API, centerData, getHeaders());
        return data.data;
    },

    getAgencyAvailability: async () => {
        const { data } = await axios.get(`${API}/availability`, getHeaders());
        return data.data;
    },

    getAgencies: async () => {
        const { data } = await axios.get(`${API}/agencies`, getHeaders());
        return data.data;
    },

    createAgency: async (agencyData) => {
        const { data } = await axios.post(`${API}/agencies`, agencyData, getHeaders());
        return data.data;
    },

    joinAgency: async (id, agencyId) => {
        const { data } = await axios.post(`${API}/${id}/join`, { agencyId }, getHeaders());
        return data.data;
    },

    assignMission: async (id, missionData) => {
        const { data } = await axios.post(`${API}/${id}/missions`, missionData, getHeaders());
        return data.data;
    },

    updateMissionStatus: async (id, missionId, status) => {
        const { data } = await axios.patch(`${API}/${id}/missions/${missionId}`, { status }, getHeaders());
        return data.data;
    },

    shareResource: async (id, resourceData) => {
        const { data } = await axios.post(`${API}/${id}/resources`, resourceData, getHeaders());
        return data.data;
    },

    updateResourceStatus: async (id, resourceId, status) => {
        const { data } = await axios.patch(`${API}/${id}/resources/${resourceId}`, { status }, getHeaders());
        return data.data;
    },

    postCommandMessage: async (id, messageData) => {
        // messageData contains: agencyId, message, sender
        const { data } = await axios.post(`${API}/${id}/messages`, messageData, getHeaders());
        return data.data;
    }
};

export default commandCenterService;
