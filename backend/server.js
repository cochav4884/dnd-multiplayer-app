const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = 5000;

// In-memory store
let creatorLoggedIn = false;
let hostLoggedIn = false;
let players = [];
const MAX_PLAYERS = 10;

// Hardcoded users
const users = {
  creator: { username: 'Samuel', password: 'creatorPass' },
  host: { username: 'DM', password: 'hostPass' },
};

// Function to emit current lobby to all clients
const emitLobby = () => {
  io.emit('lobbyUpdate', {
    creator: creatorLoggedIn ? users.creator.username : null,
    host: hostLoggedIn && !creatorLoggedIn ? users.host.username : null,
    players,
  });
};

// Login route
app.post('/login', (req, res) => {
  const { role, username, password } = req.body;

  if (role === 'creator') {
    if (username === users.creator.username && password === users.creator.password) {
      creatorLoggedIn = true;
      emitLobby();
      return res.json({ success: true, message: 'Creator logged in.' });
    }
    return res.json({ success: false, message: 'Invalid Creator credentials.' });
  }

  if (role === 'creator & host') {
    if (username === users.creator.username && password === users.creator.password) {
      creatorLoggedIn = true;
      hostLoggedIn = true;
      emitLobby();
      return res.json({ success: true, message: 'Creator & Host logged in.' });
    }
    return res.json({ success: false, message: 'Invalid credentials for Creator & Host.' });
  }

  if (!creatorLoggedIn) {
    return res.json({ success: false, message: 'Lobby closed until Creator logs in.' });
  }

  if (role === 'host') {
    if (hostLoggedIn) return res.json({ success: false, message: 'Lobby full for hosts.' });
    if (username === users.host.username && password === users.host.password) {
      hostLoggedIn = true;
      emitLobby();
      return res.json({ success: true, message: 'Host logged in.' });
    }
    return res.json({ success: false, message: 'Invalid Host credentials.' });
  }

  if (role === 'player') {
    if (!hostLoggedIn) return res.json({ success: false, message: 'Wait for host to log in.' });
    if (players.length >= MAX_PLAYERS) return res.json({ success: false, message: 'Lobby full for players.' });
    if (players.includes(username)) return res.json({ success: false, message: 'Player already logged in.' });

    players.push(username);
    emitLobby();
    return res.json({ success: true, message: 'Player logged in.' });
  }

  return res.json({ success: false, message: 'Invalid role.' });
});

// Logout route
app.post('/logout', (req, res) => {
  const { role, username } = req.body;

  if (role === 'creator') creatorLoggedIn = false;
  if (role === 'host') hostLoggedIn = false;
  if (role === 'player') players = players.filter((u) => u !== username);

  emitLobby();
  res.json({ success: true, message: `${role} logged out.` });
});

// Socket connection
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.emit('lobbyUpdate', {
    creator: creatorLoggedIn ? users.creator.username : null,
    host: hostLoggedIn && !creatorLoggedIn ? users.host.username : null,
    players,
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
