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
  const [isHost, setIsHost] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hasJoinedBattlefield, setHasJoinedBattlefield] = useState(false);
  const navigate = useNavigate();

  useSocketJoin(user);

  useEffect(() => {
    const onPlayerList = (list) => {
      console.log("Received player list:", list);
      setPlayers(list);
    };

    const onHostStatus = (status) => {
      console.log("Host status received:", status);
      setIsHost(status);
    };

    const onGameStarted = () => {
      console.log("Game started");
      setGameStarted(true);
    };

    socket.on("playerList", onPlayerList);
    socket.on("hostStatus", onHostStatus);
    socket.on("gameStarted", onGameStarted);

    return () => {
      socket.off("playerList", onPlayerList);
      socket.off("hostStatus", onHostStatus);
      socket.off("gameStarted", onGameStarted);
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
      setPlayers([]);
      setHasJoinedBattlefield(false);
      setGameStarted(false);
    }
  };

  const handleJoinBattlefield = () => {
    socket.emit("joinBattlefield", { user });
    setHasJoinedBattlefield(true);
  };

  const handleStartGame = () => {
    socket.emit("startGame");
    setGameStarted(true);
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

      {!gameStarted && user.role === "player" && !hasJoinedBattlefield && (
        <>
          {/* Only allow joining battlefield if Samuel (host) is present */}
          {isHost ? (
            <button
              className="join-battlefield-button"
              onClick={handleJoinBattlefield}
            >
              Join Battlefield
            </button>
          ) : (
            <p>You cannot join the game until Samuel (host) has joined.</p>
          )}
        </>
      )}

      {!gameStarted && user.role === "host" && isHost && (
        <button
          className="start-game-button"
          onClick={handleStartGame}
          disabled={players.filter((p) => p.role === "player").length === 0}
          title={
            players.filter((p) => p.role === "player").length === 0
              ? "No players to start the game"
              : ""
          }
        >
          Start Game
        </button>
      )}

      <button className="leave-button" onClick={handleLeave}>
        Leave Lobby
      </button>

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
    </div>
  );
}
