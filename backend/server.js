const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Change to frontend URL in production
    methods: ["GET", "POST"],
  },
});

// Structure: rooms = { roomName: { socketId: { name, role, socketId } } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinRoom", ({ room, user }) => {
    if (!rooms[room]) rooms[room] = {};

    const currentUsers = Object.values(rooms[room]);
    const hosts = currentUsers.filter((u) => u.role === "host");
    const players = currentUsers.filter((u) => u.role === "player");

    // Normalize name for case-insensitive comparison
    const normalizedName = user.name.trim().toLowerCase();

    // Check for duplicate name (different socket)
    const nameTakenByOther = currentUsers.some(
      (u) =>
        u.name.trim().toLowerCase() === normalizedName &&
        u.socketId !== socket.id
    );
    if (nameTakenByOther) {
      socket.emit("joinError", `User name "${user.name}" is already taken.`);
      return;
    }

    if (user.role === "host") {
      if (normalizedName !== "samuel") {
        socket.emit("joinError", "Only Samuel can be the host.");
        return;
      }

      // Remove any previous Samuel host entries BEFORE adding new one
      for (const [id, u] of Object.entries(rooms[room])) {
        if (
          u.role === "host" &&
          u.name.trim().toLowerCase() === "samuel" &&
          id !== socket.id
        ) {
          delete rooms[room][id];
          io.to(room).emit(
            "message",
            `Previous host Samuel disconnected due to reconnection.`
          );
        }
      }
    }

    // Enforce max 10 players
    if (user.role === "player" && players.length >= 10) {
      socket.emit("joinError", "Lobby is full for players.");
      return;
    }

    // Add or update user AFTER cleanup and checks
    rooms[room][socket.id] = { ...user, socketId: socket.id };
    socket.join(room);

    console.log(`Socket ${socket.id} joined room ${room}`);
    io.to(room).emit("playerList", Object.values(rooms[room]));
    io.to(room).emit("message", `User ${user.name} joined the room`);
  });

  socket.on("clearRoom", (room) => {
    if (rooms[room]) {
      const socketsInRoom = Object.keys(rooms[room]);

      // Emit 'forceLeave' event to all sockets in the room
      socketsInRoom.forEach((socketId) => {
        const sock = io.sockets.sockets.get(socketId);
        if (sock) {
          sock.emit("forceLeave", "Lobby has been cleared by host.");
        }
      });

      // Remove the room data from server
      delete rooms[room];

      // Emit updates to room (empty player list, message)
      io.to(room).emit("playerList", []);
      io.to(room).emit("message", `Room ${room} has been cleared.`);

      // Disconnect all sockets forcibly so clients are forced to reconnect if they want
      socketsInRoom.forEach((socketId) => {
        const sock = io.sockets.sockets.get(socketId);
        if (sock) {
          sock.disconnect(true);
        }
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    for (const room of Object.keys(rooms)) {
      if (rooms[room][socket.id]) {
        const user = rooms[room][socket.id];
        delete rooms[room][socket.id];

        console.log(`Socket ${socket.id} left room ${room}`);
        console.log("Current users in room:", Object.values(rooms[room]));

        io.to(room).emit("playerList", Object.values(rooms[room]));
        io.to(room).emit("message", `User ${user.name} left the room`);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
