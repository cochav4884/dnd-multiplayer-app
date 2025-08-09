import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Lobby from './Lobby';
import { UserContext } from './UserContext';

function App() {
  const { user } = useContext(UserContext);

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/lobby" /> : <Login />} />
      <Route path="/lobby" element={user ? <Lobby /> : <Navigate to="/" />} />
      {/* Add more routes here as you build */}
    </Routes>
  );
}

export default App;
