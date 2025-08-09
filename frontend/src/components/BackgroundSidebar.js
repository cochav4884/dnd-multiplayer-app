// src/components/BackgroundSidebar.jsx
import { importAllImages } from "../utils/importAllImages";
import "./BackgroundSidebar.css";

const images = importAllImages(
  require.context("../images", false, /\.(png|jpe?g|svg)$/)
);

export default function BackgroundSidebar({ selectedBackground, onSelect }) {
  return (
    <div className="background-sidebar">
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
