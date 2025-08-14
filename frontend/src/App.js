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
  const [battlefieldOpen, setBattlefieldOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inBattlefield, setInBattlefield] = useState(false);

  if (!user) {
    return <Login />;
  }

  // Fullscreen toggle
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  // Lobby/Game controls
  const handleOpenBattlefield = () => setBattlefieldOpen(true);
  const handleStartGame = () => setGameStarted(true);
  const handleEndGame = () => {
    setGameStarted(false);
    setBattlefieldOpen(false);
    setInBattlefield(false);
  };

  const handleJoinBattlefield = () => setInBattlefield(true);
  const handleLeaveBattlefield = () => setInBattlefield(false);

  return (
    <div className={`app-container ${isFullscreen ? "fullscreen-mode" : ""}`}>
      {/* Left Sidebar: LobbySidebar */}
      {!isFullscreen && (
        <LobbySidebar
          userRole={user.role}
          gameStarted={gameStarted}
          battlefieldOpen={battlefieldOpen}
          inBattlefield={inBattlefield}
          onOpenBattlefield={handleOpenBattlefield}
          onStartGame={handleStartGame}
          onEndGame={handleEndGame}
          onJoinBattlefield={handleJoinBattlefield}
          onLeaveBattlefield={handleLeaveBattlefield}
          isFullScreen={isFullscreen}
          onToggleFullScreen={toggleFullscreen}
        />
      )}

      {/* Center: Battlefield */}
      <div className="battlefield-wrapper">
        {(user.role === "host" || user.role === "creator") &&
          battlefieldOpen &&
          !gameStarted &&
          !isFullscreen && (
            <>
              <BackgroundSidebar
                userRole={user.role}
                selectedBackground={selectedBackground}
                onSelect={setSelectedBackground}
              />
              <AssetsSidebar userRole={user.role} />
            </>
          )}

        <Battlefield
          userRole={user.role}
          battlefieldOpen={battlefieldOpen}
          gameStarted={gameStarted}
          selectedBackground={selectedBackground}
        />
      </div>
    </div>
  );
}
