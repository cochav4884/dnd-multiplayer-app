// src/components/Battlefield.js
import React, { useState, useEffect } from "react";
import { socket } from "../socket";
import BackgroundSidebar from "./BackgroundSidebar";
import AssetsSidebar from "./AssetsSidebar";
import Dice from "./Dice";
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
  const [diceRolls, setDiceRolls] = useState([]); // Track live dice rolls

  const isHostOrCreator = userRole === "host" || userRole === "creator";

  // Sync players/assets when props change
  useEffect(() => setPlayers(playersFromLobby || []), [playersFromLobby]);
  useEffect(() => setAssets(assetsFromServer || []), [assetsFromServer]);

  // Round over detection
  useEffect(() => {
    setRoundOver(
      assets.length > 0 && assets.every((asset) => asset.found)
    );
  }, [assets]);

  // Listen for dice rolls from server
  useEffect(() => {
    const handleDiceRolled = (data) => {
      setDiceRolls((prev) => [...prev, data]);
      setTimeout(() => {
        setDiceRolls((prev) => prev.filter((d) => d !== data));
      }, 3000);
    };
    socket.on("diceRolled", handleDiceRolled);
    return () => socket.off("diceRolled", handleDiceRolled);
  }, []);

  // Player movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || !inBattlefield || roundOver || players.length === 0) return;

      const movePlayer = (playerIndex, dx, dy) => {
        setPlayers((prev) => {
          if (!prev[playerIndex]) return prev;
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
  }, [gameStarted, inBattlefield, roundOver, players]);

  const handleDrop = (e) => {
    e.preventDefault();
    const assetId = parseInt(e.dataTransfer.getData("assetId"));
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / GRID_SIZE);
    const y = Math.floor((e.clientY - rect.top) / GRID_SIZE);
    if (onPlaceAsset) onPlaceAsset(assetId, x, y);
  };

  const handleDragOver = (e) => e.preventDefault();

  // Build grid
  const gridCells = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLUMNS; x++) {
      gridCells.push(
        <div
          key={`${x}-${y}`}
          className="grid-square"
          style={{ width: GRID_SIZE, height: GRID_SIZE, left: x * GRID_SIZE, top: y * GRID_SIZE }}
        />
      );
    }
  }

  return (
    <div className={`battlefield-wrapper ${isFullscreen ? "fullscreen" : ""}`}>
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

      <div className="battlefield-controls">
        {battlefieldOpen && !isHostOrCreator && (
          <>
            {!inBattlefield && <button onClick={onJoinBattlefield}>Join Battlefield</button>}
            {inBattlefield && <button onClick={onLeaveBattlefield}>Leave Battlefield</button>}
          </>
        )}
        {inBattlefield && (
          <button onClick={() => setIsFullscreen((prev) => !prev)}>
            {isFullscreen ? "Exit Full Screen" : "Full Screen"}
          </button>
        )}
      </div>

      <div
        className={`battlefield-container ${gameStarted ? "game-started" : ""} ${roundOver ? "round-over" : ""}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {localBackground && <img src={localBackground} alt="Background" className="battlefield-background" />}
        <div className="grid">{gridCells}</div>

        {/* Players */}
        {players.map((player) => (
          <React.Fragment key={player.id || player.name}>
            {player?.x != null && player?.y != null && (
              <>
                <div className="player" style={{ left: player.x * GRID_SIZE, top: player.y * GRID_SIZE }}>
                  {player.name ? player.name[0] : "?"}
                </div>

                {!isHostOrCreator && gameStarted && !roundOver && (
                  <div className="flashlight visible" style={{ left: player.x * GRID_SIZE + GRID_SIZE / 2, top: player.y * GRID_SIZE + GRID_SIZE / 2 }} />
                )}
              </>
            )}
          </React.Fragment>
        ))}

        {/* Live Dice Rolls */}
        {diceRolls.map((roll, idx) => {
          const player = players.find((p) => p.username === roll.username);
          if (!player) return null;
          return (
            <div key={idx} className="player-dice" style={{ position: "absolute", left: player.x * GRID_SIZE, top: player.y * GRID_SIZE - 20, zIndex: 5 }}>
              <Dice type={roll.diceType} size={20} />
            </div>
          );
        })}

        {/* Assets */}
        {assets.map((asset) => {
          if (!asset || asset.found) return null;
          const visible = isHostOrCreator || players.some((p) => Math.abs(p.x - asset.x) <= 1 && Math.abs(p.y - asset.y) <= 1);
          return visible ? (
            <div key={asset.id} className="asset" style={{ left: asset.x * GRID_SIZE, top: asset.y * GRID_SIZE }}>
              {asset.name ? asset.name[0] : "?"}
            </div>
          ) : null;
        })}

        {roundOver && <div className="round-over-overlay visible"><h2>Battle Round Over!</h2></div>}
      </div>
    </div>
  );
}
