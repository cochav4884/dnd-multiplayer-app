// src/components/LobbySidebar.js
import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import Dice from "./components/Dice";
import "./LobbySidebar.css";

export default function LobbySidebar({
  userRole,
  gameStarted,
  battlefieldOpen,
  inBattlefield,
  onOpenBattlefield,
  onStartGame,
  onEndGame,
  onJoinBattlefield,
  onLeaveBattlefield,
  isFullScreen,
  onToggleFullScreen,
}) {
  const [creator, setCreator] = useState(null);
  const [host, setHost] = useState(null);
  const [players, setPlayers] = useState([]);
  const [selectedDie, setSelectedDie] = useState("d6");
  const [diceResult, setDiceResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [dicePosition, setDicePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const diceTypes = ["d4", "d6", "d8", "d10", "d20", "d50"];

  // Lobby updates
  useEffect(() => {
    socket.on("lobbyUpdate", (lobby) => {
      setCreator(lobby.creator);
      setHost(lobby.host);
      setPlayers(lobby.players || []);
    });

    socket.on("diceRolled", (data) => {
      setDiceResult({
        username: data.username,
        value: data.diceValue,
        type: data.diceType,
      });
      setRolling(false);
      setDicePosition({ x: 0, y: 0 });
      setRotation({ x: 0, y: 0 });
    });

    return () => {
      socket.off("lobbyUpdate");
      socket.off("diceRolled");
    };
  }, []);

  const handleRollDice = () => {
    if (!selectedDie) return;
    setRolling(true);
    const startTime = Date.now();
    const duration = 1000; // 1 second

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      // Bounce & random horizontal movement
      const x = Math.random() * 300;
      const y = 100 - Math.sin(t * Math.PI) * 50;

      // Rotation for 3D effect
      const rotX = t * 720;
      const rotY = t * 720;

      setDicePosition({ x, y });
      setRotation({ x: rotX, y: rotY });

      if (t < 1) requestAnimationFrame(animate);
      else {
        setRolling(false);
        socket.emit("rollDice", {
          username: userRole === "player" ? "Player" : userRole,
          diceType: selectedDie,
        });
      }
    };

    requestAnimationFrame(animate);
  };

  const handleLeaveLobby = () => {
    alert("You have left the lobby.");
    window.location.reload();
  };

  const handleRemovePlayer = (playerName) => {
    fetch("http://localhost:5000/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "player", username: playerName }),
    });
    setPlayers((prev) => prev.filter((p) => p !== playerName));
  };

  const handleClearLobby = async () => {
    try {
      const response = await fetch("http://localhost:5000/clear-lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "Samuel" }),
      });
      const data = await response.json();
      if (data.success) {
        alert("Lobby cleared!");
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to clear lobby.");
    }
  };

  return (
    <div className={`lobby-sidebar ${isFullScreen ? "hidden" : ""}`}>
      {/* Player list */}
      <ul className="player-list">
        {creator && <li>{creator} (Creator)</li>}
        {host && host !== creator && <li>{host} (Host)</li>}
        {players.map((p) => (
          <li key={p}>
            {p}
            <button onClick={() => handleRemovePlayer(p)}>Remove</button>
          </li>
        ))}
      </ul>

      {/* Dice selection */}
      <div className="dice-selection">
        <h3>Select Dice</h3>
        <div className="dice-thumbnails">
          {diceTypes.map((die) => (
            <div
              key={die}
              className={selectedDie === die ? "selected-dice" : ""}
              onClick={() => setSelectedDie(die)}
              style={{ cursor: "pointer", display: "inline-block", margin: "5px" }}
            >
              <Dice type={die} size={40} />
            </div>
          ))}
        </div>
      </div>

      {/* Roll Dice */}
      <div className="dice-area">
        <button className="roll-dice-btn" onClick={handleRollDice}>
          Roll Dice
        </button>

        {/* Rolling Dice Render with 3D rotation */}
        {rolling && (
          <div
            style={{
              position: "absolute",
              top: dicePosition.y,
              left: dicePosition.x,
              zIndex: 1000,
              pointerEvents: "none",
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            }}
          >
            <Dice type={selectedDie} size={40} />
          </div>
        )}

        {/* Dice result */}
        {diceResult && (
          <p className="dice-result">
            {diceResult.username} rolled {diceResult.value} on{" "}
            {diceResult.type.toUpperCase()}
          </p>
        )}
      </div>

      {/* Fullscreen button */}
      <button className="fullscreen-button" onClick={onToggleFullScreen}>
        {isFullScreen ? "Exit Full-Screen" : "Full-Screen"}
      </button>

      {/* Player Controls */}
      {userRole === "player" && (
        <div className="lobby-controls">
          <button onClick={handleLeaveLobby}>Leave Lobby</button>
          {!inBattlefield && gameStarted && (
            <button onClick={onJoinBattlefield}>Join Battlefield</button>
          )}
          {inBattlefield && (
            <button onClick={onLeaveBattlefield}>Leave Battlefield</button>
          )}
        </div>
      )}

      {/* Host/Creator Controls */}
      {(userRole === "host" || userRole === "creator") && (
        <div className="lobby-controls">
          {!battlefieldOpen && (
            <>
              <button onClick={handleLeaveLobby}>Leave Lobby</button>
              <button onClick={onOpenBattlefield}>Open Battlefield</button>
            </>
          )}
          {battlefieldOpen && !gameStarted && (
            <button onClick={onStartGame}>Start Game</button>
          )}
          {gameStarted && <button onClick={onEndGame}>End Game</button>}
          {userRole === "creator" && (
            <button onClick={handleClearLobby}>Clear Lobby</button>
          )}
        </div>
      )}
    </div>
  );
}
