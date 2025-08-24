// src/GameRoom.js
import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "./UserContext";
import LobbySidebar from "./LobbySidebar";
import Battlefield from "./components/Battlefield";
import BackgroundSidebar from "./components/BackgroundSidebar";
import AssetsSidebar from "./components/AssetsSidebar";
import { socket } from "./socket";
import "./GameRoom.css";

export default function GameRoom() {
  const { user } = useContext(UserContext);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [battlefieldOpen, setBattlefieldOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [inBattlefield, setInBattlefield] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hideSidebars, setHideSidebars] = useState(false);

  // Lobby state from server
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [battlefieldPlayers, setBattlefieldPlayers] = useState([]);
  const [assets, setAssets] = useState([]);

  if (!user) return null;

  useEffect(() => {
    socket.on("lobbyUpdate", (lobby) => {
      setLobbyPlayers(lobby.players || []);
      setBattlefieldPlayers(lobby.battlefieldPlayers || []);
    });

    return () => {
      socket.off("lobbyUpdate");
    };
  }, []);

  // Host / Creator actions
  const handleOpenBattlefield = () => setBattlefieldOpen(true);
  const handleStartGame = () => setGameStarted(true);
  const handleEndGame = () => {
    setGameStarted(false);
    setBattlefieldOpen(false);
    setInBattlefield(false);
  };

  // Player actions
  const handleJoinBattlefield = () => {
    socket.emit("joinBattlefield", user.id);
    setInBattlefield(true);
  };
  const handleLeaveBattlefield = () => {
    socket.emit("leaveBattlefield", user.id);
    setInBattlefield(false);
  };

  // UI controls
  const handleToggleFullscreen = () => setIsFullscreen((prev) => !prev);
  const handleToggleSidebars = () => setHideSidebars((prev) => !prev);

  return (
    <div className={`game-room ${isFullscreen ? "fullscreen-mode" : ""}`}>
      {/* Lobby Sidebar */}
      <LobbySidebar
        currentUser={user}
        gameStarted={gameStarted}
        battlefieldOpen={battlefieldOpen}
        onOpenBattlefield={handleOpenBattlefield}
        onStartGame={handleStartGame}
        onEndGame={handleEndGame}
        onToggleFullScreen={handleToggleFullscreen}
        isFullScreen={isFullscreen}
      />

      {/* Battlefield */}
      <Battlefield
        userRole={user.role}
        gameStarted={gameStarted}
        battlefieldOpen={battlefieldOpen}
        selectedBackground={selectedBackground}
        hideSidebars={hideSidebars}
        inBattlefield={inBattlefield}
        onJoinBattlefield={handleJoinBattlefield}
        onLeaveBattlefield={handleLeaveBattlefield}
        playersFromLobby={battlefieldPlayers
          .map((pid) => lobbyPlayers.find((p) => p.id === pid))
          .filter(Boolean)}
        assetsFromServer={assets}
        onPlaceAsset={(assetId, x, y) => {
          setAssets((prev) =>
            prev.map((a) =>
              a.id === assetId ? { ...a, x, y, found: false } : a
            )
          );
        }}
      />

      {/* Right-side sidebars */}
      {battlefieldOpen && !gameStarted && (user.role === "host" || user.role === "creator") && !hideSidebars && (
        <>
          <BackgroundSidebar
            selectedBackground={selectedBackground}
            onSelect={setSelectedBackground}
            userRole={user.role}
            isFullscreen={isFullscreen}
          />
          <AssetsSidebar
            userRole={user.role}
            onPlaceAsset={(assetId, x, y) => {
              setAssets((prev) =>
                prev.map((a) =>
                  a.id === assetId ? { ...a, x, y, found: false } : a
                )
              );
            }}
          />
        </>
      )}

      {/* Toggle button for right sidebars */}
      {battlefieldOpen && !gameStarted && (user.role === "host" || user.role === "creator") && (
        <button className="toggle-sidebars-btn" onClick={handleToggleSidebars}>
          {hideSidebars ? "Show Sidebars" : "Hide Sidebars"}
        </button>
      )}
    </div>
  );
}
