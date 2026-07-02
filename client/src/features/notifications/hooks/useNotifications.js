import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
	getNotifications,
	markNotificationAsRead,
	markAllNotificationsAsRead,
	deleteNotification,
} from "../services/notificationService.js";

// Reusable notifications hook powered by React Query.
const useNotifications = () => {
	const queryClient = useQueryClient();

	const {
		data,
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: ["notifications"],
		queryFn: getNotifications,
	});

	const notifications = data?.data || [];

	const refreshNotifications = async () => {
		await queryClient.invalidateQueries({
			queryKey: ["notifications"],
		});
	};

	const markAsReadMutation = useMutation({
		mutationFn: markNotificationAsRead,
		onSuccess: async () => {
			toast.success("Notification marked as read.");
			await refreshNotifications();
		},
		onError: (mutationError) => {
			toast.error(mutationError?.message || mutationError || "Failed to mark notification as read.");
		},
	});

	const markAllAsReadMutation = useMutation({
		mutationFn: markAllNotificationsAsRead,
		onSuccess: async () => {
			toast.success("All notifications marked as read.");
			await refreshNotifications();
		},
		onError: (mutationError) => {
			toast.error(mutationError?.message || mutationError || "Failed to mark all notifications as read.");
		},
	});

	const deleteNotificationMutation = useMutation({
		mutationFn: deleteNotification,
		onSuccess: async () => {
			toast.success("Notification deleted successfully.");
			await refreshNotifications();
		},
		onError: (mutationError) => {
			toast.error(mutationError?.message || mutationError || "Failed to delete notification.");
		},
	});

	const unreadCount = useMemo(
		() => notifications.filter((notification) => !notification.isRead).length,
		[notifications]
	);

	return {
		notifications,
		isLoading,
		error,
		unreadCount,
		markAsRead: markAsReadMutation.mutateAsync,
		markAllAsRead: markAllAsReadMutation.mutateAsync,
		deleteNotification: deleteNotificationMutation.mutateAsync,
		refetch,
	};
};

export default useNotifications;
