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
      
      // Calculate popup position
      const rect = e.target.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // If clicked near top of viewport, show popup below
      const showBelow = rect.top < 150;
      
      setPopupPosition({
        x: rect.left + (rect.width / 2),
        y: showBelow ? rect.bottom : rect.top,
        position: showBelow ? 'below' : 'above'
      });
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="reader-container">
      <div className="navigation-controls">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="nav-button"
        >
          ← Previous Page
        </button>
        <span className="page-info">Page {currentPage + 1} of {totalPages}</span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          className="nav-button"
        >
          Next Page →
        </button>
      </div>

      <div className="text-content">
        {Array.from(getCurrentPageText()).map((char, index) => (
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
          className={`definition-popup ${popupPosition.position}`}
          style={{
            left: `${popupPosition.x}px`,
            top: popupPosition.position === 'below' 
              ? `${popupPosition.y + 5}px` 
              : 'auto',
            bottom: popupPosition.position === 'above' 
              ? `${window.innerHeight - popupPosition.y + 5}px` 
              : 'auto',
            transform: 'translateX(-50%)'
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