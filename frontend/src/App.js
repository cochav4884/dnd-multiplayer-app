import { useState, useContext, useEffect } from "react";
import { UserContext } from "./UserContext";
import Login from "./Login";
import LobbySidebar from "./LobbySidebar";
import BackgroundSidebar from "./components/BackgroundSidebar";
import Battlefield from "./components/Battlefield";
import { importAllImages } from "./utils/importAllImages";
import "./App.css";

// Load all images from images folder
const imagesContext = require.context(
  "./images",
  false,
  /\.(png|jpe?g|svg)$/
);

const images = importAllImages(imagesContext);

export default function App() {
  const { user } = useContext(UserContext);
  const [selectedBackground, setSelectedBackground] = useState(null);

  // Log loaded images once component renders
  console.log("Loaded images:", images);

  // Set default background when user logs in and images are loaded
  useEffect(() => {
    if (user && Object.values(images).length > 0) {
      setSelectedBackground(Object.values(images)[0]);
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
        <LobbySidebar />
        <Battlefield background={selectedBackground} />
        <BackgroundSidebar
          selectedBackground={selectedBackground} // Pass current background here
          onSelect={setSelectedBackground}
        />
      </div>
    </div>
  );
}
