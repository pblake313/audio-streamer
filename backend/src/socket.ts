import type { Server as HTTPServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeSocket(server: HTTPServer): SocketIOServer {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS
              .split(",")
              .map((origin) => origin.trim())
              .filter(Boolean)
        : [];

    io = new SocketIOServer(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        // console.log(`Socket connected: ${socket.id}`);

        socket.on("disconnect", (reason) => {
            // console.log(`Socket disconnected: ${socket.id} - ${reason}`);
        });
    });

    return io;
}

export function getSocketIO(): SocketIOServer {
    if (!io) {
        throw new Error("Socket.IO has not been initialized.");
    }

    return io;
}