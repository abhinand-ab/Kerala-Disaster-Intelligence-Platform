import axios from "axios";
import { API_BASE_URL } from "../../../config/api";

const API = `${API_BASE_URL}/api/notifications`;

const getAuthHeaders = () => {
	const token = localStorage.getItem("token");

	return {
		Authorization: `Bearer ${token}`,
	};
};

export const getNotifications = async () => {
	try {
		const response = await axios.get(API, {
			headers: getAuthHeaders(),
		});

		return response.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to fetch notifications.";
	}
};

export const markNotificationAsRead = async (notificationId) => {
	try {
		const response = await axios.put(
			`${API}/${notificationId}/read`,
			{},
			{
				headers: getAuthHeaders(),
			}
		);

		return response.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to mark notification as read.";
	}
};

export const markAllNotificationsAsRead = async () => {
	try {
		const response = await axios.put(
			`${API}/read-all`,
			{},
			{
				headers: getAuthHeaders(),
			}
		);

		return response.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to mark all notifications as read.";
	}
};

export const deleteNotification = async (notificationId) => {
	try {
		const response = await axios.delete(`${API}/${notificationId}`, {
			headers: getAuthHeaders(),
		});

		return response.data;
	} catch (error) {
		throw error?.response?.data?.message || error.message || "Failed to delete notification.";
	}
};
