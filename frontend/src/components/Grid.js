import React, { useEffect, useState } from "react";
import "./Grid.css";

export default function Grid({ children }) {
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // Players: name, position, color, optional avatar
  const [players, setPlayers] = useState([
    {
      id: 1,
      name: "Alice",
      row: 0,
      col: 0,
      color: "#ff4081",
      avatar: null, // e.g. "/avatars/alice.png"
    },
    {
      id: 2,
      name: "Bob",
      row: 2,
      col: 3,
      color: "#00bcd4",
      avatar: null,
    },
  ]);

  // Active player ID (controlled by keyboard)
  const [activePlayerId, setActivePlayerId] = useState(1);

  // Resize grid on load and resize
  useEffect(() => {
    function updateGrid() {
      const availableWidth = window.innerWidth - 500;
      const availableHeight = window.innerHeight;
      const columns = Math.floor(availableWidth / 20);
      const rowsCount = Math.floor(availableHeight / 20);

      setCols(columns);
      setRows(rowsCount);
    }

    updateGrid();
    window.addEventListener("resize", updateGrid);
    return () => window.removeEventListener("resize", updateGrid);
  }, []);

  // Move a player by delta row/col
  const movePlayer = (playerId, deltaRow, deltaCol) => {
    setPlayers((prevPlayers) =>
      prevPlayers.map((player) => {
        if (player.id !== playerId) return player;

        let newRow = player.row + deltaRow;
        let newCol = player.col + deltaCol;

        newRow = Math.max(0, Math.min(rows - 1, newRow));
        newCol = Math.max(0, Math.min(cols - 1, newCol));

        return { ...player, row: newRow, col: newCol };
      })
    );
  };

  // Listen for keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      let moved = false;

      if (["arrowup", "w"].includes(key)) {
        movePlayer(activePlayerId, -1, 0);
        moved = true;
      } else if (["arrowdown", "s"].includes(key)) {
        movePlayer(activePlayerId, 1, 0);
        moved = true;
      } else if (["arrowleft", "a"].includes(key)) {
        movePlayer(activePlayerId, 0, -1);
        moved = true;
      } else if (["arrowright", "d"].includes(key)) {
        movePlayer(activePlayerId, 0, 1);
        moved = true;
      }

      if (moved) {
        e.preventDefault(); // Prevent scroll
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePlayerId, rows, cols]);

  return (
    <div className="grid-container">
      {/* Game Start Overlay */}
      {!gameStarted && (
        <div className="start-game-overlay">
          <button onClick={() => setGameStarted(true)}>Start Game</button>
        </div>
      )}

      {/* Flashlight Mask */}
      {gameStarted && (
        <div className="flashlight-mask">
          {players.map((player) => (
            <div
              key={player.id}
              className="flashlight-circle"
              style={{
                top: `${player.row * 20 - 20}px`, // Center over 3x3 area
                left: `${player.col * 20 - 20}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Grid lines */}
      <div
        className="grid-overlay"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 20px)`,
          gridAutoRows: "20px",
        }}
      >
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div key={i} className="grid-square" />
        ))}
      </div>

      {/* Tokens */}
      <div className="grid-content">
        {players.map((player) => (
          <div
            key={player.id}
            className={`player-token ${player.id === activePlayerId ? "active" : ""}`}
            title={player.name}
            style={{
              top: `${player.row * 20}px`,
              left: `${player.col * 20}px`,
              backgroundColor: player.avatar ? "transparent" : player.color,
              backgroundImage: player.avatar ? `url(${player.avatar})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!player.avatar && player.name[0]}
          </div>
        ))}

        {children}
      </div>
    </div>
  );
}
