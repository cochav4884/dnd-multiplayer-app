import React from 'react';
import './Grid.css';

export default function Grid({ backgroundImage, children }) {
  return (
    <div className="grid-container">
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt="Background"
          className="grid-background-image"
        />
      )}
      <div className="grid-overlay"></div>

      {/* Content layered on top of grid */}
      <div className="grid-content">
        {children}
      </div>
    </div>
  );
}
