const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 5000;
const MAX_PLAYERS = 10;

// Users and login flags
const users = {
  creator: { username: 'Samuel', password: 'creatorPass' },
  host: { username: 'DM', password: 'hostPass' },
};

let creator = null; // { id, username, role }
let host = null;    // { id, username, role }
let players = [];   // array of { id, username, role }

// Battlefield tracking
let battlefieldPlayers = []; // array of player ids

// Emit current lobby state
const emitLobby = () => {
  io.emit('lobbyUpdate', {
    creator,
    host,
    players,
    battlefieldPlayers,
  });
};

// Login endpoint
app.post('/login', (req, res) => {
  const { role, username, password } = req.body;

  if (role === 'creator') {
    if (creator) return res.json({ success: false, message: 'Creator already logged in.' });
    if (username === users.creator.username && password === users.creator.password) {
      creator = { id: uuidv4(), username, role: 'creator' };
      emitLobby();
      return res.json({ success: true, message: 'Creator logged in.', id: creator.id });
    }
    return res.json({ success: false, message: 'Invalid Creator credentials.' });
  }

  if (!creator) return res.json({ success: false, message: 'Lobby closed until Creator logs in.' });

  if (role === 'host') {
    if (host) return res.json({ success: false, message: 'Host already logged in.' });
    if (username === users.host.username && password === users.host.password) {
      host = { id: uuidv4(), username, role: 'host' };
      emitLobby();
      return res.json({ success: true, message: 'Host logged in.', id: host.id });
    }
    return res.json({ success: false, message: 'Invalid Host credentials.' });
  }

  if (role === 'player') {
    if (!host) return res.json({ success: false, message: 'Wait for host to log in.' });
    if (players.length >= MAX_PLAYERS) return res.json({ success: false, message: 'Lobby full for players.' });
    if (players.some(p => p.username === username)) return res.json({ success: false, message: 'Player already logged in.' });

    const newPlayer = { id: uuidv4(), username, role: 'player' };
    players.push(newPlayer);
    emitLobby();
    return res.json({ success: true, message: 'Player logged in.', id: newPlayer.id });
  }

  return res.json({ success: false, message: 'Invalid role.' });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  const { role, id } = req.body;

  if (role === 'creator') creator = null;
  if (role === 'host') host = null;
  if (role === 'player') {
    players = players.filter(p => p.id !== id);
    battlefieldPlayers = battlefieldPlayers.filter(pid => pid !== id);
  }

  emitLobby();
  res.json({ success: true, message: `${role} logged out.` });
});

// Clear lobby endpoint
app.post("/clear-lobby", (req, res) => {
  creator = null;
  host = null;
  players = [];
  battlefieldPlayers = [];
  emitLobby();
  res.json({ success: true, message: "Lobby cleared." });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.emit('lobbyUpdate', { creator, host, players, battlefieldPlayers });

  // Roll Dice (example)
  socket.on('rollDice', (data) => {
  let sides = 6; // default d6
  switch (data.diceType) {
    case 'd4': sides = 4; break;
    case 'd6': sides = 6; break;
    case 'd8': sides = 8; break;
    case 'd10': sides = 10; break;
    case 'd20': sides = 20; break;
    case 'd50': sides = 50; break;
  }
  const diceValue = Math.floor(Math.random() * sides) + 1;
  io.emit('diceRolled', { username: data.username, diceValue, type: data.diceType });
});


  // Player joins battlefield
  socket.on('joinBattlefield', (id) => {
    if (!battlefieldPlayers.includes(id)) {
      battlefieldPlayers.push(id);
      emitLobby();
    }
  });

  // Player leaves battlefield
  socket.on('leaveBattlefield', (id) => {
    battlefieldPlayers = battlefieldPlayers.filter(pid => pid !== id);
    emitLobby();
  });

  // Host removes player
  socket.on('removePlayer', (id) => {
    players = players.filter(p => p.id !== id);
    battlefieldPlayers = battlefieldPlayers.filter(pid => pid !== id);
    emitLobby();
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
