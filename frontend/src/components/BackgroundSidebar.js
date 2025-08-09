import { importAllImages } from "../utils/importAllImages";

// Pull in all background images from the folder
const images = importAllImages(
  require.context("../images", false, /\.(png|jpe?g|svg)$/)
);

export default function BackgroundSidebar({ onSelect }) {
  return (
    <div className="background-sidebar">
      {Object.values(images).map((src, i) => (
        <img
          key={i}
          src={src}
          alt={`Background ${i + 1}`}
          className="background-thumb"
          onClick={() => onSelect(src)}
        />
      ))}
    </div>
  );
}
