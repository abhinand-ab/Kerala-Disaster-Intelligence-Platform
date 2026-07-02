import axios from "axios";

const API = "http://localhost:5000/api/incidents";

const getToken = () => {
  return localStorage.getItem("token");
};

export const getIncidents = async () => {
  const res = await axios.get(API);

  return res.data.data;
};

export const createIncident = async (incident) => {
  const res = await axios.post(API, incident, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.data.data;
};

export const updateIncident = async (id, data) => {
  const res = await axios.put(`${API}/${id}`, data, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.data.data;
};

export const deleteIncident = async (id) => {
  const res = await axios.delete(`${API}/${id}`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  return res.data.data;
};

export const updateIncidentStatus = async (id, status) => {
  const res = await axios.patch(
    `${API}/${id}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return res.data.data;
};

export const assignVolunteer = async (id, volunteerId) => {
  const res = await axios.patch(
    `${API}/${id}/assign`,
    { volunteerId },
    {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }
  );

  return res.data.data;
};