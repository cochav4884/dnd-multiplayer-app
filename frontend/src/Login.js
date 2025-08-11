import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from './UserContext';

export default function Login() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('player');
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSubmit = e => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter your name');
    setUser({ name: name.trim(), role });
    navigate('/lobby');
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Name:</label>
          <input
            type="text"
            className="form-control"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Role:</label>
          <select
            className="form-select"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="player">Player</option>
            <option value="host">Host (Dungeon Master)</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">Enter Game</button>
      </form>
    </div>
  );
}
