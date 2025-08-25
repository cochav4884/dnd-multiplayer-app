// src/LobbySidebar.js
import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import Dice from "./components/Dice";
import "./LobbySidebar.css";

export default function LobbySidebar({
  currentUser = {},
  setCurrentUser,
  gameStarted,
  battlefieldOpen,
  onOpenBattlefield,
  onStartGame,
  onEndGame,
}) {
  const [creator, setCreator] = useState(null);
  const [host, setHost] = useState(null);
  const [players, setPlayers] = useState([]);
  const [battlefieldPlayers, setBattlefieldPlayers] = useState([]);
  const [selectedDie, setSelectedDie] = useState("d6");
  const [diceResult, setDiceResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [diceRolls, setDiceRolls] = useState([]);

  const diceTypes = ["d4", "d6", "d8", "d10", "d20", "d50"];
  const isCreatorOrHost =
    currentUser?.role === "creator" || currentUser?.role === "host";
  const canOpenBattlefield =
    isCreatorOrHost && players.some((p) => p.id && p.id !== currentUser?.id);
  const isInBattlefield = currentUser?.id
    ? battlefieldPlayers.includes(currentUser.id)
    : false;

  // Lobby updates and dice rolls
  useEffect(() => {
    const handleLobbyUpdate = (lobby) => {
      setCreator(lobby?.creator || null);
      setHost(lobby?.host || null);
      setPlayers(lobby?.players || []);
      setBattlefieldPlayers(lobby?.battlefieldPlayers || []);
    };

    const handleDiceRolled = (data) => {
      setDiceResult({
        username: data?.username || "Unknown",
        value: data?.diceValue ?? "?",
        type: data?.diceType || "",
      });

      setRolling(false);

      setDiceRolls((prev) => [...prev, data]);
      setTimeout(() => {
        setDiceRolls((prev) => prev.filter((d) => d !== data));
      }, 3000);
    };

    socket.on("lobbyUpdate", handleLobbyUpdate);
    socket.on("diceRolled", handleDiceRolled);

    return () => {
      socket.off("lobbyUpdate", handleLobbyUpdate);
      socket.off("diceRolled", handleDiceRolled);
    };
  }, []);

  const handleRollDice = () => {
    if (!selectedDie) return;
    setRolling(true);

    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);

      if (t < 1) requestAnimationFrame(animate);
      else {
        setRolling(false);
        socket.emit("rollDice", {
          username: currentUser?.username || "Unknown",
          diceType: selectedDie,
        });
      }
    };

    requestAnimationFrame(animate);
  };

  // --- Updated Leave Lobby ---
  const handleLeaveLobby = () => {
    if (!currentUser?.id) return;

    socket.emit("leaveLobby", currentUser.id, (success) => {
      if (success) {
        // Clear current user so they can log back in
        if (setCurrentUser) setCurrentUser(null);
        alert("You have left the lobby. You can log back in now.");
      } else {
        alert("Error leaving the lobby. Try again.");
      }
    });
  };

  const handleJoinBattlefield = () =>
    socket.emit("joinBattlefield", currentUser?.id);
  const handleLeaveBattlefield = () =>
    socket.emit("leaveBattlefield", currentUser?.id);
  const handleRemovePlayer = (playerId) => socket.emit("removePlayer", playerId);
  const handleClearLobby = () =>
    socket.emit("clearLobby", { role: currentUser?.role || "" });

  return (
    <div className="lobby-sidebar">
      <ul className="player-list">
        {creator && (
          <li className={creator?.id === host?.id ? "creator-host" : "creator"}>
            {creator?.username || "Unknown"} (
            {creator?.id === host?.id ? "Creator & Host" : "Creator"})
          </li>
        )}
        {host && host?.id !== creator?.id && (
          <li className="host">{host?.username || "Unknown"} (Host)</li>
        )}
        {players.map((p) => (
          <li key={p?.id || Math.random()}>
            <div className="player-name">{p?.username || "Unknown"}</div>
            {diceRolls
              .filter((roll) => roll.username === p.username)
              .map((roll, idx) => (
                <div key={idx} className="sidebar-dice">
                  <Dice type={roll.diceType} size={20} />
                  <span>{roll.diceValue ?? "?"}</span>
                </div>
              ))}
            {isCreatorOrHost && p?.id && p.id !== currentUser?.id && (
              <button onClick={() => handleRemovePlayer(p.id)}>Remove</button>
            )}
          </li>
        ))}
      </ul>

      {/* Dice selector */}
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
        <button onClick={handleRollDice} disabled={rolling}>
          {rolling ? "Rolling..." : "Roll Dice"}
        </button>
      </div>

      {/* Lobby controls */}
      <div className="lobby-controls">
        <button onClick={handleLeaveLobby}>Leave Lobby</button>
        {canOpenBattlefield && !battlefieldOpen && (
          <button onClick={onOpenBattlefield}>Open Battlefield</button>
        )}
        {isCreatorOrHost && battlefieldOpen && !gameStarted && (
          <button onClick={onStartGame}>Start Game</button>
        )}
        {isCreatorOrHost && gameStarted && (
          <button onClick={onEndGame}>End Game</button>
        )}
        {isCreatorOrHost && <button onClick={handleClearLobby}>Clear Lobby</button>}
        {!isCreatorOrHost && battlefieldOpen && (
          <>
            {!isInBattlefield && (
              <button onClick={handleJoinBattlefield}>Join Battlefield</button>
            )}
            {isInBattlefield && (
              <button onClick={handleLeaveBattlefield}>Leave Battlefield</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
