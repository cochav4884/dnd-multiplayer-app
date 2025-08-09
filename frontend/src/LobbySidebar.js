// src/LobbySidebar.js
import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import { socket } from "./socket";
import { useNavigate } from "react-router-dom";
import "./LobbySidebar.css"; // Optional: if you have custom styles

export default function LobbySidebar() {
  const { user, setUser } = useContext(UserContext);
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    socket.connect();

    socket.emit("joinRoom", { room: "game-room-1", user });

    socket.on("playerList", (list) => {
      setPlayers(list);
    });

    return () => {
      socket.off("playerList");
      socket.disconnect();
    };
  }, [user]);

  const handleLeave = () => {
    socket.disconnect();
    setUser(null);
    navigate("/");
  };

  return (
    <div className="lobby-sidebar">
      <h3>Welcome, {user?.name}!</h3>
      <p>
        Role: <strong>{user?.role}</strong>
      </p>

      <h4>Players in Lobby:</h4>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {players.map((p, index) => (
          <li key={index}>
            {p.name} — <em>{p.role}</em>
          </li>
        ))}
      </ul>

      <button className="leave-button" onClick={handleLeave}>
        Leave Lobby
      </button>
    </div>
  );
}
