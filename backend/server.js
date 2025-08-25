// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 5000;
const MAX_PLAYERS = 10;

// Predefined users
const users = {
  creator: { username: "Samuel", password: "creatorPass" },
  host: { username: "DM", password: "hostPass" },
};

// Lobby state
let creator = null; // { id, username, role }
let host = null; // { id, username, role }
let players = []; // array of { id, username, role }
let battlefieldPlayers = []; // array of player ids
let gameStarted = false; // NEW game state

const emitLobby = () => {
  io.emit("lobbyUpdate", {
    creator,
    host,
    players,
    battlefieldPlayers,
    gameStarted,
  });
};

// --- Login endpoint ---
app.post("/login", (req, res) => {
  const { role, username, password } = req.body;

  if (role === "creator" || role === "creator & host") {
    if (creator)
      return res.json({ success: false, message: "Creator already logged in." });
    if (
      username === users.creator.username &&
      password === users.creator.password
    ) {
      creator = { id: uuidv4(), username, role };
      if (role === "creator & host") host = creator;
      emitLobby();
      return res.json({
        success: true,
        message: "Creator logged in.",
        id: creator.id,
      });
    }
    return res.json({ success: false, message: "Invalid Creator credentials." });
  }

  if (!creator)
    return res.json({
      success: false,
      message: "Lobby closed until Creator logs in.",
    });

  if (role === "host") {
    if (host)
      return res.json({ success: false, message: "Host already logged in." });
    if (username === users.host.username && password === users.host.password) {
      host = { id: uuidv4(), username, role: "host" };
      emitLobby();
      return res.json({
        success: true,
        message: "Host logged in.",
        id: host.id,
      });
    }
    return res.json({ success: false, message: "Invalid Host credentials." });
  }

  if (role === "player") {
    if (players.length >= MAX_PLAYERS)
      return res.json({
        success: false,
        message: "Lobby full for players.",
      });
    if (players.some((p) => p.username === username))
      return res.json({
        success: false,
        message: "Player already logged in.",
      });

    const newPlayer = { id: uuidv4(), username, role: "player" };
    players.push(newPlayer);
    emitLobby();
    return res.json({
      success: true,
      message: "Player logged in.",
      id: newPlayer.id,
    });
  }

  return res.json({ success: false, message: "Invalid role." });
});

// --- Logout endpoint ---
app.post("/logout", (req, res) => {
  const { role, id } = req.body;
  if (role === "creator" || role === "creator & host") {
    creator = null;
    if (role === "creator & host") host = null;
  } else if (role === "host") {
    host = null;
  } else if (role === "player") {
    players = players.filter((p) => p.id !== id);
    battlefieldPlayers = battlefieldPlayers.filter((pid) => pid !== id);
  }
  emitLobby();
  res.json({ success: true, message: `${role} logged out.` });
});

// --- Clear Lobby endpoint (REST) ---
app.post("/clear-lobby", (req, res) => {
  creator = null;
  host = null;
  players = [];
  battlefieldPlayers = [];
  gameStarted = false;
  emitLobby();
  res.json({ success: true, message: "Lobby cleared." });
});

// --- Socket.io events ---
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.emit("lobbyUpdate", { creator, host, players, battlefieldPlayers, gameStarted });

  // Dice rolling
  socket.on("rollDice", (data) => {
    const sides = parseInt(data.diceType.slice(1));
    const diceValue = Math.floor(Math.random() * sides) + 1;
    io.emit("diceRolled", {
      username: data.username,
      diceValue,
      diceType: data.diceType,
    });
  });

  // Join battlefield
  socket.on("joinBattlefield", (id) => {
    if (!battlefieldPlayers.includes(id)) battlefieldPlayers.push(id);
    emitLobby();
  });

  // Leave battlefield
  socket.on("leaveBattlefield", (id) => {
    battlefieldPlayers = battlefieldPlayers.filter((pid) => pid !== id);
    emitLobby();
  });

  // Remove player
  socket.on("removePlayer", (id) => {
    players = players.filter((p) => p.id !== id);
    battlefieldPlayers = battlefieldPlayers.filter((pid) => pid !== id);
    emitLobby();
  });

  // Leave lobby via socket
  socket.on("leaveLobby", (playerId, callback) => {
    const index = players.findIndex((p) => p.id === playerId);
    if (index !== -1) {
      players.splice(index, 1);
      battlefieldPlayers = battlefieldPlayers.filter((pid) => pid !== playerId);
      emitLobby();
      if (callback) callback(true);
    } else {
      if (callback) callback(false);
    }
  });

  // --- NEW: Game start/end ---
  socket.on("startGame", () => {
    gameStarted = true;
    emitLobby();
  });

  socket.on("endGame", () => {
    gameStarted = false;
    emitLobby();
  });

  // --- NEW: Clear lobby via socket ---
  socket.on("clearLobby", (data) => {
    if (data.role === "creator" || data.role === "host") {
      creator = null;
      host = null;
      players = [];
      battlefieldPlayers = [];
      gameStarted = false;
      emitLobby();
    }
  });

  socket.on("disconnect", () => console.log("A user disconnected"));
});

server.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
