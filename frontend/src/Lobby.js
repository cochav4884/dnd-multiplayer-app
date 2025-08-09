import React, { useContext, useEffect, useState } from 'react';
import { UserContext } from './UserContext';
import { socket } from './socket';
import { useNavigate } from 'react-router-dom';

export default function Lobby() {
  const { user, setUser } = useContext(UserContext);
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    socket.connect();

    console.log('Joining room with user:', user);  // DEBUG: log user sent to backend
    socket.emit('joinRoom', { room: 'game-room-1', user });

    socket.on('playerList', (list) => {
      console.log('Received player list:', list);  // DEBUG: log player list from backend
      setPlayers(list);
    });

    socket.on('message', (msg) => {
      console.log('Received message:', msg);
    });

    return () => {
      socket.off('playerList');
      socket.off('message');
      socket.disconnect();
    };
  }, [user]);

  function handleLeave() {
    socket.disconnect();
    setUser(null);
    navigate('/');
  }

  return (
    <div className="container mt-5">
      <h2>Welcome, {user.name}!</h2>
      <p>You are logged in as <strong>{user.role}</strong>.</p>

      <h4>Players in Lobby:</h4>
      <ul>
        {players.map((p, i) => (
          <li key={i}>
            {p.name} — <em>{p.role}</em>
          </li>
        ))}
      </ul>

      <button className="btn btn-danger mt-3" onClick={handleLeave}>
        Leave Lobby
      </button>

      <p>This is the lobby. More game features coming soon!</p>
    </div>
  );
}
