import React, { useState, useEffect } from 'react';
import './BackgroundBuilder.css';

// Utility to import all images from a folder dynamically
function importAllImages(r) {
  let images = [];
  r.keys().forEach((item) => {
    images.push({
      name: item.replace('./', ''),
      url: r(item).default || r(item),
    });
  });
  return images;
}

export default function BackgroundBuilder() {
  const [backgrounds, setBackgrounds] = useState([]);
  const [selectedBackground, setSelectedBackground] = useState(null);

  // On mount, load all images from src/images folder
  useEffect(() => {
    try {
      const imgs = importAllImages(require.context('../images', false, /\.(jpe?g|png|svg)$/));
      setBackgrounds(imgs);
    } catch (error) {
      console.error('Error loading images:', error);
    }
  }, []);

  return (
    <div className="background-builder">
      <aside className="sidebar">
        <h3>Select Background</h3>
        <ul className="background-list">
          {backgrounds.length > 0 ? (
            backgrounds.map((bg, i) => (
              <li key={i} className="background-item">
                <button
                  onClick={() => setSelectedBackground(bg.url)}
                  className={selectedBackground === bg.url ? 'selected' : ''}
                  title={bg.name}
                >
                  <img
                    src={bg.url}
                    alt={bg.name}
                    className="thumbnail"
                    loading="lazy"
                  />
                  <div className="bg-name">{bg.name || bg.name.split('.')[0]}</div>
                </button>
              </li>
            ))
          ) : (
            <li>Loading backgrounds...</li>
          )}
        </ul>

        <button
          className="clear-selection"
          onClick={() => setSelectedBackground(null)}
          disabled={!selectedBackground}
          aria-disabled={!selectedBackground}
          title="Clear background selection"
        >
          Clear Selection
        </button>
      </aside>

      <main className="background-display">
        {selectedBackground ? (
          <div className="background-image-wrapper">
            <img
              src={selectedBackground}
              alt="Selected Background"
              className="background-image"
            />
            {/* Placeholder for items layer on top of background */}
            <div className="items-overlay">
              {/* Future item components can go here */}
            </div>
          </div>
        ) : (
          <p>No background selected</p>
        )}
      </main>
    </div>
  );
}
