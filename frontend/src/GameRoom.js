// src/GameRoom.js
import React, { useState, useContext, useEffect, useRef } from "react";
import { UserContext } from "./UserContext";
import LobbySidebar from "./LobbySidebar";
import Battlefield from "./components/Battlefield";
import AssetsSidebar from "./components/AssetsSidebar";
import { socket } from "./socket";
import "./GameRoom.css";

export default function GameRoom() {
  const { user } = useContext(UserContext);
  const [selectedBackground, setSelectedBackground] = useState(null);
  const [battlefieldOpen, setBattlefieldOpen] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [inBattlefield, setInBattlefield] = useState(false);

  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [battlefieldPlayers, setBattlefieldPlayers] = useState([]);
  const [assets, setAssets] = useState([
    { id: 1, name: "Treasure Chest", x: null, y: null, found: false },
    { id: 2, name: "Magic Sword", x: null, y: null, found: false },
    { id: 3, name: "Potion", x: null, y: null, found: false },
  ]);

  const assetsSidebarRef = useRef();

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
    // Reset assets
    setAssets((prev) => prev.map((a) => ({ ...a, found: false, x: null, y: null })));
  };

  const handleJoinBattlefield = () => {
    socket.emit("joinBattlefield", user.id);
    setInBattlefield(true);
  };
  const handleLeaveBattlefield = () => {
    socket.emit("leaveBattlefield", user.id);
    setInBattlefield(false);
  };

  // Called when a player reaches an asset
  const handleCollectAsset = (assetId) => {
    setAssets((prev) =>
      prev.map((a) =>
        a.id === assetId ? { ...a, found: true } : a
      )
    );

    // If host/creator, update AssetsSidebar
    if (assetsSidebarRef.current) {
      assetsSidebarRef.current.handleCollectAsset(assetId);
    }

    // Check if all assets are found
    const allFound = assets.every((a) => a.found || a.id === assetId);
    if (allFound) {
      setGameStarted(false); // end round
      alert("Battle Round Over!");
    }
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
        isFullScreen={false}
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
        onCollectAsset={handleCollectAsset} // connect collection
      />

      {/* Hidden host AssetsSidebar to handle collected assets */}
      {user.role === "host" || user.role === "creator" ? (
        <AssetsSidebar
          ref={assetsSidebarRef}
          userRole={user.role}
          onPlaceAsset={(assetId, x, y) => {
            setAssets((prev) =>
              prev.map((a) =>
                a.id === assetId ? { ...a, x, y, found: false } : a
              )
            );
          }}
        />
      ) : null}
    </div>
  );
}
