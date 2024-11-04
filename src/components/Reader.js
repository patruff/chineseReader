import React, { useState, useEffect } from 'react';
import minimalDictionary from '../data/minimal_dictionary.json';
import './Reader.css';

function Reader() {
  const [text, setText] = useState('');
  const [selectedChar, setSelectedChar] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/simplified_chinese.txt`)
      .then(response => response.text())
      .then(setText)
      .catch(error => console.error('Error loading text:', error));
  }, []);

  const handleCharacterClick = (e, char) => {
    e.preventDefault();
    const definition = minimalDictionary[char];
    if (definition) {
      setSelectedChar({ char, ...definition });
      setPopupPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
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
          <div className="char-info">
            <h3>{selectedChar.char}</h3>
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