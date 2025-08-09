import React, { useContext, useEffect, useState, useRef } from "react";
import { UserContext } from "./UserContext";
import { socket } from "./socket";
import { useNavigate } from "react-router-dom";
import "./LobbySidebar.css";

// Custom hook to join socket room once per user session
function useSocketJoin(user, room = "game-room-1") {
  const hasJoined = useRef(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  useEffect(() => {
    if (!user) return;

    if (!socket.connected) {
      socket.connect();
    }

    if (!hasJoined.current) {
      console.log("Emitting joinRoom for user:", user);
      socket.emit("joinRoom", { room, user });
      hasJoined.current = true;
    }

    socket.on("joinError", (message) => {
      let friendlyMessage = message;

      if (message === "Samuel is already the host.") {
        friendlyMessage = "Lobby is full for hosts.";
      } else if (message === "Only Samuel can be the host.") {
        friendlyMessage = "You must be Samuel to host the lobby.";
      }

      alert(friendlyMessage);
      setUser(null);
      socket.disconnect();
      navigate("/");
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("joinError");
    };
  }, [user, room, navigate, setUser]);
}

export default function LobbySidebar() {
  const { user, setUser } = useContext(UserContext);
  const [players, setPlayers] = useState([]);
  const navigate = useNavigate();

  // Use the custom hook to join socket room once
  useSocketJoin(user);

  useEffect(() => {
    // Listen for player list updates
    socket.on("playerList", (list) => {
      console.log("Received player list:", list);
      setPlayers(list);
    });

    socket.on("message", (msg) => {
      console.log("Server message:", msg);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("playerList");
      socket.off("message");
    };
  }, []);

  const handleLeave = () => {
    socket.disconnect();
    setUser(null);
    navigate("/");
  };

  const handleClearLobby = () => {
    console.log("Clear lobby requested");
    socket.emit("clearRoom", "game-room-1");
    setPlayers([]); // Immediately clear on client side too
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
      {players.length === 0 ? (
        <p>No one in the lobby yet.</p>
      ) : (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
          {players.map((p, i) => (
            <li key={i}>
              {p.name} — <em>{p.role}</em>
            </li>
          ))}
        </ul>
      )}

      <button className="leave-button" onClick={handleLeave}>
        Leave Lobby
      </button>

      {user.role === "host" && user.name === "Samuel" && (
        <button
          className="clear-lobby-button"
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to clear the lobby? This will remove all players."
              )
            ) {
              handleClearLobby();
            }
          }}
          style={{
            marginTop: "1rem",
            backgroundColor: "#e74c3c",
            color: "white",
          }}
        >
          Clear Lobby
        </button>
      )}
    </div>
  );
}
