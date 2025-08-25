// src/App.js
import React, { useContext, useState, useEffect } from "react";
import { UserContext } from "./UserContext";
import { useNavigate } from "react-router-dom";
import Login from "./Login";
import LobbySidebar from "./LobbySidebar";
import BackgroundSidebar from "./components/BackgroundSidebar";
import AssetsSidebar from "./components/AssetsSidebar";
import Battlefield from "./components/Battlefield";
import "./App.css";
import { socket, connectSocket, disconnectSocket } from "./socket";

export default function App() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [selectedBackground, setSelectedBackground] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [battlefieldOpen, setBattlefieldOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inBattlefield, setInBattlefield] = useState(false);

  const [players, setPlayers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [lobbyOpen, setLobbyOpen] = useState(true); // <-- collapsible lobby

  const isHostOrCreator = user?.role === "host" || user?.role === "creator";

  // Connect socket when user logs in
  useEffect(() => {
    if (user?.username && user?.role) {
      connectSocket(user.username, user.role);

      socket.on("lobbyUpdate", (lobby) => {
        setPlayers(lobby.players || []);
      });
    }
    return () => {
      disconnectSocket();
    };
  }, [user]);

  const handleLeaveLobby = () => {
    if (!user) return;
    socket.emit("leaveLobby", user.id, (success) => {
      if (success) {
        setUser(null);
        setPlayers([]);
        setAssets([]);
        setGameStarted(false);
        setBattlefieldOpen(false);
        setInBattlefield(false);
        setSelectedBackground(null);
        navigate("/login");
        alert("You have left the lobby. You can log back in now.");
      } else {
        alert("Error leaving the lobby. Try again.");
      }
    });
  };

  const handleOpenBattlefield = () => setBattlefieldOpen(true);
  const handleStartGame = () => setGameStarted(true);
  const handleEndGame = () => {
    setGameStarted(false);
    setBattlefieldOpen(false);
    setInBattlefield(false);
  };
  const handleJoinBattlefield = () => setInBattlefield(true);
  const handleLeaveBattlefield = () => setInBattlefield(false);
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  if (!user) return <Login />;

  return (
    <div className={`app-container ${isFullscreen ? "fullscreen-mode" : ""}`}>
      {/* Left Lobby Sidebar */}
      <div
        className={`sidebar left ${lobbyOpen ? "sidebar-left-open" : "hidden"}`}
      >
        <LobbySidebar
          currentUser={user}
          setCurrentUser={setUser}
          navigateToLogin={handleLeaveLobby}
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
          setPlayers={setPlayers}
          setAssets={setAssets}
        />
      </div>

      {/* Toggle button for Lobby */}
      <button
        className="toggle-lobby"
        onClick={() => setLobbyOpen((prev) => !prev)}
      >
        {lobbyOpen ? "⏪" : "⏩"}
      </button>

      {/* Battlefield center */}
      <div className="battlefield-wrapper">
        <Battlefield
          userRole={user.role}
          battlefieldOpen={battlefieldOpen}
          gameStarted={gameStarted}
          selectedBackground={selectedBackground}
          inBattlefield={inBattlefield}
          onJoinBattlefield={handleJoinBattlefield}
          onLeaveBattlefield={handleLeaveBattlefield}
          playersFromLobby={players}
          assetsFromServer={assets}
          onPlaceAsset={(assetId, x, y) =>
            setAssets((prev) =>
              prev.map((a) =>
                a.id === assetId ? { ...a, x, y, found: false } : a
              )
            )
          }
        />

        {/* Right Sidebars (Background + Assets) */}
        {(!isFullscreen || isHostOrCreator) && (
          <div className="host-sidebars">
            <BackgroundSidebar
              userRole={user.role}
              selectedBackground={selectedBackground}
              onSelect={setSelectedBackground}
            />
            <AssetsSidebar userRole={user.role} />
          </div>
        )}
      </div>
    </div>
  );
}
