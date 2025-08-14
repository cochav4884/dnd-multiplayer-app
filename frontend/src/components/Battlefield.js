import React, { useState, useEffect } from "react";
import BackgroundSidebar from "./BackgroundSidebar";
import AssetsSidebar from "./AssetsSidebar";
import "./Battlefield.css";

const GRID_SIZE = 15;
const GRID_COLUMNS = 40;
const GRID_ROWS = 25;

export default function Battlefield({ userRole, gameStarted, selectedBackground }) {
  const [players, setPlayers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isFullScreen, setFullScreen] = useState(false);
  const [localBackground, setLocalBackground] = useState(selectedBackground);
  const [hideSidebars, setHideSidebars] = useState(false);

  // Initialize player
  useEffect(() => {
    if (players.length === 0 && gameStarted) {
      setPlayers([{ name: "You", x: 0, y: 0 }]);
    }
  }, [gameStarted]);

  // Movement handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted) return;
      const movePlayer = (playerIndex, dx, dy) => {
        setPlayers((prev) => {
          const newPlayers = [...prev];
          const player = newPlayers[playerIndex];
          const newX = player.x + dx;
          const newY = player.y + dy;

          if (newX < 0 || newX >= GRID_COLUMNS || newY < 0 || newY >= GRID_ROWS) return prev;
          if (newPlayers.some((p, idx) => idx !== playerIndex && p.x === newX && p.y === newY)) return prev;

          player.x = newX;
          player.y = newY;

          // Asset found check
          setAssets((prevAssets) =>
            prevAssets.map((asset) => {
              if (!asset.found && asset.x === player.x && asset.y === player.y) {
                return { ...asset, found: true };
              }
              return asset;
            })
          );

          return newPlayers;
        });
      };

      const playerIndex = 0; // demo
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          movePlayer(playerIndex, 0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          movePlayer(playerIndex, 0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          movePlayer(playerIndex, -1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          movePlayer(playerIndex, 1, 0);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameStarted]);

  // Place asset
  const handlePlaceAsset = (assetId, x, y) => {
    if (x < 0 || x >= GRID_COLUMNS || y < 0 || y >= GRID_ROWS) return;
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === parseInt(assetId) ? { ...asset, x, y, found: false } : asset
      )
    );
  };

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const assetId = parseInt(e.dataTransfer.getData("assetId"));
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GRID_SIZE);
    handlePlaceAsset(assetId, x, y);
  };

  return (
    <div className={`battlefield-wrapper ${isFullScreen ? "fullscreen" : ""} ${hideSidebars ? "hide-sidebars" : ""}`}>
      {/* Sidebars for host/creator */}
      {(userRole === "host" || userRole === "creator") && !isFullScreen && !hideSidebars && (
        <>
          <BackgroundSidebar selectedBackground={localBackground} onSelect={setLocalBackground} />
          <AssetsSidebar onPlaceAsset={handlePlaceAsset} userRole={userRole} />
        </>
      )}

      {/* Host/Player Buttons & Fullscreen Toggle */}
      <div className="battlefield-controls">
        {(userRole === "host" || userRole === "creator") && (
          <>
            <button onClick={() => setHideSidebars(prev => !prev)}>
              {hideSidebars ? "Show Sidebars" : "Hide Sidebars"}
            </button>
            {!gameStarted && <button onClick={() => alert("Open Battlefield clicked")}>Open Battlefield</button>}
            {!gameStarted && <button onClick={() => alert("Start Game clicked")}>Start Game</button>}
            {gameStarted && <button onClick={() => alert("End Game clicked")}>End Game</button>}
          </>
        )}
        {userRole === "player" && (
          <>
            {!gameStarted && <button disabled>Wait for host...</button>}
            {gameStarted && !players.some(p => p.name === "You") && <button onClick={() => setPlayers([...players, { name: "You", x:0, y:0 }])}>Join Battlefield</button>}
            {gameStarted && players.some(p => p.name === "You") && <button onClick={() => setPlayers(players.filter(p => p.name !== "You"))}>Leave Battlefield</button>}
          </>
        )}
        <button onClick={() => setFullScreen(prev => !prev)}>
          {isFullScreen ? "Exit Full Screen" : "Full Screen"}
        </button>
      </div>

      {/* Battlefield container */}
      <div
        className={`battlefield-container ${gameStarted ? "" : "show-rules"}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {localBackground && <img src={localBackground} alt="Background" className="battlefield-background" />}

        {/* Rules displayed when game has not started */}
        {!gameStarted && (
          <div className="battlefield-rules">
            <h2>Lobby Rules & Conduct</h2>
            <ul>
              <li>Respect all players and hosts.</li>
              <li>No cheating or exploiting game mechanics.</li>
              <li>Communicate politely and clearly.</li>
              <li>Follow instructions from host/creator.</li>
              <li>Have fun!</li>
            </ul>
          </div>
        )}

        {/* Grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLUMNS}, ${GRID_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, ${GRID_SIZE}px)`,
          }}
        >
          {Array.from({ length: GRID_COLUMNS * GRID_ROWS }).map((_, idx) => (
            <div key={idx} className="grid-square" />
          ))}
        </div>

        {/* Players */}
        {players.map(player => (
          <div key={player.name} className="player" style={{ left: player.x * GRID_SIZE, top: player.y * GRID_SIZE }}>
            {player.name[0]}
          </div>
        ))}

        {/* Assets */}
        {assets.map(asset => {
          if (asset.found) return null;
          const visible = userRole === "host" || userRole === "creator" ||
                          players.some(p => Math.abs(p.x - asset.x) <= 1 && Math.abs(p.y - asset.y) <= 1);
          return (
            <div key={asset.id} className="asset" style={{ left: asset.x * GRID_SIZE, top: asset.y * GRID_SIZE, display: visible ? "flex" : "none" }}>
              {asset.name[0]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
