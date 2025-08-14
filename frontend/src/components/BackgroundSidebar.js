import React, { useState, useEffect } from "react";
import { importAllImages } from "../utils/importAllImages";
import "./BackgroundSidebar.css";

// Import all images from /images folder
const images = importAllImages(
  require.context("../images", false, /\.(png|jpe?g|svg)$/)
);

export default function BackgroundSidebar({
  selectedBackground,
  onSelect,
  userRole,
  isFullscreen,
}) {
  const [isSidebarVisible, setSidebarVisible] = useState(false);

  // Only host or creator can see the sidebar
  if (userRole !== "host" && userRole !== "creator") return null;

  // Hide sidebar automatically in fullscreen
  useEffect(() => {
    if (isFullscreen) setSidebarVisible(false);
  }, [isFullscreen]);

  const toggleSidebar = () => setSidebarVisible((prev) => !prev);

  return (
    <>
      {!isFullscreen && (
        <button
          className="toggle-button"
          onClick={toggleSidebar}
          aria-label="Toggle Background Sidebar"
        >
          {isSidebarVisible ? "Close Backgrounds" : "Backgrounds"}
        </button>
      )}

      <div className={`background-sidebar ${isSidebarVisible ? "active" : ""}`}>
        {Object.entries(images).map(([fileName, src], i) => {
          const displayName = fileName
            .replace(/\.[^/.]+$/, "")
            .replace(/[-_]/g, " ")
            .trim();

          return (
            <img
              key={i}
              src={src}
              alt={displayName}
              title={displayName}
              loading="lazy"
              className={`background-thumb ${
                selectedBackground === src ? "selected" : ""
              }`}
              onClick={() => {
                onSelect(src);
                setSidebarVisible(false); // auto-close after selection
              }}
            />
          );
        })}
      </div>
    </>
  );
}
