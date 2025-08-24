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
  inBattlefield,
  onJoinBattlefield,
  onLeaveBattlefield,
  playersFromLobby = [],
  assetsFromServer = [],
  onPlaceAsset,
}) {
  const [players, setPlayers] = useState(playersFromLobby || []);
  const [assets, setAssets] = useState(assetsFromServer || []);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localBackground, setLocalBackground] = useState(selectedBackground);
  const [roundOver, setRoundOver] = useState(false);

  useEffect(() => setAssets(assetsFromServer || []), [assetsFromServer]);
  useEffect(() => setPlayers(playersFromLobby || []), [playersFromLobby]);

  // Check if all assets are found
  useEffect(() => {
    if (assets.length > 0 && assets.every((asset) => asset.found)) {
      setRoundOver(true);
    } else {
      setRoundOver(false);
    }
  }, [assets]);

  // Player movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || !inBattlefield || roundOver) return;

      const movePlayer = (playerIndex, dx, dy) => {
        setPlayers((prev) => {
          const newPlayers = [...prev];
          const player = newPlayers[playerIndex];
          const newX = player.x + dx;
          const newY = player.y + dy;

          if (newX < 0 || newX >= GRID_COLUMNS || newY < 0 || newY >= GRID_ROWS)
            return prev;
          if (newPlayers.some((p, idx) => idx !== playerIndex && p.x === newX && p.y === newY))
            return prev;

          player.x = newX;
          player.y = newY;

          setAssets((prevAssets) =>
            prevAssets.map((asset) =>
              !asset.found && asset.x === newX && asset.y === newY
                ? { ...asset, found: true }
                : asset
            )
          );

          return newPlayers;
        });
      };

      const playerIndex = 0; // local player
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
  }, [gameStarted, inBattlefield, roundOver]);

  const handleDrop = (e) => {
    e.preventDefault();
    const assetId = parseInt(e.dataTransfer.getData("assetId"));
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GRID_SIZE);
    onPlaceAsset(assetId, x, y);
  };
  const handleDragOver = (e) => e.preventDefault();

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

  const isHostOrCreator = userRole === "host" || userRole === "creator";

  return (
    <div className={`battlefield-wrapper ${isFullscreen ? "fullscreen" : ""}`}>
      {/* Host/creator sidebars visible only if not fullscreen */}
      {isHostOrCreator && battlefieldOpen && !isFullscreen && (
        <>
          <BackgroundSidebar
            selectedBackground={localBackground}
            onSelect={setLocalBackground}
            userRole={userRole}
          />
          <AssetsSidebar userRole={userRole} onPlaceAsset={onPlaceAsset} />
        </>
      )}

      {/* Battlefield controls for players */}
      <div className="battlefield-controls">
        {/* Non-host players see Join/Leave Battlefield buttons */}
        {battlefieldOpen && !isHostOrCreator && (
          <>
            {!inBattlefield && (
              <button onClick={onJoinBattlefield}>Join Battlefield</button>
            )}
            {inBattlefield && (
              <button onClick={onLeaveBattlefield}>Leave Battlefield</button>
            )}
          </>
        )}

        {/* Full Screen toggle visible to any player inside Battlefield */}
        {inBattlefield && (
          <button onClick={() => setIsFullscreen((prev) => !prev)}>
            {isFullscreen ? "Exit Full Screen" : "Full Screen"}
          </button>
        )}
      </div>

      {/* Battlefield grid */}
      <div
        className={`battlefield-container ${gameStarted ? "game-started" : ""} ${roundOver ? "round-over" : ""}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {localBackground && (
          <img
            src={localBackground}
            alt="Background"
            className="battlefield-background"
          />
        )}
        <div className="grid">{gridCells}</div>

        {/* Players */}
        {players.map((player) => (
          <React.Fragment key={player.id || player.name}>
            <div
              className="player"
              style={{
                left: player.x * GRID_SIZE,
                top: player.y * GRID_SIZE,
              }}
            >
              {player.name[0]}
            </div>

            {/* Flashlight disappears when round is over */}
            {!isHostOrCreator && gameStarted && !roundOver && (
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
            isHostOrCreator ||
            players.some(
              (p) => Math.abs(p.x - asset.x) <= 1 && Math.abs(p.y - asset.y) <= 1
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

        {/* Round over overlay */}
        {roundOver && (
          <div className="round-over-overlay">
            <h2>Battle Round Over!</h2>
          </div>
        )}
      </div>
    </div>
  );
}
