import axios from "axios";

const API = "http://localhost:5000/api/volunteers";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");

    return {
        Authorization: `Bearer ${token}`,
    };
};

export const getVolunteers = async () => {
    try {
        const response = await axios.get(API, {
            headers: getAuthHeaders(),
        });

        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch volunteers.";
    }
};

export const getVolunteer = async (id) => {
    try {
        const response = await axios.get(`${API}/${id}`, {
            headers: getAuthHeaders(),
        });

        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to fetch volunteer.";
    }
};

export const createVolunteer = async (data) => {
    try {
        const response = await axios.post(API, data, {
            headers: getAuthHeaders(),
        });

        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to create volunteer.";
    }
};

export const updateVolunteer = async (id, data) => {
    try {
        const response = await axios.put(`${API}/${id}`, data, {
            headers: getAuthHeaders(),
        });

        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update volunteer.";
    }
};

export const deleteVolunteer = async (id) => {
    try {
        const response = await axios.delete(`${API}/${id}`, {
            headers: getAuthHeaders(),
        });

        return response.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to delete volunteer.";
    }
};

export const assignVolunteerToIncident = async (id, incidentId) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/assign`,
            { incidentId },
            {
                headers: getAuthHeaders(),
            }
        );

        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to assign volunteer to incident.";
    }
};

export const markAvailable = async (id) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/available`,
            {},
            {
                headers: getAuthHeaders(),
            }
        );

        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to mark volunteer as available.";
    }
};

export const markBusy = async (id) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/busy`,
            {},
            {
                headers: getAuthHeaders(),
            }
        );

        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to mark volunteer as busy.";
    }
};

export const updateLiveLocation = async (id, latitude, longitude) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/location`,
            { latitude, longitude },
            {
                headers: getAuthHeaders(),
            }
        );

        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update location.";
    }
};

export const unassignVolunteer = async (id) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/unassign`,
            {},
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to unassign volunteer.";
    }
};

export const updateAvailability = async (id, availability) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/availability`,
            { availability },
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to update availability.";
    }
};

export const markOnDuty = async (id) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/onduty`,
            {},
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to mark volunteer on duty.";
    }
};

export const markOffDuty = async (id) => {
    try {
        const response = await axios.patch(
            `${API}/${id}/offduty`,
            {},
            {
                headers: getAuthHeaders(),
            }
        );
        return response.data.data;
    } catch (error) {
        throw error?.response?.data?.message || error.message || "Failed to mark volunteer off duty.";
    }
};
