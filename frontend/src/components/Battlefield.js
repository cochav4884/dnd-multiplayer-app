import React from 'react';  
import "./Battlefield.css"

const Battlefield = ({ background }) => {
  return (
    <div className="battlefield">
      {background ? (
        <div
          className="background-image"
          style={{ backgroundImage: `url(${background})` }}
        >
          <div className="grid-overlay" />
        </div>
      ) : (
        <div className="battlefield-placeholder">No background selected</div>
      )}
    </div>
  );
};

export default Battlefield;
