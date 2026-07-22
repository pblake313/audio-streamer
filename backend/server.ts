import "dotenv/config";

import http from "node:http";

import app from "./src/app";
import { initializeSocket } from "./src/socket";
import { startConvertedFileCleanupWorker } from "./src/workers/conversion-cleanup-worker";

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer(app);

initializeSocket(server);

server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
    } else if (error.code === "EACCES") {
        console.error(`Port ${PORT} requires elevated privileges.`);
    } else {
        console.error("Server error:", error);
    }

    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);

    startConvertedFileCleanupWorker();
});