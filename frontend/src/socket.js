// socket.js
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:5000"; // Update for production if needed

// Create socket instance without autoConnect
export const socket = io(SERVER_URL, {
  autoConnect: false, // connect manually when ready
});

// Connect socket with username and role
export const connectSocket = (username, role) => {
  if (!username || !role) {
    console.error("Username and role are required to connect.");
    return;
  }

  // Attach authentication info
  socket.auth = { username, role };

  // Connect to backend
  socket.connect();

  // Optional: log connection success
  socket.on("connect", () => {
    console.log(`Socket connected: ${socket.id} as ${username} (${role})`);
  });

  // Optional: log disconnection
  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${reason}`);
  });

  // Optional: handle errors
  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });
};

// Disconnect socket manually
export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
