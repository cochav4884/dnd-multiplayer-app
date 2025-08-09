import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import { socket } from "./socket";
import { useNavigate } from "react-router-dom";
import "./LobbySidebar.css"; // Optional styles

export default function LobbySidebar() {
  const { user, setUser } = useContext(UserContext);
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Connect socket manually since autoConnect is false
    socket.connect();

    // Attempt to join the game room with user info
    socket.emit("joinRoom", { room: "game-room-1", user });

    // Listen for join errors (e.g., lobby full)
    socket.on("joinError", (message) => {
      alert(message);         // Notify user of the problem
      setUser(null);          // Clear user context to force logout
      socket.disconnect();    // Cleanly disconnect socket
      navigate("/");          // Redirect to login page
    });

    // Listen for updated player list in the room
    socket.on("playerList", (list) => {
      setPlayers(list);
    });

    // Cleanup on component unmount or when user changes
    return () => {
      socket.off("playerList");
      socket.off("joinError");
      socket.disconnect();
    };
  }, [user, setUser, navigate]);

  // Handle leaving the lobby manually
  const handleLeave = () => {
    socket.disconnect();
    setUser(null);
    navigate("/");
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="lobby-sidebar">
      <h3>Welcome, {user.name}!</h3>
      <p>
        Role: <strong>{user.role}</strong>
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
