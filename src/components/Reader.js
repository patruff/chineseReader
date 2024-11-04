import React, { useState, useEffect, useRef } from 'react';
import dictionary from '../data/reduced_dictionary.json';

function Reader({ currentText, position, setPosition, bookmarks, setBookmarks, onSwitch }) {
  const [text, setText] = useState('');
  const [textVersion, setTextVersion] = useState('traditional');
  const [pageSize] = useState(1000);
  const [selectedWord, setSelectedWord] = useState(null);
  const containerRef = useRef(null);

  const COMPOUND_MARKERS = {
    '《': { close: '》', length: 4, className: 'compound-four' },
    '【': { close: '】', length: 3, className: 'compound-three' },
    '『': { close: '』', length: 2, className: 'compound-two' }
  };

  useEffect(() => {
    const filename = textVersion === 'traditional' 
      ? 'fully_parsed_chinese.txt' 
      : 'simplified_chinese.txt';
      
    fetch(`${process.env.PUBLIC_URL}/data/${filename}`)
      .then(res => res.text())
      .then(content => setText(content));
  }, [textVersion]);

  // Parse text into tokens (individual characters or compound words)
  const parseText = (text) => {
    // If it's English text, split by spaces and preserve them
    if (currentText === 'english') {
      return text.split(/(\s+)/).map(token => ({
        type: 'individual',
        text: token,
        length: 1,
        className: ''
      }));
    }

    // Original Chinese parsing logic
    const tokens = [];
    let currentCompound = '';
    let currentMarker = null;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      if (COMPOUND_MARKERS[char]) {
        currentMarker = COMPOUND_MARKERS[char];
        continue;
      }
      
      if (currentMarker && char === currentMarker.close) {
        tokens.push({
          type: 'compound',
          text: currentCompound,
          length: currentMarker.length,
          className: currentMarker.className
        });
        currentCompound = '';
        currentMarker = null;
        continue;
      }

      if (currentMarker) {
        currentCompound += char;
      } else if (char.trim()) {
        tokens.push({
          type: 'individual',
          text: char,
          length: 1,
          className: ''
        });
      }
    }

    return tokens;
  };

  // Add this to calculate visible text
  const tokens = parseText(text);
  const currentPage = tokens.slice(position, position + pageSize);

  const handleBookmark = (index) => {
    const newBookmarks = [...bookmarks];
    newBookmarks[index] = position;
    setBookmarks(newBookmarks);
  };

  const goToBookmark = (index) => {
    const bookmarkPosition = bookmarks[index];
    if (bookmarkPosition !== null) {
      setPosition(bookmarkPosition);
    }
  };

  const handleCharacterClick = (char) => {
    const definition = dictionary[char];
    if (definition) {
      setSelectedWord({
        character: char,
        definition: definition
      });
    } else {
      setSelectedWord(null);
    }
  };

  const toggleTextVersion = () => {
    setTextVersion(current => current === 'traditional' ? 'simplified' : 'traditional');
  };

  return (
    <div ref={containerRef} className="reader-container">
      <div className="controls">
        <button onClick={() => setPosition(Math.max(0, position - pageSize))}>
          Previous Page
        </button>
        <button onClick={() => setPosition(Math.min(tokens.length - pageSize, position + pageSize))}>
          Next Page
        </button>
        <button onClick={onSwitch}>
          Switch to {currentText === 'fully_parsed_chinese' ? 'English' : 'Chinese'}
        </button>
        <button onClick={toggleTextVersion}>
          {textVersion === 'traditional' ? 'Switch to Simplified' : 'Switch to Traditional'}
        </button>
      </div>

      <div className="bookmarks">
        {bookmarks.map((bookmark, index) => (
          <div key={index} className="bookmark-controls">
            <button onClick={() => handleBookmark(index)}>
              Set Bookmark {index + 1}
            </button>
            <button 
              onClick={() => goToBookmark(index)}
              disabled={bookmark === 0}
            >
              Go to Bookmark {index + 1}
            </button>
          </div>
        ))}
      </div>

      <div 
        className="text-content"
        data-language={currentText}
      >
        {currentPage.map((token, index) => (
          <span 
            key={position + index}
            className={`${token.className} ${currentText === 'fully_parsed_chinese' ? 'clickable' : ''}`}
            onClick={() => currentText === 'fully_parsed_chinese' && handleCharacterClick(token.text)}
          >
            {token.text}
          </span>
        ))}
      </div>

      {selectedWord && (
        <div className="dictionary-popup">
          <h3>{selectedWord.character}</h3>
          <p>{selectedWord.definition}</p>
          <button onClick={() => setSelectedWord(null)}>Close</button>
        </div>
      )}

      <div className="position-info">
        Position: {position} / {tokens.length}
      </div>
    </div>
  );
}

export default Reader; 