import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { socket, connectSocket, disconnectSocket } from "../services/socket.js";

// Reusable Socket.IO hook for subscribing to server-side events.
const useSocket = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	useEffect(() => {
		// Ensure the shared socket is connected when the hook is mounted.
		connectSocket();

		const handleConnect = () => {
			if (user?._id) {
				socket.emit("join", user._id);
			}
		};

		if (socket.connected) {
			handleConnect();
		}

		socket.on("connect", handleConnect);

		return () => {
			socket.off("connect", handleConnect);
		};
	}, [user?._id]);

	useEffect(() => {
		const refreshIncidents = () => {
			queryClient.invalidateQueries({
				queryKey: ["incidents"],
			});
		};

		const refreshNotifications = () => {
			queryClient.invalidateQueries({
				queryKey: ["notifications"],
			});
		};

		const handleNotificationCreated = (notification) => {
			toast.success(notification?.title || "New notification received.");
			refreshNotifications();
		};

		socket.on("incidentCreated", refreshIncidents);
		socket.on("incidentUpdated", refreshIncidents);
		socket.on("incidentDeleted", refreshIncidents);
		socket.on("incidentAssigned", refreshIncidents);
		socket.on("incidentStatusUpdated", refreshIncidents);

		socket.on("notificationCreated", handleNotificationCreated);

		return () => {
			socket.off("incidentCreated", refreshIncidents);
			socket.off("incidentUpdated", refreshIncidents);
			socket.off("incidentDeleted", refreshIncidents);
			socket.off("incidentAssigned", refreshIncidents);
			socket.off("incidentStatusUpdated", refreshIncidents);

			socket.off("notificationCreated", handleNotificationCreated);
			disconnectSocket();
		};
	}, [queryClient]);

	return socket;
};

export default useSocket;
