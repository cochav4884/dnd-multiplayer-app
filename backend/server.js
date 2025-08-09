const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // update for production
    methods: ['GET', 'POST']
  }
});

// Store users per room: { roomName: { socketId: { name, role } } }
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('joinRoom', ({ room, user }) => {
    console.log('joinRoom data received:', { room, user });  // Debug: show data from client

    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);

    if (!rooms[room]) rooms[room] = {};
    rooms[room][socket.id] = user;

    console.log('Broadcasting player list:', Object.values(rooms[room]));  // Debug

    // Broadcast updated player list to room
    io.to(room).emit('playerList', Object.values(rooms[room]));

    // Inform room someone joined
    io.to(room).emit('message', `User ${user.name} joined the room`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove user from all rooms and broadcast update
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
