import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import Dice from "./components/Dice";
import "./LobbySidebar.css";

export default function LobbySidebar({
  currentUser,
  setCurrentUser,
  onLeaveLobby,
  userRole,
  gameStarted,
  battlefieldOpen,
  inBattlefield,
  onOpenBattlefield,
  onStartGame,
  onEndGame,
  onJoinBattlefield,
  onLeaveBattlefield,
  setPlayers,
  setAssets,
}) {
  const [creator, setCreator] = useState(null);
  const [host, setHost] = useState(null);
  const [players, setLobbyPlayers] = useState([]);
  const [battlefieldPlayers, setBattlefieldPlayers] = useState([]);
  const [selectedDie, setSelectedDie] = useState("d6");
  const [diceRolls, setDiceRolls] = useState([]);
  const [rolling, setRolling] = useState(false);

  const diceTypes = ["d4", "d6", "d8", "d10", "d20", "d50"];
  const isCreatorOrHost = userRole === "creator" || userRole === "host";
  const isInBattlefield = currentUser?.id ? battlefieldPlayers.includes(currentUser.id) : false;

  // --- Socket listeners ---
  useEffect(() => {
    socket.on("lobbyUpdate", (lobby) => {
      setCreator(lobby.creator || null);
      setHost(lobby.host || null);
      setLobbyPlayers(lobby.players || []);
      setBattlefieldPlayers(lobby.battlefieldPlayers || []);
      setPlayers(lobby.players || []);
    });

    socket.on("diceRolled", (data) => {
      setDiceRolls((prev) => [...prev, data]);
      setTimeout(() => {
        setDiceRolls((prev) => prev.filter((d) => d !== data));
      }, 3000);
    });

    return () => {
      socket.off("lobbyUpdate");
      socket.off("diceRolled");
    };
  }, [setPlayers]);

  // --- Dice roll handler ---
  const handleRollDice = () => {
    if (!selectedDie || rolling) return;
    setRolling(true);
    setTimeout(() => {
      setRolling(false);
      socket.emit("rollDice", {
        username: currentUser?.username || "Unknown",
        diceType: selectedDie,
      });
    }, 500);
  };

  // --- Lobby actions ---
  const handleJoinBattlefieldClick = () => socket.emit("joinBattlefield", currentUser.id);
  const handleLeaveBattlefieldClick = () => socket.emit("leaveBattlefield", currentUser.id);
  const handleRemovePlayer = (id) => socket.emit("removePlayer", id);
  const handleClearLobby = () => socket.emit("clear-lobby");

  return (
    <div className="lobby-sidebar-inner">
      {/* Players */}
      <ul className="player-list">
        {creator && (
          <li className={creator.id === host?.id ? "creator-host" : "creator"}>
            {creator.username} ({creator.id === host?.id ? "Creator & Host" : "Creator"})
          </li>
        )}
        {host && host.id !== creator?.id && (
          <li className="host">{host.username} (Host)</li>
        )}
        {players.map((p) => (
          <li key={p.id}>
            <span>{p.username}</span>
            {diceRolls
              .filter((d) => d.username === p.username)
              .map((d, idx) => (
                <div key={idx} className="dice-area">
                  <Dice type={d.diceType} size={20} />
                  <span className="dice-result">{d.diceValue}</span>
                </div>
              ))}
            {isCreatorOrHost && p.id !== currentUser.id && (
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
        <button className="roll-dice-btn" onClick={handleRollDice} disabled={rolling}>
          {rolling ? "Rolling..." : "Roll Dice"}
        </button>
      </div>

      {/* Lobby controls */}
      <div className="lobby-controls">
        <button onClick={onLeaveLobby}>Leave Lobby</button>

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
              <button onClick={handleJoinBattlefieldClick}>Join Battlefield</button>
            )}
            {isInBattlefield && (
              <button onClick={handleLeaveBattlefieldClick}>Leave Battlefield</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
