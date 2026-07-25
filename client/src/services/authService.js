import axios from "axios";
import { API_BASE_URL } from "../config/api";

export const API = `${API_BASE_URL}/api/auth`;

export async function login(credentials) {
	try {
		const response = await axios.post(`${API}/login`, credentials);
		return response.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message;
	}
}

export async function register(userData) {
	try {
		const response = await axios.post(`${API}/register`, userData);
		return response.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message;
	}
}

export async function getProfile() {
	try {
		const token = localStorage.getItem("token");
		const response = await axios.get(`${API}/profile`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data.user;
	} catch (error) {
		throw error?.response?.data?.message || error.message;
	}
}

export async function updateProfile(profileData) {
	try {
		const token = localStorage.getItem("token");
		const response = await axios.put(
			`${API_BASE_URL}/api/users/profile`,
			profileData,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		return response.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message;
	}
}

export async function logout() {
	try {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		return true;
	} catch (error) {
		throw error?.response?.data?.message || error.message;
	}
}
