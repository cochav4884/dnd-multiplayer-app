import React, { useState } from "react";
import "./AssetsSidebar.css";

export default function AssetsSidebar({ onPlaceAsset, userRole }) {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [assets, setAssets] = useState([
    { id: 1, name: "Treasure Chest", x: null, y: null, found: false },
    { id: 2, name: "Magic Sword", x: null, y: null, found: false },
    { id: 3, name: "Potion", x: null, y: null, found: false },
  ]);

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  const handlePlaceAsset = (assetId) => {
    const GRID_COLUMNS = 40;
    const GRID_ROWS = 25;

    const x = Math.floor(Math.random() * GRID_COLUMNS);
    const y = Math.floor(Math.random() * GRID_ROWS);

    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId ? { ...a, x, y, found: false, flying: false } : a
      )
    );

    if (onPlaceAsset) onPlaceAsset(assetId, x, y);
  };

  // Animate asset flying back to sidebar
  const handleCollectAsset = (assetId) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId ? { ...a, flying: true } : a
      )
    );

    // Wait for animation to finish before resetting
    setTimeout(() => {
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId ? { ...a, x: null, y: null, found: false, flying: false } : a
        )
      );
    }, 500); // match animation duration
  };

  // Only render content for host or creator
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
            className={`asset-item ${asset.flying ? "flying" : ""}`}
            draggable={!asset.flying}
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
