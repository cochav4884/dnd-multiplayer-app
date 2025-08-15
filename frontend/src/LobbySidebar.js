import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import Dice from "./components/Dice";
import "./LobbySidebar.css";

export default function LobbySidebar({
  currentUser,          // { id, username, role }
  gameStarted,
  battlefieldOpen,
  onOpenBattlefield,
  onStartGame,
  onEndGame,
  isFullScreen,
  onToggleFullScreen,
}) {
  const [creator, setCreator] = useState(null);  // { id, username, role }
  const [host, setHost] = useState(null);        // { id, username, role }
  const [players, setPlayers] = useState([]);    // array of { id, username, role }
  const [battlefieldPlayers, setBattlefieldPlayers] = useState([]);
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

  const handleLeaveLobby = () => {
    socket.emit("leaveLobby", currentUser.id);
  };

  const handleJoinBattlefield = () => {
    socket.emit("joinBattlefield", currentUser.id);
  };

  const handleLeaveBattlefield = () => {
    socket.emit("leaveBattlefield", currentUser.id);
  };

  const handleRemovePlayer = (playerId) => {
    socket.emit("removePlayer", playerId);
  };

  const handleClearLobby = () => {
    socket.emit("clearLobby");
  };

  const isInBattlefield = battlefieldPlayers.includes(currentUser.id);
  const creatorRoleLabel = creator && host && creator.id === host.id ? "Creator & Host" : "Creator";

  return (
    <div className={`lobby-sidebar ${isFullScreen ? "hidden" : ""}`}>
      {/* Player List */}
      <ul className="player-list">
        {creator && (
          <li className={creator.id === host?.id ? "creator-host" : ""}>
            {creator.username} ({creatorRoleLabel})
          </li>
        )}
        {host && creator?.id !== host.id && <li className="creator-host">{host.username} (Host)</li>}
        {players.map((p) => (
          <li key={p.id}>
            {p.username}
            {(currentUser.role === "creator" || currentUser.role === "host") && p.id !== currentUser.id && (
              <button onClick={() => handleRemovePlayer(p.id)}>Remove</button>
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
            {diceResult.username} rolled {diceResult.value} on {diceResult.type.toUpperCase()}
          </p>
        )}
      </div>

      {/* Fullscreen toggle */}
      <button className="fullscreen-button" onClick={onToggleFullScreen}>
        {isFullScreen ? "Exit Full-Screen" : "Full-Screen"}
      </button>

      {/* Player Controls */}
      {currentUser.role === "player" && (
        <div className="lobby-controls">
          <button onClick={handleLeaveLobby}>Leave Lobby</button>
          {!isInBattlefield && battlefieldOpen && <button onClick={handleJoinBattlefield}>Join Battlefield</button>}
          {isInBattlefield && <button onClick={handleLeaveBattlefield}>Leave Battlefield</button>}
        </div>
      )}

      {/* Host/Creator Controls */}
      {(currentUser.role === "host" || currentUser.role === "creator") && (
        <div className="lobby-controls">
          {!battlefieldOpen && (
            <>
              <button onClick={handleLeaveLobby}>Leave Lobby</button>
              <button onClick={onOpenBattlefield}>Open Battlefield</button>
            </>
          )}
          {battlefieldOpen && !gameStarted && <button onClick={onStartGame}>Start Game</button>}
          {gameStarted && <button onClick={onEndGame}>End Game</button>}
          {currentUser.role === "creator" && <button onClick={handleClearLobby}>Clear Lobby</button>}
        </div>
      )}
    </div>
  );
}