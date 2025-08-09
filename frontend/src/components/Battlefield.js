import Grid from "./Grid";

// Battlefield.js
export default function Battlefield({ background }) {
  return (
    <div className="battlefield">
      {background ? (
        <img
          src={background}
          alt="Battlefield background"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div className="battlefield-placeholder">No background selected</div>
      )}

      <div className="grid-overlay">
        <Grid />
      </div>
    </div>
  );
}
