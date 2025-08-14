// src/App.js
import React, { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import Login from "./Login";
import LobbySidebar from "./LobbySidebar";
import BackgroundSidebar from "./components/BackgroundSidebar";
import AssetsSidebar from "./components/AssetsSidebar";
import Battlefield from "./components/Battlefield";
import "./App.css";

export default function App() {
  const { user } = useContext(UserContext);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!user) {
    return <Login />;
  }

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  return (
    <div className={`app-container ${isFullscreen ? "fullscreen-mode" : ""}`}>
      {/* Left Sidebar: LobbySidebar */}
      {user && !isFullscreen && <LobbySidebar gameStarted={gameStarted} setGameStarted={setGameStarted} />}

      {/* Center: Battlefield */}
      <div className="battlefield-wrapper">
        {user.role === "host" && !isFullscreen && (
          <>
            <BackgroundSidebar
              selectedBackground={selectedBackground}
              onSelect={setSelectedBackground}
            />
            <AssetsSidebar />
          </>
        )}

        <Battlefield
          userRole={user.role}
          gameStarted={gameStarted}
          selectedBackground={selectedBackground}
        />

        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>
    </div>
  );
}
