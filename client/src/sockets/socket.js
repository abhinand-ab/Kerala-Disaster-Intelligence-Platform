import { io } from "socket.io-client";
import { SOCKET_URL } from "../config/api";

let socket = null;

export const getSocketIO = () => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            withCredentials: true,
        });
    }

    return socket;
};
