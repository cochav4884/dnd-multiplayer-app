// src/App.js
import React, { useContext, useState } from "react";
import { UserContext } from "./UserContext";
import Login from "./Login";
import LobbySidebar from "./LobbySidebar";
import BackgroundSidebar from "./components/BackgroundSidebar";
import AssetsSidebar from "./components/AssetsSidebar";
import Battlefield from "./components/Battlefield";
import "./App.css";
import { useNavigate } from "react-router-dom";

export default function App() {
  const { user, setUser } = useContext(UserContext);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [battlefieldOpen, setBattlefieldOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inBattlefield, setInBattlefield] = useState(false);

  const navigate = useNavigate();

  if (!user) return <Login />;

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

  // Leave Lobby → logout & navigate to login
  const handleNavigateToLogin = () => {
    setUser(null); // clear user
    navigate("/login"); // redirect to login route
  };

  const isHostOrCreator = user.role === "host" || user.role === "creator";

  return (
    <div className={`app-container ${isFullscreen ? "fullscreen-mode" : ""}`}>
      {/* Left Sidebar: LobbySidebar */}
      {(!isFullscreen || isHostOrCreator) && (
        <LobbySidebar
          currentUser={user}
          setCurrentUser={setUser}
          navigateToLogin={handleNavigateToLogin}
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
        {/* Host/creator sidebars always visible on battlefield */}
        {isHostOrCreator && battlefieldOpen && (
          <div className="host-sidebars">
            <BackgroundSidebar
              userRole={user.role}
              selectedBackground={selectedBackground}
              onSelect={setSelectedBackground}
            />
            <AssetsSidebar userRole={user.role} />
          </div>
        )}

        {/* Battlefield canvas */}
        <Battlefield
          userRole={user.role}
          battlefieldOpen={battlefieldOpen}
          gameStarted={gameStarted}
          selectedBackground={selectedBackground}
          inBattlefield={inBattlefield}
          onJoinBattlefield={handleJoinBattlefield}
          onLeaveBattlefield={handleLeaveBattlefield}
        />
      </div>
    </div>
  );
}
