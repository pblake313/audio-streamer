import io from 'socket.io-client';

const backendLink = import.meta.env.VITE_BACKEND_URL;
let socket: any;

export async function getSocket() {
    if (!socket) {
        socket = io(backendLink);
    }
    return socket;
}
