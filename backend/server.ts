// server.ts
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './src/app'; // your Express app

// Hard default to 3000, but allow override via env if you want
const PORT = Number(process.env.PORT) || 3000;

// Create HTTP server from your Express app
const server = http.createServer(app);

// Attach Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',')
      : [],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Basic error handler
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else if (err.code === 'EACCES') {
    console.error(`Port ${PORT} requires elevated privileges`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Start listening
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

// export socket.io so you can use it in other files if needed
export { io };
