// src/LobbySidebar.js
import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import Dice from "./components/Dice";
import "./LobbySidebar.css";

export default function LobbySidebar({
  currentUser = {},
  gameStarted,
  battlefieldOpen,
  onOpenBattlefield,
  onStartGame,
  onEndGame,
  isFullScreen,
  onToggleFullScreen,
}) {
  const [creator, setCreator] = useState(null);
  const [host, setHost] = useState(null);
  const [players, setPlayers] = useState([]);
  const [battlefieldPlayers, setBattlefieldPlayers] = useState([]);
  const [selectedDie, setSelectedDie] = useState("d6");
  const [diceResult, setDiceResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [dicePosition, setDicePosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const diceTypes = ["d4", "d6", "d8", "d10", "d20", "d50"];

  // Listen to lobby updates from server
  useEffect(() => {
    socket.on("lobbyUpdate", (lobby) => {
      setCreator(lobby.creator || null);
      setHost(lobby.host || null);
      setPlayers(lobby.players || []);
      setBattlefieldPlayers(lobby.battlefieldPlayers || []);
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

  // Dice roll animation
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
          username: currentUser.username,
          diceType: selectedDie,
        });
      }
    };

    requestAnimationFrame(animate);
  };

  // Player actions
  const handleLeaveLobby = () => {
    if (!currentUser?.id) return;
    socket.emit("leaveLobby", currentUser.id);

    // Clear client-side state immediately
    setCreator(null);
    setHost(null);
    setPlayers([]);
    setBattlefieldPlayers([]);
  };

  const handleJoinBattlefield = () =>
    socket.emit("joinBattlefield", currentUser.id);
  const handleLeaveBattlefield = () =>
    socket.emit("leaveBattlefield", currentUser.id);
  const handleRemovePlayer = (playerId) =>
    socket.emit("removePlayer", playerId);
  const handleClearLobby = () =>
    socket.emit("clearLobby", { role: currentUser.role });

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const isInBattlefield = currentUser?.id
    ? battlefieldPlayers.includes(currentUser.id)
    : false;

  const isCreatorOrHost =
    currentUser?.role === "creator" || currentUser?.role === "host";

  return (
    <>
      {isMobileOpen && (
        <div className="mobile-backdrop" onClick={toggleMobileSidebar}></div>
      )}

      <div
        className={`lobby-sidebar ${isFullScreen ? "hidden" : ""} ${
          isMobileOpen ? "mobile-open" : ""
        }`}
      >
        {/* Mobile toggle button */}
        <div className="mobile-toggle" onClick={toggleMobileSidebar}>
          ☰
        </div>

        {/* Players list */}
        <ul className="player-list">
          {creator && (
            <li
              className={creator?.id === host?.id ? "creator-host" : "creator"}
            >
              {creator.username} (
              {creator?.id === host?.id ? "Creator & Host" : "Creator"})
            </li>
          )}
          {host && host?.id !== creator?.id && (
            <li className="host">{host.username} (Host)</li>
          )}
          {players.map((p) => (
            <li key={p.id}>
              {p.username}{" "}
              {isCreatorOrHost && p.id !== currentUser.id && (
                <button onClick={() => handleRemovePlayer(p.id)}>Remove</button>
              )}
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
              >
                <Dice type={die} size={40} />
              </div>
            ))}
          </div>
        </div>

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

        {/* Lobby Controls */}
        <div className="lobby-controls">
          <button onClick={handleLeaveLobby}>Leave Lobby</button>

          {isCreatorOrHost && !battlefieldOpen && (
            <button onClick={onOpenBattlefield}>Open Battlefield</button>
          )}
          {isCreatorOrHost && battlefieldOpen && !gameStarted && (
            <button onClick={onStartGame}>Start Game</button>
          )}
          {isCreatorOrHost && gameStarted && (
            <button onClick={onEndGame}>End Game</button>
          )}
          {isCreatorOrHost && (
            <button onClick={handleClearLobby}>Clear Lobby</button>
          )}

          {!isCreatorOrHost && battlefieldOpen && (
            <>
              {!isInBattlefield && (
                <button onClick={handleJoinBattlefield}>
                  Join Battlefield
                </button>
              )}
              {isInBattlefield && (
                <button onClick={handleLeaveBattlefield}>
                  Leave Battlefield
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
