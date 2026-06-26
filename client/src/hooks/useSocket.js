import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socket, connectSocket, disconnectSocket } from "../services/socket.js";

// Reusable Socket.IO hook for subscribing to server-side events.
const useSocket = () => {
	const queryClient = useQueryClient();

	useEffect(() => {
		// Ensure the shared socket is connected when the hook is mounted.
		connectSocket();

		// Refresh incident data whenever a new incident is broadcast by the server.
		const handleIncidentCreated = () => {
			queryClient.invalidateQueries({
				queryKey: ["incidents"],
			});
		};

		socket.on("incidentCreated", handleIncidentCreated);

		// Remove listeners and close the connection when the component unmounts.
		return () => {
			socket.off("incidentCreated", handleIncidentCreated);
			disconnectSocket();
		};
	}, [queryClient]);

	return socket;
};

export default useSocket;
