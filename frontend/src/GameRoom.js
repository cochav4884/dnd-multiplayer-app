// src/GameRoom.js
import React, { useState, useContext } from "react";
import { UserContext } from "./UserContext";
import LobbySidebar from "./LobbySidebar";
import Battlefield from "./components/Battlefield";
import BackgroundSidebar from "./components/BackgroundSidebar";
import AssetsSidebar from "./components/AssetsSidebar";
import "./GameRoom.css";

export default function GameRoom() {
  const { user } = useContext(UserContext);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [battlefieldOpen, setBattlefieldOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [inBattlefield, setInBattlefield] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideSidebars, setHideSidebars] = useState(false);

  if (!user) return null;

  // Host actions
  const handleOpenBattlefield = () => setBattlefieldOpen(true);
  const handleStartGame = () => setGameStarted(true);
  const handleEndGame = () => {
    setGameStarted(false);
    setBattlefieldOpen(false);
    setInBattlefield(false);
  };

  // Player actions
  const handleJoinBattlefield = () => setInBattlefield(true);
  const handleLeaveBattlefield = () => setInBattlefield(false);

  // UI controls
  const handleToggleFullscreen = () => setIsFullscreen((prev) => !prev);
  const handleToggleSidebars = () => setHideSidebars((prev) => !prev);

  return (
    <div className={`game-room ${isFullscreen ? "fullscreen-mode" : ""}`}>
      {/* Lobby Sidebar */}
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
        onToggleFullScreen={handleToggleFullscreen}
        hideSidebars={hideSidebars}
        onToggleSidebars={handleToggleSidebars}
      />

      {/* Battlefield */}
      <Battlefield
        userRole={user.role}
        gameStarted={gameStarted}
        battlefieldOpen={battlefieldOpen}
        selectedBackground={selectedBackground}
        hideSidebars={hideSidebars}
      />

      {/* Sidebars visible only when battlefield is open and game hasn't started */}
      {battlefieldOpen && !gameStarted && (user.role === "host" || user.role === "creator") && !hideSidebars && (
        <>
          <BackgroundSidebar
            selectedBackground={selectedBackground}
            onSelect={setSelectedBackground}
          />
          <AssetsSidebar />
        </>
      )}
    </div>
  );
}
