// src/components/Battlefield.js
import React, { useState, useEffect } from "react";
import BackgroundSidebar from "./BackgroundSidebar";
import AssetsSidebar from "./AssetsSidebar";
import "./Battlefield.css";

const GRID_SIZE = 15;
const GRID_COLUMNS = 40;
const GRID_ROWS = 25;

export default function Battlefield({
  userRole,
  battlefieldOpen,
  gameStarted,
  selectedBackground,
}) {
  const [players, setPlayers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [isFullScreen, setFullScreen] = useState(false);
  const [localBackground, setLocalBackground] = useState(selectedBackground);
  const [hideSidebars, setHideSidebars] = useState(false);

  // Initialize default player
  useEffect(() => {
    if (players.length === 0 && gameStarted) {
      setPlayers([{ name: "You", x: 0, y: 0 }]);
    }
  }, [gameStarted, players.length]);

  // Player movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted) return;

      const movePlayer = (playerIndex, dx, dy) => {
        setPlayers((prev) => {
          const newPlayers = [...prev];
          const player = newPlayers[playerIndex];
          const newX = player.x + dx;
          const newY = player.y + dy;

          if (newX < 0 || newX >= GRID_COLUMNS || newY < 0 || newY >= GRID_ROWS)
            return prev;
          if (
            newPlayers.some(
              (p, idx) => idx !== playerIndex && p.x === newX && p.y === newY
            )
          )
            return prev;

          player.x = newX;
          player.y = newY;

          // Check for asset found
          setAssets((prevAssets) =>
            prevAssets.map((asset) =>
              !asset.found && asset.x === player.x && asset.y === player.y
                ? { ...asset, found: true }
                : asset
            )
          );

          return newPlayers;
        });
      };

      const playerIndex = 0;
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

  // Asset placement
  const handlePlaceAsset = (assetId, x, y) => {
    if (x < 0 || x >= GRID_COLUMNS || y < 0 || y >= GRID_ROWS) return;
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === parseInt(assetId)
          ? { ...asset, x, y, found: false }
          : asset
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

  // Generate grid cells
  const gridCells = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLUMNS; x++) {
      gridCells.push(
        <div
          key={`${x}-${y}`}
          className="grid-square"
          style={{
            width: GRID_SIZE,
            height: GRID_SIZE,
            left: x * GRID_SIZE,
            top: y * GRID_SIZE,
          }}
        />
      );
    }
  }

  return (
    <div
      className={`battlefield-wrapper ${isFullScreen ? "fullscreen" : ""} ${
        hideSidebars ? "hide-sidebars" : ""
      }`}
    >
      {/* Sidebars for host/creator */}
      {(userRole === "host" || userRole === "creator") &&
        battlefieldOpen &&
        !isFullScreen &&
        !hideSidebars && (
          <>
            <BackgroundSidebar
              selectedBackground={localBackground}
              onSelect={setLocalBackground}
              userRole={userRole}
            />
            <AssetsSidebar
              onPlaceAsset={handlePlaceAsset}
              userRole={userRole}
            />
          </>
        )}

      {/* Fullscreen & Sidebar Toggle */}
      <div className="battlefield-controls">
        <button onClick={() => setFullScreen((prev) => !prev)}>
          {isFullScreen ? "Exit Full Screen" : "Full Screen"}
        </button>
        {battlefieldOpen && !gameStarted && (
          <button onClick={() => setHideSidebars((prev) => !prev)}>
            {hideSidebars ? "Show Sidebars" : "Hide Sidebars"}
          </button>
        )}
      </div>

      {/* Battlefield grid */}
      <div
        className={`battlefield-container ${gameStarted ? "game-started" : ""}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Background */}
        {localBackground && (
          <img
            src={localBackground}
            alt="Background"
            className="battlefield-background"
          />
        )}

        {/* Grid overlay */}
        <div className="grid">{gridCells}</div>

        {/* Players */}
        {players.map((player) => (
          <div
            key={player.name}
            className="player"
            style={{ left: player.x * GRID_SIZE, top: player.y * GRID_SIZE }}
          >
            {player.name[0]}
          </div>
        ))}

        {/* Players + Flashlight */}
        {players.map((player) => (
          <React.Fragment key={player.name}>
            <div
              className="player"
              style={{ left: player.x * GRID_SIZE, top: player.y * GRID_SIZE }}
            >
              {player.name[0]}
            </div>
            {!["host", "creator"].includes(userRole) && gameStarted && (
              <div
                className="flashlight"
                style={{
                  left: player.x * GRID_SIZE + GRID_SIZE / 2,
                  top: player.y * GRID_SIZE + GRID_SIZE / 2,
                }}
              />
            )}
          </React.Fragment>
        ))}

        {/* Assets */}
        {assets.map((asset) => {
          if (asset.found) return null;
          const visible =
            userRole === "host" ||
            userRole === "creator" ||
            players.some(
              (p) =>
                Math.abs(p.x - asset.x) <= 1 && Math.abs(p.y - asset.y) <= 1
            );
          return (
            <div
              key={asset.id}
              className="asset"
              style={{
                left: asset.x * GRID_SIZE,
                top: asset.y * GRID_SIZE,
                display: visible ? "flex" : "none",
              }}
            >
              {asset.name[0]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
