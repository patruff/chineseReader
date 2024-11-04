import React, { useState, useEffect } from 'react';
import dictionary from '../data/reduced_dictionary.json';
import './Reader.css';

function Reader() {
  const [text, setText] = useState('');
  const [selectedChar, setSelectedChar] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/simplified_chinese.txt`)
      .then(response => response.text())
      .then(setText);
  }, []);

  const handleCharacterClick = (e, char) => {
    e.preventDefault(); // Prevent navigation
    const definition = dictionary[char];
    if (definition) {
      setSelectedChar(definition);
      // Position popup near the clicked character
      setPopupPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const closePopup = () => {
    setSelectedChar(null);
  };

  return (
    <div className="reader-container">
      <div className="text-content">
        {Array.from(text).map((char, index) => (
          <span
            key={index}
            className="chinese-char"
            onClick={(e) => handleCharacterClick(e, char)}
          >
            {char}
          </span>
        ))}
      </div>

      {selectedChar && (
        <div 
          className="definition-popup"
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`
          }}
        >
          <button className="close-button" onClick={closePopup}>×</button>
          <div className="char-info">
            <h3>{selectedChar.simplified}</h3>
            <p className="pinyin">{selectedChar.pinyin}</p>
            <ul className="definitions">
              {selectedChar.definitions.map((def, index) => (
                <li key={index}>{def}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reader; 