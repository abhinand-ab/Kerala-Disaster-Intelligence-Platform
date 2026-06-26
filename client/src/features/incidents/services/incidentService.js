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