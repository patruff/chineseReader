import React, { useState, useEffect, useCallback } from 'react';
import './Reader.css';

const CHARS_PER_PAGE = 500;

// Define compound markers
const COMPOUND_MARKERS = {
    4: ['《', '》'],
    3: ['【', '】'],
    2: ['『', '』']
};

function Reader() {
  const [fullText, setFullText] = useState('');
  const [dictionary, setDictionary] = useState({});
  const [selectedChar, setSelectedChar] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add processText function inside component
  const processText = useCallback((text) => {
    const segments = [];
    let currentPos = 0;

    // Create patterns for matching compounds
    const patterns = Object.entries(COMPOUND_MARKERS).map(([length, [start, end]]) => {
      const pattern = `\\${start}([^\\${end}]+)\\${end}`;
      return { length, pattern };
    });

    const combinedPattern = new RegExp(patterns.map(p => p.pattern).join('|'), 'g');

    let match;
    while ((match = combinedPattern.exec(text)) !== null) {
      // Add characters before the compound
      if (match.index > currentPos) {
        const beforeText = text.slice(currentPos, match.index);
        segments.push(...Array.from(beforeText).map(char => ({
          text: char,
          type: 'char'
        })));
      }

      // Determine compound type based on markers
      const fullMatch = match[0];
      const compoundText = match[1] || match[2] || match[3];
      let compoundType;
      
      if (fullMatch.startsWith('《')) compoundType = 'compound-4';
      else if (fullMatch.startsWith('【')) compoundType = 'compound-3';
      else compoundType = 'compound-2';

      segments.push({
        text: compoundText,
        type: compoundType
      });

      currentPos = match.index + fullMatch.length;
    }

    // Add remaining characters
    if (currentPos < text.length) {
      const remainingText = text.slice(currentPos);
      segments.push(...Array.from(remainingText).map(char => ({
        text: char,
        type: 'char'
      })));
    }

    return segments;
  }, []);

  const getCurrentPageText = useCallback(() => {
    const start = currentPage * CHARS_PER_PAGE;
    return fullText.slice(start, start + CHARS_PER_PAGE);
  }, [fullText, currentPage]);

  const handleClick = useCallback((e, segment) => {
    e.preventDefault();
    let definition;
    
    if (segment.type.startsWith('compound-')) {
        // If clicking a compound, look up the whole compound
        definition = dictionary[segment.text];
    } else {
        // If clicking a single character, check if it's part of a compound
        const compoundRef = dictionary[`ref:${segment.text}`];
        if (compoundRef) {
            // If it's part of a compound, get the compound definition
            definition = dictionary[compoundRef];
            segment = { text: compoundRef, type: 'compound' };
        } else {
            // Otherwise get the character definition
            definition = dictionary[segment.text];
        }
    }

    if (definition) {
        setSelectedChar({
            char: segment.text,
            type: segment.type,
            ...definition
        });
        
        const rect = e.target.getBoundingClientRect();
        const showBelow = rect.top < 150;
        setPopupPosition({
            x: rect.left + (rect.width / 2),
            y: showBelow ? rect.bottom : rect.top,
            position: showBelow ? 'below' : 'above'
        });
    } else {
        console.log('No definition found for:', segment.text);
    }
  }, [dictionary]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 0 && newPage < Math.ceil(fullText.length / CHARS_PER_PAGE)) {
      setSelectedChar(null);
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  }, [fullText.length]);

  useEffect(() => {
    Promise.all([
      fetch(`${process.env.PUBLIC_URL}/data/parsed_childrens3Kingdoms.txt`),
      fetch(`${process.env.PUBLIC_URL}/data/minimal_dictionary.json`)
    ])
      .then(([textResponse, dictResponse]) => Promise.all([
        textResponse.text(),
        dictResponse.json()
      ]))
      .then(([text, dict]) => {
        console.log('Text loaded, length:', text.length);
        console.log('Dictionary loaded, entries:', Object.keys(dict).length);
        setFullText(text);
        setDictionary(dict);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Loading error:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="reader-container">
      <div className="navigation-controls">
        <button 
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 0}
          className="nav-button"
        >
          ←
        </button>
        <span className="page-info">{currentPage + 1} / {Math.ceil(fullText.length / CHARS_PER_PAGE)}</span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= Math.ceil(fullText.length / CHARS_PER_PAGE) - 1}
          className="nav-button"
        >
          →
        </button>
      </div>

      <div className="text-content">
        {processText(getCurrentPageText()).map((segment, index) => (
          <span
            key={index}
            className={`chinese-text ${segment.type}`}
            onClick={(e) => handleClick(e, segment)}
          >
            {segment.text}
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
          <button className="close-button" onClick={() => setSelectedChar(null)}>×</button>
          <div className="char-info">
            <h3 className={selectedChar.type?.startsWith('compound') ? 'compound' : ''}>
                {selectedChar.char}
            </h3>
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