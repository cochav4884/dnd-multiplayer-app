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
  const [lobbyOpen, setLobbyOpen] = useState(true);

  const isHostOrCreator = user?.role === "host" || user?.role === "creator";

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      connectSocket(parsedUser.username, parsedUser.role);
    }
  }, [setUser]);

  // Update localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      connectSocket(user.username, user.role);
    } else {
      localStorage.removeItem("user");
      disconnectSocket();
    }
  }, [user]);

  // Handle lobby updates
  useEffect(() => {
    socket.on("lobbyUpdate", (lobby) => {
      setPlayers(lobby.players || []);
    });
    return () => {
      socket.off("lobbyUpdate");
    };
  }, []);

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
    <div className="app-container">
      {/* Left Lobby Sidebar */}
      {!isFullscreen && lobbyOpen && (
        <div className="lobby-sidebar">
          <LobbySidebar
            currentUser={user}
            setCurrentUser={setUser}
            onLeaveLobby={handleLeaveLobby}
            userRole={user.role}
            gameStarted={gameStarted}
            battlefieldOpen={battlefieldOpen}
            inBattlefield={inBattlefield}
            onOpenBattlefield={handleOpenBattlefield}
            onStartGame={handleStartGame}
            onEndGame={handleEndGame}
            onJoinBattlefield={handleJoinBattlefield}
            onLeaveBattlefield={handleLeaveBattlefield}
            setPlayers={setPlayers}
            setAssets={setAssets}
          />
        </div>
      )}

      {/* Toggle button for left sidebar */}
      {!isFullscreen && (
        <button
          className="toggle-lobby"
          onClick={() => setLobbyOpen((prev) => !prev)}
        >
          {lobbyOpen ? "⏪" : "⏩"}
        </button>
      )}

      {/* Center Battlefield */}
      <div
        className={`battlefield-wrapper ${isFullscreen ? "fullscreen-mode" : ""}`}
      >
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

        {/* Fullscreen toggle inside battlefield */}
        <button className="fullscreen-toggle" onClick={toggleFullscreen}>
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      {/* Right host sidebars */}
      {!isFullscreen && isHostOrCreator && battlefieldOpen && (
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
  );
}
