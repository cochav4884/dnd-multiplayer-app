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

    if (!hasJoined.current || !socket.connected) {
      console.log("Emitting joinRoom for user:", user);
      socket.emit("joinRoom", { room, user });
      hasJoined.current = true;
    }

    const onJoinError = (message) => {
      let friendlyMessage = message;

      // Map server join errors to user-friendly alerts
      if (message === "Another \"Samuel\" is already the host. You cannot join.") {
        friendlyMessage = "Lobby is full for hosts.";
      } else if (message === "Only Samuel can be the host.") {
        friendlyMessage = "You must be Samuel to host the lobby.";
      } else if (message === "Samuel (host) must join before players can join.") {
        friendlyMessage = "You cannot join until Samuel (host) has joined.";
      }

      alert(friendlyMessage);
      setUser(null);
      socket.disconnect();
      navigate("/");
    };

    socket.on("joinError", onJoinError);

    // Reset hasJoined on disconnect so user can retry joining if reconnecting
    const handleDisconnect = () => {
      console.log("Socket disconnected.");
      hasJoined.current = false;
    };

    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("joinError", onJoinError);
      socket.off("disconnect", handleDisconnect);
    };
  }, [user, room, navigate, setUser]);
}

export default function LobbySidebar() {
  const { user, setUser } = useContext(UserContext);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false); // Track if Samuel is the host
  const navigate = useNavigate();

  // Use the custom hook to join socket room once per user session
  useSocketJoin(user);

  useEffect(() => {
    // Listen for player list updates
    const onPlayerList = (list) => {
      console.log("Received player list:", list);
      setPlayers(list);
    };

    // Listen for host status updates
    const onHostStatus = (status) => {
      console.log("Host status received:", status);
      setIsHost(status);
    };

    // Listen for server messages (optional)
    const onMessage = (msg) => {
      console.log("Server message:", msg);
    };

    socket.on("playerList", onPlayerList);
    socket.on("hostStatus", onHostStatus);
    socket.on("message", onMessage);

    return () => {
      socket.off("playerList", onPlayerList);
      socket.off("hostStatus", onHostStatus);
      socket.off("message", onMessage);
    };
  }, []);

  const handleLeave = () => {
    socket.disconnect();
    setUser(null);
    navigate("/");
  };

  const handleClearLobby = () => {
    if (
      window.confirm(
        "Are you sure you want to clear the lobby? This will remove all players."
      )
    ) {
      console.log("Clear lobby requested");
      socket.emit("clearRoom", "game-room-1");
      setPlayers([]); // Immediately clear on client side too
    }
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

      {/* Only show "Clear Lobby" button if user is Samuel and is the host */}
      {user.role === "host" &&
        user.name.trim().toLowerCase() === "samuel" &&
        isHost && (
          <button
            className="clear-lobby-button"
            onClick={handleClearLobby}
            style={{
              marginTop: "1rem",
              backgroundColor: "#e74c3c",
              color: "white",
            }}
          >
            Clear Lobby
          </button>
        )}

      {/* Display message if players are blocked from joining */}
      {!isHost && user.role === "player" && (
        <p>You cannot join the game until Samuel (host) has joined.</p>
      )}
    </div>
  );
}
