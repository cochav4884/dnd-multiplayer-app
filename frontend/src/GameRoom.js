// src/GameRoom.js
import React, { useState, useContext, useEffect } from "react";
import { UserContext } from "./UserContext";
import LobbySidebar from "./LobbySidebar";
import Battlefield from "./components/Battlefield";
import { socket } from "./socket";
import "./GameRoom.css";

export default function GameRoom() {
  const { user } = useContext(UserContext);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [battlefieldOpen, setBattlefieldOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [inBattlefield, setInBattlefield] = useState(false);
  const [hideSidebars, setHideSidebars] = useState(false);

  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [battlefieldPlayers, setBattlefieldPlayers] = useState([]);
  const [assets, setAssets] = useState([]);

  if (!user) return null;

  useEffect(() => {
    socket.on("lobbyUpdate", (lobby) => {
      setLobbyPlayers(lobby.players || []);
      setBattlefieldPlayers(lobby.battlefieldPlayers || []);
    });
    return () => socket.off("lobbyUpdate");
  }, []);

  const handleOpenBattlefield = () => setBattlefieldOpen(true);
  const handleStartGame = () => setGameStarted(true);
  const handleEndGame = () => {
    setGameStarted(false);
    setBattlefieldOpen(false);
    setInBattlefield(false);
  };

  const handleJoinBattlefield = () => {
    socket.emit("joinBattlefield", user.id);
    setInBattlefield(true);
  };
  const handleLeaveBattlefield = () => {
    socket.emit("leaveBattlefield", user.id);
    setInBattlefield(false);
  };

  return (
    <div className="game-room">
      {/* Lobby Sidebar */}
      <LobbySidebar
        currentUser={user}
        gameStarted={gameStarted}
        battlefieldOpen={battlefieldOpen}
        onOpenBattlefield={handleOpenBattlefield}
        onStartGame={handleStartGame}
        onEndGame={handleEndGame}
        isFullScreen={false} // remove fullscreen from sidebar
      />

      {/* Battlefield */}
      <Battlefield
        userRole={user.role}
        gameStarted={gameStarted}
        battlefieldOpen={battlefieldOpen}
        selectedBackground={selectedBackground}
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
    </div>
  );
}
