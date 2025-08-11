import { useState, useContext, useEffect } from "react";
import { UserContext } from "./UserContext";
import Login from "./Login";
import LobbySidebar from "./LobbySidebar";
import BackgroundSidebar from "./components/BackgroundSidebar";
import Battlefield from "./components/Battlefield";
import { importAllImages } from "./utils/importAllImages";
import "./App.css";

// Load images from images folder
const imagesContext = require.context("./images", false, /\.(png|jpe?g|svg)$/);
const images = importAllImages(imagesContext);

export default function App() {
  const { user } = useContext(UserContext);
  const [selectedBackground, setSelectedBackground] = useState(null);

  // Shared states
  const [gameStarted, setGameStarted] = useState(false);
  const [hasJoinedBattlefield, setHasJoinedBattlefield] = useState(false);

  useEffect(() => {
    if (user && Object.values(images).length > 0) {
      setSelectedBackground(Object.values(images)[0]);
    } else {
      setSelectedBackground("path/to/default/image.jpg"); // fallback image path
    }
  }, [user]);

  if (!user) {
    return (
      <div className="app-container">
        <Login />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="main-layout">
        {/* LobbySidebar visible if game not started or user not on battlefield */}
        {(!gameStarted || (gameStarted && !hasJoinedBattlefield)) && (
          <LobbySidebar
            setGameStarted={setGameStarted}
            setHasJoinedBattlefield={setHasJoinedBattlefield}
            gameStarted={gameStarted}
            hasJoinedBattlefield={hasJoinedBattlefield}
          />
        )}

        {/* Battlefield visible only when game started and user joined battlefield */}
        {gameStarted && hasJoinedBattlefield && (
          <Battlefield
            user={user}
            background={selectedBackground}
            setHasJoinedBattlefield={setHasJoinedBattlefield}
            setGameStarted={setGameStarted}
          />
        )}

        <BackgroundSidebar
          selectedBackground={selectedBackground}
          onSelect={setSelectedBackground}
        />
      </div>
    </div>
  );
}
