// src/LobbySidebar.js
import React, { useState, useEffect } from "react";
import { socket } from "./socket"; // use your existing socket.js
import "./LobbySidebar.css";

export default function LobbySidebar({ userRole, gameStarted, onStartGame, onEndGame }) {
  const [inBattlefield, setInBattlefield] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [creator, setCreator] = useState(null);
  const [host, setHost] = useState(null);
  const [players, setPlayers] = useState([]);
  const [diceResult, setDiceResult] = useState(null);

  // Connect to socket and listen for lobby updates
  useEffect(() => {
    socket.on("lobbyUpdate", (lobby) => {
      setCreator(lobby.creator);
      setHost(lobby.host);
      setPlayers(lobby.players || []);
    });

    socket.on("diceRolled", (data) => {
      setDiceResult({ username: data.username, value: data.diceValue });
    });

    return () => {
      socket.off("lobbyUpdate");
      socket.off("diceRolled");
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

  const handleRemovePlayer = (playerName) => {
    // Optional: send logout request for player removal
    fetch("http://localhost:5000/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "player", username: playerName }),
    });
    setPlayers((prev) => prev.filter((p) => p !== playerName));
  };

  const handleRollDice = () => {
    socket.emit("rollDice", { username: userRole === "player" ? "Player" : userRole });
  };

  return (
    <div className={`lobby-sidebar ${isFullScreen ? "hidden" : ""}`}>
      <h2>Lobby</h2>

      {/* Creator and Host */}
      <ul className="player-list">
        {creator && <li>{creator} {userRole === "host" || userRole === "creator" ? "(Creator)" : ""}</li>}
        {host && host !== creator && <li>{host} {userRole === "host" || userRole === "creator" ? "(Host)" : ""}</li>}
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

      {/* Dice roll area */}
      <div className="dice-area">
        <button className="roll-dice-btn" onClick={handleRollDice}>Roll Dice</button>
        {diceResult && (
          <p className="dice-result">{diceResult.username} rolled a {diceResult.value}</p>
        )}
      </div>

      {/* Host buttons */}
      {(userRole === "host" || userRole === "creator") && (
        <div className="host-buttons">
          {!gameStarted ? (
            <>
              <button onClick={handleLeaveLobby}>Leave Lobby</button>
              <button onClick={handleOpenBattlefield}>Open Battlefield</button>
              <button onClick={onStartGame}>Start Game</button>
            </>
          ) : (
            <button onClick={onEndGame}>End Game</button>
          )}
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
