import React, { useState, useEffect } from "react";
import "./Grid.css";

export default function Grid({
  cols = 40,
  rows = 25,
  players = [],
  assets = [], // { id, name, x, y }
  gameStarted,
  isHost = false,
}) {
  const [playerPositions, setPlayerPositions] = useState({});
  const [visibleAssets, setVisibleAssets] = useState([]);

  // Initialize player positions
  useEffect(() => {
    if (players.length && Object.keys(playerPositions).length === 0) {
      const initialPositions = {};
      players.forEach((p, i) => {
        initialPositions[p.username] = { x: i % cols, y: Math.floor(i / cols) };
      });
      setPlayerPositions(initialPositions);
    }
  }, [players, cols, playerPositions]);

  // Handle movement (WASD / Arrow Keys)
  useEffect(() => {
    const handleKey = (e) => {
      if (!gameStarted) return;

      setPlayerPositions((prev) => {
        const newPositions = { ...prev };
        const player = players[0]; // replace with actual logged-in player
        if (!player) return prev;
        let { x, y } = newPositions[player.username];

        if (e.key === "ArrowUp" || e.key === "w") y = Math.max(0, y - 1);
        if (e.key === "ArrowDown" || e.key === "s") y = Math.min(rows - 1, y + 1);
        if (e.key === "ArrowLeft" || e.key === "a") x = Math.max(0, x - 1);
        if (e.key === "ArrowRight" || e.key === "d") x = Math.min(cols - 1, x + 1);

        const occupied = Object.values(newPositions).some(
          (pos) => pos.x === x && pos.y === y
        );
        if (!occupied) newPositions[player.username] = { x, y };
        return newPositions;
      });
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [players, gameStarted, cols, rows]);

  // Update visible assets based on player flashlight
  useEffect(() => {
    if (!gameStarted || isHost) {
      setVisibleAssets(assets);
      return;
    }

    const visible = [];
    players.forEach((p) => {
      const pos = playerPositions[p.username];
      if (!pos) return;
      const { x, y } = pos;
      assets.forEach((asset) => {
        if (
          asset.x >= x - 1 &&
          asset.x <= x + 1 &&
          asset.y >= y - 1 &&
          asset.y <= y + 1 &&
          !visible.includes(asset)
        ) {
          visible.push(asset);
        }
      });
    });
    setVisibleAssets(visible);
  }, [playerPositions, assets, gameStarted, isHost, players]);

  // Render grid squares
  const gridSquares = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const occupiedBy = Object.entries(playerPositions).find(
        ([_, pos]) => pos.x === x && pos.y === y
      );
      const playerName = occupiedBy ? occupiedBy[0] : null;

      const assetHere = visibleAssets.find((a) => a.x === x && a.y === y);

      gridSquares.push(
        <div key={`${x}-${y}`} className="grid-square">
          {playerName && <div className="player-tracker">{playerName[0]}</div>}
          {assetHere && <div className="asset">{assetHere.name[0]}</div>}
        </div>
      );
    }
  }

  return <div className="grid-container">{gridSquares}</div>;
}
