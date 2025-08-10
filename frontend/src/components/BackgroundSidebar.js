// src/components/BackgroundSidebar.jsx
import React, { useState } from "react";
import { importAllImages } from "../utils/importAllImages";
import "./BackgroundSidebar.css";

// Import all images from the images folder
const images = importAllImages(
  require.context("../images", false, /\.(png|jpe?g|svg)$/)
);

export default function BackgroundSidebar({ selectedBackground, onSelect }) {
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev);
  };

  return (
    <>
      {/* Toggle Button */}
      <button className="toggle-button" onClick={toggleSidebar}>
        {isSidebarVisible ? "Close" : "Backgrounds"}
      </button>

      {/* Sidebar */}
      <div className={`background-sidebar ${isSidebarVisible ? "active" : ""}`}>
        {Object.values(images).map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Background ${i + 1}`}
            className={`background-thumb ${
              selectedBackground === src ? "selected" : ""
            }`}
            onClick={() => onSelect(src)}
          />
        ))}
      </div>
    </>
  );
}
