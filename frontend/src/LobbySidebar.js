import React, { useState, useEffect } from "react";
import { socket } from "./socket";
import diceBgImg from "./images/Beach-Cove.jpg"; // adjust path
import BackgroundSidebar from "./components/BackgroundSidebar";
import AssetsSidebar from "./components/AssetsSidebar";
import "./LobbySidebar.css";

export default function LobbySidebar({ userRole, gameStarted, onStartGame, onEndGame }) {
  const [inBattlefield, setInBattlefield] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [creator, setCreator] = useState(null);
  const [host, setHost] = useState(null);
  const [players, setPlayers] = useState([]);
  const [diceResult, setDiceResult] = useState(null);
  const [showBackgroundSidebar, setShowBackgroundSidebar] = useState(false);
  const [showAssetsSidebar, setShowAssetsSidebar] = useState(false);

  // Lobby updates
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
  const handleOpenBattlefield = () => { if (!gameStarted) onStartGame(); };
  const handleLeaveLobby = () => { alert("You have left the lobby."); window.location.reload(); };
  
  const handleRemovePlayer = (playerName) => {
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
      
      {/* Top: Creator, Host, Players */}
      <ul className="player-list">
        {creator && <li>{creator} {(userRole === "host" || userRole === "creator") ? "(Creator)" : ""}</li>}
        {host && host !== creator && <li>{host} {(userRole === "host" || userRole === "creator") ? "(Host)" : ""}</li>}
        {players.map((p) => (
          <li key={p}>
            {p}
            {(userRole === "host" || userRole === "creator") && (
              <button onClick={() => handleRemovePlayer(p)}>Remove</button>
            )}
          </li>
        ))}
      </ul>

      {/* Center: Rules (visible until battlefield opens) */}
      {!gameStarted && (
        <div className="lobby-rules">
          <h3>Rules of Conduct</h3>
          <ul>
            <li>Respect all players.</li>
            <li>Use appropriate language.</li>
            <li>No cheating or exploits.</li>
            <li>Follow host instructions.</li>
            <li>Have fun!</li>
          </ul>
        </div>
      )}

      {/* Bottom: Dice area */}
      <div className="dice-area">
        <div className="dice-bg-wrapper">
          <img src={diceBgImg} alt="Dice Background" className="dice-bg" />
        </div>
        <button className="roll-dice-btn" onClick={handleRollDice}>Roll Dice</button>
        {diceResult && (
          <p className="dice-result">{diceResult.username} rolled a {diceResult.value}</p>
        )}
      </div>

      {/* Fullscreen toggle */}
      <button className="fullscreen-button" onClick={toggleFullScreen}>
        {isFullScreen ? "Exit Full-Screen" : "Full-Screen"}
      </button>

      {/* Player controls */}
      {userRole === "player" && (
        <div className="lobby-controls">
          <button onClick={handleLeaveLobby}>Leave Lobby</button>
          {!inBattlefield && gameStarted && <button onClick={handleJoinBattlefield}>Join Battlefield</button>}
          {inBattlefield && <button onClick={handleLeaveBattlefield}>Leave Battlefield</button>}
        </div>
      )}

      {/* Host controls */}
      {(userRole === "host" || userRole === "creator") && (
        <>
          <div className="lobby-controls">
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

          {/* Right-side buttons after battlefield opens */}
          {gameStarted && (
            <div className="right-sidebars">
              <div className="sidebar-button-wrapper">
                <button onClick={() => setShowBackgroundSidebar((prev) => !prev)}>Background Sidebar</button>
                {showBackgroundSidebar && <BackgroundSidebar selectedBackground={null} onSelect={() => {}} />}
              </div>
              <div className="sidebar-button-wrapper">
                <button onClick={() => setShowAssetsSidebar((prev) => !prev)}>Assets Sidebar</button>
                {showAssetsSidebar && <AssetsSidebar />}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
