import React, { useState, useEffect, useCallback } from 'react';
import './Reader.css';

const CHARS_PER_PAGE = 1000; // Adjust this number as needed

function Reader() {
  const [fullText, setFullText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [dictionary, setDictionary] = useState({});
  const [selectedChar, setSelectedChar] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate total pages
  const totalPages = Math.ceil((fullText?.length || 0) / CHARS_PER_PAGE);

  // Get current page text
  const getCurrentPageText = useCallback(() => {
    const start = currentPage * CHARS_PER_PAGE;
    return fullText.slice(start, start + CHARS_PER_PAGE);
  }, [fullText, currentPage]);

  // Load text
  useEffect(() => {
    fetch(`${process.env.PUBLIC_URL}/data/simplified_chinese.txt`)
      .then(response => response.text())
      .then(text => {
        setFullText(text);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading text:', err);
        setError('Failed to load text');
        setIsLoading(false);
      });
  }, []);

  // Load dictionary entries for current page
  useEffect(() => {
    if (!fullText) return;

    const pageText = getCurrentPageText();
    const uniqueChars = new Set(pageText);

    // Only load dictionary entries we don't already have
    const charsToLoad = Array.from(uniqueChars).filter(char => !dictionary[char]);

    if (charsToLoad.length === 0) return;

    fetch(`${process.env.PUBLIC_URL}/data/minimal_dictionary.json`)
      .then(response => response.json())
      .then(fullDict => {
        const newEntries = {};
        charsToLoad.forEach(char => {
          if (fullDict[char]) {
            newEntries[char] = fullDict[char];
          }
        });
        setDictionary(prev => ({ ...prev, ...newEntries }));
      })
      .catch(err => {
        console.error('Error loading dictionary:', err);
        setError('Failed to load dictionary');
        setIsLoading(false);
      });
  }, [fullText, currentPage, dictionary]);

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
        {Array.from(fullText).map((char, index) => (
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