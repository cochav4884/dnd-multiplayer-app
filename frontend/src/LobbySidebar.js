// src/LobbySidebar.js
import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import Dice from "./components/Dice";
import "./LobbySidebar.css";

export default function LobbySidebar({
  currentUser = {}, // { id, username, role }
  gameStarted,
  setGameStarted,
  battlefieldOpen,
  setBattlefieldOpen,
}) {
  const [lobby, setLobby] = useState({
    creator: null,
    host: null,
    players: [],
    battlefieldPlayers: [],
  });

  // Listen for lobby updates from server
  useEffect(() => {
    socket.on("lobbyUpdate", (data) => setLobby(data));

    socket.on("gameStarted", () => setGameStarted(true));
    socket.on("gameEnded", () => setGameStarted(false));

    return () => {
      socket.off("lobbyUpdate");
      socket.off("gameStarted");
      socket.off("gameEnded");
    };
  }, [setGameStarted]);

  // --- Button handlers ---
  const handleStartGame = () => {
    socket.emit("startGame");
  };

  const handleEndGame = () => {
    socket.emit("endGame");
  };

  const handleOpenBattlefield = () => {
    setBattlefieldOpen(true);
  };

  const handleLeaveLobby = () => {
    socket.emit("leaveLobby", currentUser.id, (success) => {
      if (success) {
        window.location.reload();
      }
    });
  };

  const handleJoinBattlefield = () => {
    socket.emit("joinBattlefield", currentUser.id);
  };

  const handleLeaveBattlefield = () => {
    socket.emit("leaveBattlefield", currentUser.id);
  };

  const handleRemovePlayer = (id) => {
    socket.emit("removePlayer", id);
  };

  const handleClearLobby = () => {
    socket.emit("clearLobby");
  };

  // --- Role-based buttons ---
  const renderButtons = () => {
    if (!currentUser || !currentUser.role) return null;

    const { role } = currentUser;

    return (
      <div className="lobby-buttons">
        {/* Everyone can leave */}
        <button onClick={handleLeaveLobby}>Leave Lobby</button>

        {/* Creator + Host controls */}
        {(role === "creator" || role === "host" || role === "creator & host") && (
          <>
            <button onClick={handleOpenBattlefield}>Open Battlefield</button>
            {!gameStarted ? (
              <button onClick={handleStartGame}>Start Game</button>
            ) : (
              <button onClick={handleEndGame}>End Game</button>
            )}
            <button onClick={handleClearLobby}>Clear Lobby</button>
          </>
        )}

        {/* Player controls */}
        {role === "player" && battlefieldOpen && (
          lobby.battlefieldPlayers.includes(currentUser.id) ? (
            <button onClick={handleLeaveBattlefield}>Leave Battlefield</button>
          ) : (
            <button onClick={handleJoinBattlefield}>Join Battlefield</button>
          )
        )}

        {/* Creator & Host can remove battlefield players */}
        {(role === "creator" || role === "host" || role === "creator & host") &&
          lobby.battlefieldPlayers.map((pid) => {
            const player = lobby.players.find((p) => p.id === pid);
            return (
              player && (
                <button
                  key={pid}
                  onClick={() => handleRemovePlayer(pid)}
                >
                  Remove {player.username} from Battlefield
                </button>
              )
            );
          })}
      </div>
    );
  };

  return (
    <div className="lobby-sidebar">
      <h2>Lobby</h2>
      <p><strong>Creator:</strong> {lobby.creator?.username || "None"}</p>
      <p><strong>Host:</strong> {lobby.host?.username || "None"}</p>
      <h3>Players</h3>
      <ul>
        {lobby.players.map((p) => (
          <li key={p.id}>
            {p.username}
            {lobby.battlefieldPlayers.includes(p.id) && " ⚔️"}
          </li>
        ))}
      </ul>

      {renderButtons()}

      <h3>Dice Roller</h3>
      <Dice username={currentUser.username} />
    </div>
  );
}
