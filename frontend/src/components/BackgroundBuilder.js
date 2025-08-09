import React, { useState } from 'react';
import './BackgroundBuilder.css'; // We'll add styles here soon

// Placeholder images — replace with your actual images later
const backgrounds = [
  { id: 1, name: 'Forest', url: '/images/forest.jpg' },
  { id: 2, name: 'Dungeon', url: '/images/dungeon.jpg' },
  { id: 3, name: 'Castle', url: '/images/castle.jpg' },
];

export default function BackgroundBuilder() {
  const [selectedBackground, setSelectedBackground] = useState(null);

  return (
    <div className="background-builder">
      <aside className="sidebar">
        <h3>Select Background</h3>
        <ul>
          {backgrounds.map(bg => (
            <li key={bg.id}>
              <button onClick={() => setSelectedBackground(bg.url)}>
                {bg.name}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="background-display">
        {selectedBackground ? (
          <img
            src={selectedBackground}
            alt="Selected Background"
            className="background-image"
          />
        ) : (
          <p>No background selected</p>
        )}
      </main>
    </div>
  );
}
