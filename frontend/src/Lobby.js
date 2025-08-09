import React, { useContext } from 'react';
import { UserContext } from './UserContext';

export default function Lobby() {
  const { user } = useContext(UserContext);
  return (
    <div className="container mt-5">
      <h2>Welcome, {user.name}!</h2>
      <p>You are logged in as <strong>{user.role}</strong>.</p>
      <p>This is the lobby. More game features coming soon!</p>
    </div>
  );
}
