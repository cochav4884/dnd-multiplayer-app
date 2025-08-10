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
  // Handle player joining the battlefield
  socket.on("joinBattleField", (data) => {
    if (!data || !data.room) {
      console.warn("joinBattleField called with invalid data:", data);
      socket.emit("message", "Invalid battlefield join request.");
      return;
    }

    const room = data.room;

    if (!rooms[room] || !rooms[room][socket.id]) {
      socket.emit("message", "You must join the lobby room first.");
      return;
    }

    if (!battlefieldPlayers[room]) {
      battlefieldPlayers[room] = new Set();
    }

    battlefieldPlayers[room].add(socket.id);
    console.log("Battlefield players after joining:", battlefieldPlayers[room]);

    const battlefieldUsers = Array.from(battlefieldPlayers[room])
      .map((id) => rooms[room][id])
      .filter(Boolean); // filter out any undefined users

    console.log("Emitting battlefield players:", battlefieldUsers);
    io.to(room).emit("battlefieldPlayers", battlefieldUsers);
    io.to(room).emit(
      "message",
      `${rooms[room][socket.id].name} joined the battlefield.`
    );
  });

  // Handle game start event
  // Handle game start event
  socket.on("startGame", (data) => {
    if (!data || !data.room) {
      console.warn("startGame called with invalid data:", data);
      socket.emit("message", "Invalid game start request.");
      return;
    }

    const room = data.room;

    if (!rooms[room] || !rooms[room][socket.id]) {
      socket.emit("message", "You must join the lobby room first.");
      return;
    }

    const user = rooms[room][socket.id];

    if (user.role !== "host" || user.name.trim().toLowerCase() !== "samuel") {
      socket.emit("message", "Only host Samuel can start the game.");
      return;
    }

    io.to(room).emit("gameStarted", { startedBy: user.name });

    console.log(`Game started in room ${room} by host Samuel.`);

    // Emit battlefield players even after the game starts
    if (battlefieldPlayers[room]) {
      const battlefieldUsers = Array.from(battlefieldPlayers[room])
        .map((id) => rooms[room][id])
        .filter(Boolean);

      console.log(
        "Emitting battlefield players at game start:",
        battlefieldUsers
      );
      io.to(room).emit("battlefieldPlayers", battlefieldUsers);
    }
  });

  socket.on("clearRoom", (room) => {
    if (rooms[room]) {
      const socketsInRoom = Object.keys(rooms[room]);

      socketsInRoom.forEach((socketId) => {
        const sock = io.sockets.sockets.get(socketId);
        if (sock) {
          sock.emit("forceLeave", "Lobby has been cleared by host.");
        }
      });

      delete rooms[room];
      delete battlefieldPlayers[room];

      io.to(room).emit("playerList", []);
      io.to(room).emit("message", `Room ${room} has been cleared.`);
      io.to(room).emit("hostStatus", false);

      socketsInRoom.forEach((socketId) => {
        const sock = io.sockets.sockets.get(socketId);
        if (sock) {
          sock.disconnect(true);
        }
      });
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
      io.to(room).emit(
        "message",
        `${rooms[room][socket.id].name} returned to the lobby.`
      );
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
            `${rooms[room][socket.id].name} left the battlefield.`
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
