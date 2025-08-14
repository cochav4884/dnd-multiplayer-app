import React, { useState } from "react";
import "./AssetsSidebar.css";

export default function AssetsSidebar({ onPlaceAsset, userRole }) {
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  // Example assets
  const [assets, setAssets] = useState([
    { id: 1, name: "Treasure Chest", x: null, y: null, found: false },
    { id: 2, name: "Magic Sword", x: null, y: null, found: false },
    { id: 3, name: "Potion", x: null, y: null, found: false },
  ]);

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  const handlePlaceAsset = (assetId) => {
    // Random placement (demo); can replace with drag-drop coordinates
    const x = Math.floor(Math.random() * 40); // GRID_COLUMNS
    const y = Math.floor(Math.random() * 25); // GRID_ROWS

    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId ? { ...a, x, y, found: false } : a
      )
    );

    if (onPlaceAsset) onPlaceAsset(assetId, x, y);
  };

  // Only show sidebar for host or creator
  if (userRole !== "host" && userRole !== "creator") return null;

  return (
    <>
      <button
        className="toggle-button"
        onClick={toggleSidebar}
        aria-label="Toggle Assets Sidebar"
      >
        {isSidebarVisible ? "Close Assets" : "Assets"}
      </button>

      <div className={`assets-sidebar ${isSidebarVisible ? "active" : ""}`}>
        <h3>Assets (Host Only)</h3>
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="asset-item"
            draggable
            onDragStart={(e) => e.dataTransfer.setData("assetId", asset.id)}
          >
            <span>{asset.name}</span>
            <button onClick={() => handlePlaceAsset(asset.id)}>Place</button>
          </div>
        ))}
      </div>
    </>
  );
}
