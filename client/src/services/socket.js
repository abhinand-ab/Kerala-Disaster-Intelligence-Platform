import { getSocketIO } from "../sockets/socket.js";

// Single shared Socket.IO client instance for the application.
export const socket = getSocketIO();

// Connect only when the socket is not already connected or connecting.
export const connectSocket = () => {
	const currentSocket = getSocketIO();
	if (!currentSocket.connected && !currentSocket.active) {
		currentSocket.connect();
	}

	return currentSocket;
};

// Disconnect safely without creating duplicate connections on reconnect.
export const disconnectSocket = () => {
	const currentSocket = getSocketIO();
	if (currentSocket.connected || currentSocket.active) {
		currentSocket.disconnect();
	}

	return currentSocket;
};
