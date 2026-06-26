// Private Socket.IO instance store for the application lifecycle.
let socketIO = null;

// Initialize and persist the Socket.IO instance once the server creates it.
export function setSocketIO(io) {
	socketIO = io;
}

// Retrieve the initialized Socket.IO instance for use across the backend.
export function getSocketIO() {
	if (!socketIO) {
		throw new Error("Socket.IO has not been initialized.");
	}

	return socketIO;
}
