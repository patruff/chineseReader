import React, { useState, useEffect } from 'react';
import './Reader.css';

function Reader() {
  const [text, setText] = useState('');
  const [dictionary, setDictionary] = useState({});
  const [selectedChar, setSelectedChar] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load both text and dictionary in parallel
    Promise.all([
      fetch(`${process.env.PUBLIC_URL}/data/simplified_chinese.txt`).then(r => r.text()),
      fetch(`${process.env.PUBLIC_URL}/data/minimal_dictionary.json`).then(r => r.json())
    ])
      .then(([textContent, dict]) => {
        setText(textContent);
        setDictionary(dict);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Loading error:', error);
        setIsLoading(false);
      });
  }, []);

  const handleCharacterClick = (e, char) => {
    e.preventDefault();
    const definition = dictionary[char];
    if (definition) {
      setSelectedChar({ char, ...definition });
      setPopupPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

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