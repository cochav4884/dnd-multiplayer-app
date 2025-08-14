import React, { useState, useEffect } from "react";
import { socket } from "./socket"; // Make sure this imports your Socket.io client
import "./LobbySidebar.css";

export default function LobbySidebar({ userRole, gameStarted, onStartGame, onEndGame }) {
  const [inBattlefield, setInBattlefield] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [creator, setCreator] = useState(null);
  const [host, setHost] = useState(null);
  const [players, setPlayers] = useState([]);

  // Listen for real-time lobby updates from backend
  useEffect(() => {
    socket.on("lobbyUpdate", (lobby) => {
      setCreator(lobby.creator);
      setHost(lobby.host);
      setPlayers(lobby.players || []);
    });

    // Clean up on unmount
    return () => {
      socket.off("lobbyUpdate");
    };
  }, []);

  const handleJoinBattlefield = () => setInBattlefield(true);
  const handleLeaveBattlefield = () => setInBattlefield(false);
  const toggleFullScreen = () => setIsFullScreen((prev) => !prev);

  const handleOpenBattlefield = () => {
    if (!gameStarted) onStartGame();
  };

  const handleLeaveLobby = () => {
    alert("You have left the lobby.");
    window.location.reload();
  };

  const handleRemovePlayer = async (playerName) => {
    try {
      await fetch("http://localhost:5000/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "player", username: playerName }),
      });
      alert(`${playerName} removed from lobby`);
    } catch (err) {
      console.error("Failed to remove player:", err);
    }
  };

  return (
    <div className={`lobby-sidebar ${isFullScreen ? "hidden" : ""}`}>
      <h2>Lobby</h2>

      {/* Creator and Host */}
      <ul className="player-list">
        {creator && <li>{creator} (Creator)</li>}
        {host && host !== creator && <li>{host} (Host)</li>}
      </ul>

      {/* Players */}
      <ul className="player-list">
        {players.map((p) => (
          <li key={p}>
            {p}
            {(userRole === "host" || userRole === "creator") && (
              <button onClick={() => handleRemovePlayer(p)}>Remove</button>
            )}
          </li>
        ))}
      </ul>

      {/* Host buttons */}
      {(userRole === "host" || userRole === "creator") && (
        <div className="host-buttons">
          {!gameStarted && (
            <>
              <button onClick={handleLeaveLobby}>Leave Lobby</button>
              <button onClick={handleOpenBattlefield}>Open Battlefield</button>
              <button onClick={onStartGame}>Start Game</button>
            </>
          )}
          {gameStarted && <button onClick={onEndGame}>End Game</button>}
        </div>
      )}

      {/* Player buttons */}
      {userRole === "player" && (
        <div className="player-buttons">
          <button onClick={handleLeaveLobby}>Leave Lobby</button>
          {!inBattlefield && gameStarted && <button onClick={handleJoinBattlefield}>Join Battlefield</button>}
          {inBattlefield && <button onClick={handleLeaveBattlefield}>Leave Battlefield</button>}
        </div>
      )}

      {/* Full-Screen toggle */}
      <button className="fullscreen-button" onClick={toggleFullScreen}>
        {isFullScreen ? "Exit Full-Screen" : "Full-Screen"}
      </button>
    </div>
  );
}
