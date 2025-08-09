import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";
import Lobby from "./Lobby";
import { UserContext } from "./UserContext";
import "./App.css"; // load styles including grid
import BackgroundBuilder from "./components/BackgroundBuilder";
import Grid from "./components/Grid";

function App() {
  const { user } = useContext(UserContext);

  return (
    <div className="app-container">
      {/* Grid overlay */}
      <div className="grid-overlay"></div>

      {/* Foreground content */}
      <div className="app-content">
        <Routes>
          <Route
            path="/"
            element={user ? <Navigate to="/lobby" /> : <Login />}
          />
          <Route
            path="/lobby"
            element={user ? <Lobby /> : <Navigate to="/" />}
          />
          <Route path="/background-builder" element={<BackgroundBuilder />} />
          {/* Add more routes here */}
        </Routes>
      </div>
    </div>
  );
}

export default App;