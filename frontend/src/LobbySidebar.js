import React, { useState, useEffect } from "react";
import { socket } from "../socket";
import Dice from "./Dice";
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
    const duration = 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const x = Math.random() * 300;
      const y = 100 - Math.sin(t * Math.PI) * 50;
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

  // Determine display role for creator/host
  let creatorRoleLabel = creator === host ? "Creator & Host" : "Creator";
  const creatorName = creator;

  return (
    <div className={`lobby-sidebar ${isFullScreen ? "hidden" : ""}`}>
      {/* Player List */}
      <ul className="player-list">
        {creatorName && (
          <li
            className={creator === host ? "creator-host" : ""}
          >
            {creatorName} ({creatorRoleLabel})
            {(userRole === "creator" || userRole === "host") && (
              <button onClick={() => handleRemovePlayer(creatorName)}>Remove</button>
            )}
          </li>
        )}

        {host && creator !== host && (
          <li className="creator-host">
            {host} (Host)
            {(userRole === "creator" || userRole === "host") && (
              <button onClick={() => handleRemovePlayer(host)}>Remove</button>
            )}
          </li>
        )}

        {players.map((p) => (
          <li key={p}>
            {p}
            {(userRole === "creator" || userRole === "host") && (
              <button onClick={() => handleRemovePlayer(p)}>Remove</button>
            )}
          </li>
        ))}
      </ul>

      {/* Dice Selection */}
      <div className="dice-selection">
        <h3>Select Dice</h3>
        <div className="dice-thumbnails">
          {diceTypes.map((die) => (
            <div
              key={die}
              className={selectedDie === die ? "selected-dice" : ""}
              onClick={() => setSelectedDie(die)}
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

        {rolling && (
          <div
            className="rolling-dice"
            style={{
              top: dicePosition.y,
              left: dicePosition.x,
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            }}
          >
            <Dice type={selectedDie} size={40} />
          </div>
        )}

        {diceResult && (
          <p className="dice-result">
            {diceResult.username} rolled {diceResult.value} on{" "}
            {diceResult.type.toUpperCase()}
          </p>
        )}
      </div>

      {/* Fullscreen toggle */}
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
