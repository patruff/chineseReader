import React, { useState, useEffect } from 'react';
import './Reader.css';

function Reader() {
  const [text, setText] = useState('');
  const [dictionary, setDictionary] = useState({});
  const [selectedChar, setSelectedChar] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load both text and dictionary
  useEffect(() => {
    setIsLoading(true);
    
    // Load text
    const loadText = fetch(`${process.env.PUBLIC_URL}/data/simplified_chinese.txt`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load text');
        return response.text();
      });

    // Load dictionary
    const loadDictionary = fetch(`${process.env.PUBLIC_URL}/data/reduced_dictionary.json`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load dictionary');
        return response.json();
      });

    // Load both in parallel
    Promise.all([loadText, loadDictionary])
      .then(([textContent, dict]) => {
        setText(textContent);
        setDictionary(dict);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Loading error:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  const handleCharacterClick = (e, char) => {
    e.preventDefault(); // Prevent navigation
    const definition = dictionary[char];
    if (definition) {
      setSelectedChar(definition);
      setPopupPosition({
        x: e.clientX,
        y: e.clientY
      });
    } else {
      console.log('No definition found for:', char);
    }
  };

  const closePopup = () => {
    setSelectedChar(null);
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="reader-container" onClick={(e) => {
      // Close popup when clicking outside
      if (!e.target.closest('.definition-popup') && 
          !e.target.classList.contains('chinese-char')) {
        closePopup();
      }
    }}>
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