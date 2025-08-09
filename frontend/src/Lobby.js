import React, { useContext, useEffect } from 'react';
import { UserContext } from './UserContext';
import { socket } from './socket';

export default function Lobby() {
  const { user } = useContext(UserContext);

  useEffect(() => {
    socket.connect();

    socket.emit('joinRoom', 'game-room-1');

    socket.on('message', (msg) => {
      console.log('Received message:', msg);
    });

    return () => {
      socket.off('message');
      socket.disconnect();
    };
  }, []);

  return (
    <div className="container mt-5">
      <h2>Welcome, {user.name}!</h2>
      <p>You are logged in as <strong>{user.role}</strong>.</p>
      <p>This is the lobby. More game features coming soon!</p>
    </div>
  );
}
