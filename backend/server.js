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

// Track battlefield players per room: { roomName: Set of socketIds }
const battlefieldPlayers = {};

// Helper: emit if Samuel (host) is present in the room
function emitHostStatus(room) {
  if (!rooms[room]) return;
  const currentUsers = Object.values(rooms[room]);
  const samuelHost = currentUsers.find(
    (u) => u.role === "host" && u.name.trim().toLowerCase() === "samuel"
  );
  io.to(room).emit("hostStatus", !!samuelHost);
}

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinRoom", ({ room, user }) => {
    if (!room || !user) {
      socket.emit("joinError", "Missing room or user information.");
      return;
    }

    if (!rooms[room]) rooms[room] = {};

    const currentUsers = Object.values(rooms[room]);
    const hosts = currentUsers.filter((u) => u.role === "host");
    const players = currentUsers.filter((u) => u.role === "player");
    const normalizedName = user.name.trim().toLowerCase();

    // 1. Only Samuel can be host
    if (user.role === "host" && normalizedName !== "samuel") {
      socket.emit("joinError", "Only Samuel can be the host.");
      return;
    }

    // 2. Prevent any other Samuel if Samuel already host
    const samuelHost = hosts.find(
      (u) => u.name.trim().toLowerCase() === "samuel"
    );
    if (samuelHost) {
      if (normalizedName === "samuel" && socket.id !== samuelHost.socketId) {
        socket.emit(
          "joinError",
          'Another "Samuel" is already the host. You cannot join.'
        );
        return;
      }
    }

    // 3. Players cannot join before Samuel (host)
    if (user.role === "player" && !samuelHost) {
      socket.emit(
        "joinError",
        "Samuel (host) must join before players can join."
      );
      return;
    }

    // 4. Max players limit
    if (user.role === "player" && players.length >= 11) {
      socket.emit("joinError", "Lobby is full for players.");
      return;
    }

    // 5. Name taken check (any user)
    const nameTakenByOther = currentUsers.some(
      (u) =>
        u.name.trim().toLowerCase() === normalizedName &&
        u.socketId !== socket.id
    );
    if (nameTakenByOther) {
      socket.emit("joinError", `User name "${user.name}" is already taken.`);
      return;
    }

    // 6. Remove previous Samuel host on reconnect (if host)
    if (user.role === "host" && normalizedName === "samuel") {
      for (const [id, u] of Object.entries(rooms[room])) {
        if (
          u.role === "host" &&
          u.name.trim().toLowerCase() === "samuel" &&
          id !== socket.id
        ) {
          const oldSocket = io.sockets.sockets.get(id);
          if (oldSocket) oldSocket.disconnect(true);
          delete rooms[room][id];
          io.to(room).emit(
            "message",
            `Previous host Samuel disconnected due to reconnection.`
          );
        }
      }
    }

    // Add user to room
    rooms[room][socket.id] = { ...user, socketId: socket.id };
    socket.join(room);

    console.log(
      `Socket ${socket.id} joined room ${room} as "${user.name}" with role "${user.role}"`
    );
    console.log(`Users currently in room ${room}:`, Object.values(rooms[room]));

    // Emit updates
    const updatedPlayers = Object.values(rooms[room]);
    socket.emit("playerList", updatedPlayers);
    socket.to(room).emit("playerList", updatedPlayers);
    io.to(room).emit("message", `User ${user.name} joined the room`);

    // Emit host status update
    emitHostStatus(room);
  });

  // Handle player joining the battlefield
  socket.on("joinBattleField", ({ room }) => {
    if (!rooms[room] || !rooms[room][socket.id]) {
      socket.emit("message", "You must join the lobby room first.");
      return;
    }

    if (!battlefieldPlayers[room]) {
      battlefieldPlayers[room] = new Set();
    }

    battlefieldPlayers[room].add(socket.id);

    const battlefieldUsers = Array.from(battlefieldPlayers[room])
      .map((id) => rooms[room][id])
      .filter(Boolean);

    io.to(room).emit("battlefieldPlayers", battlefieldUsers);
    io.to(room).emit("playerJoinedBattlefield", rooms[room][socket.id]); // 👈 emits just the joiner for LobbySidebar.js
  });

  // Handle game start event
  socket.on("startGame", ({ room }) => {
    if (!rooms[room] || !rooms[room][socket.id]) {
      socket.emit("message", "You must join the lobby room first.");
      return;
    }

    const user = rooms[room][socket.id];
    if (user.role !== "host" || user.name.trim().toLowerCase() !== "samuel") {
      socket.emit("message", "Only host Samuel can start the game.");
      return;
    }

    // ✅ Clear battlefield players at the start of a new game
    battlefieldPlayers[room] = new Set();

    // ✅ Just announce the game start — don't auto-join anyone
    io.to(room).emit("gameStarted", { startedBy: user.name });

    console.log(`Game started in room ${room} by host Samuel.`);
  });

  // Handle game end event
  socket.on("endGame", ({ room }) => {
    if (!rooms[room] || !rooms[room][socket.id]) {
      socket.emit("message", "You must join the lobby room first.");
      return;
    }

    const user = rooms[room][socket.id];
    if (user.role !== "host" || user.name.trim().toLowerCase() !== "samuel") {
      socket.emit("message", "Only host Samuel can end the game.");
      return;
    }

    io.to(room).emit("gameEnded", { endedBy: user.name });

    console.log(`Game ended in room ${room} by host Samuel.`);
  });

  // Remove a player from the room by host
  socket.on("removePlayer", ({ room, socketIdToRemove }) => {
    if (!rooms[room]) return;

    const user = rooms[room][socket.id];
    if (!user || user.role !== "host" || user.name.trim().toLowerCase() !== "samuel") {
      socket.emit("message", "Only host Samuel can remove players.");
      return;
    }

    if (rooms[room][socketIdToRemove]) {
      // Notify the player being removed
      const playerSocket = io.sockets.sockets.get(socketIdToRemove);
      if (playerSocket) {
        playerSocket.emit("removedFromLobby", "You have been removed from the lobby by the host.");
        playerSocket.disconnect(true);
      }
      delete rooms[room][socketIdToRemove];

      // Also remove from battlefield players if present
      if (battlefieldPlayers[room]) {
        battlefieldPlayers[room].delete(socketIdToRemove);
      }

      // Update everyone in the room
      const updatedPlayers = Object.values(rooms[room]);
      io.to(room).emit("playerList", updatedPlayers);
      io.to(room).emit("message", "A player has been removed by the host.");
    }
  });

  // Handle leaving the battlefield
  socket.on("leaveBattlefield", ({ room }) => {
    if (!rooms[room] || !rooms[room][socket.id]) return;

    if (battlefieldPlayers[room]) {
      battlefieldPlayers[room].delete(socket.id);

      const battlefieldUsers = Array.from(battlefieldPlayers[room])
        .map((id) => rooms[room][id])
        .filter(Boolean);

      io.to(room).emit("battlefieldPlayers", battlefieldUsers);
      io.to(room).emit("playerLeftBattlefield", rooms[room][socket.id]); // 👈 emits just the leaver
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    for (const room of Object.keys(rooms)) {
      if (rooms[room][socket.id]) {
        const user = rooms[room][socket.id];
        delete rooms[room][socket.id];

        if (battlefieldPlayers[room]) {
          battlefieldPlayers[room].delete(socket.id);

          const battlefieldUsers = Array.from(battlefieldPlayers[room])
            .map((id) => rooms[room][id])
            .filter(Boolean);

          io.to(room).emit("battlefieldPlayers", battlefieldUsers);
          io.to(room).emit(
            "message",
            `${user.name} left the battlefield.` // Fix here: user was undefined
          );
        }

        console.log(`Socket ${socket.id} ("${user.name}") left room ${room}`);
        io.to(room).emit("playerList", Object.values(rooms[room]));
        io.to(room).emit("message", `User ${user.name} left the room`);
        emitHostStatus(room);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
