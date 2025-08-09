import { importAllImages } from "../utils/importAllImages";
import "./BackgroundSidebar.css"

// Load all images from ../images folder
const images = importAllImages(
  require.context("../images", false, /\.(png|jpe?g|svg)$/)
);

export default function BackgroundSidebar({ selectedBackground, onSelect }) {
  return (
    <div className="background-sidebar">
      {/* Show message only if no background is selected */}
      {!selectedBackground && (
        <div style={{ padding: "1rem", color: "#ccc" }}>
          No background selected
        </div>
      )}

      {/* Render all background thumbnails */}
      {Object.values(images).map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Background ${i + 1}`}
          className={`background-thumb ${
            selectedBackground === src ? "selected" : ""
          }`}
          onClick={() => onSelect(src)}
        />
      ))}
    </div>
  );
}
