const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // TODO: Change to your frontend URL in production
    methods: ['GET', 'POST'],
  },
});

// In-memory store for users per room:
// rooms = { roomName: { socketId: { name, role } } }
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', ({ room, user }) => {
    console.log('joinRoom data received:', { room, user });

    // Initialize room if it doesn't exist
    if (!rooms[room]) rooms[room] = {};

    const currentUsers = Object.values(rooms[room]);
    const hosts = currentUsers.filter(u => u.role === 'host');
    const players = currentUsers.filter(u => u.role === 'player');

    // Enforce max hosts and players limits
    if (user.role === 'host' && hosts.length >= 1) {
      socket.emit('joinError', 'Lobby is full for hosts.');
      return;
    }
    if (user.role === 'player' && players.length >= 10) {
      socket.emit('joinError', 'Lobby is full for players.');
      return;
    }

    // Add user to room
    socket.join(room);
    rooms[room][socket.id] = user;

    console.log(`Socket ${socket.id} joined room ${room}`);
    console.log('Broadcasting player list:', Object.values(rooms[room]));

    // Broadcast updated player list to room
    io.to(room).emit('playerList', Object.values(rooms[room]));

    // Notify room of new user join
    io.to(room).emit('message', `User ${user.name} joined the room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove user from rooms and update remaining players
    for (const room of Object.keys(rooms)) {
      if (rooms[room][socket.id]) {
        const user = rooms[room][socket.id];
        delete rooms[room][socket.id];

        io.to(room).emit('playerList', Object.values(rooms[room]));
        io.to(room).emit('message', `User ${user.name} left the room`);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
