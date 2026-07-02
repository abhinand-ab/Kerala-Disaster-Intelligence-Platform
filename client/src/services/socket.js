import { io } from "socket.io-client";

// Single shared Socket.IO client instance for the application.
export const socket = io("http://localhost:5000", {
	autoConnect: false,
	withCredentials: true,
});

// Connect only when the socket is not already connected or connecting.
export const connectSocket = () => {
	if (!socket.connected && !socket.active) {
		socket.connect();
	}

	return socket;
};

// Disconnect safely without creating duplicate connections on reconnect.
export const disconnectSocket = () => {
	if (socket.connected || socket.active) {
		socket.disconnect();
	}

	return socket;
};
