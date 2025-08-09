import React, { useEffect, useState } from "react";
import "./Grid.css";

export default function Grid({ children }) {
  const [gridSquares, setGridSquares] = useState([]);
  const [cols, setCols] = useState(0);

  useEffect(() => {
    function updateGrid() {
      const availableWidth = window.innerWidth - 500; // adjust sidebars width if needed
      const availableHeight = window.innerHeight;

      const columns = Math.max(1, Math.floor(availableWidth / 20));
      const rows = Math.max(1, Math.floor(availableHeight / 20));

      setCols(columns);
      setGridSquares(Array(columns * rows).fill(0));
    }

    updateGrid();

    window.addEventListener("resize", updateGrid);
    return () => window.removeEventListener("resize", updateGrid);
  }, []);

  return (
    <div className="grid-container">
      <div
        className="grid-overlay"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 20px)`,
          gridAutoRows: "20px",
        }}
      >
        {gridSquares.map((_, i) => (
          <div key={i} className="grid-square" />
        ))}
      </div>

      {/* Content layered on top of grid */}
      <div className="grid-content">{children}</div>
    </div>
  );
}
