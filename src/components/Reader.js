import React, { useState, useEffect, useRef } from 'react';
import PopupMenu from './PopupMenu';
import dictionary from '../data/dictionary.json';

function Reader({ currentText, position, setPosition, bookmarks, setBookmarks, onSwitch }) {
  const [text, setText] = useState('');
  const [pageSize, setPageSize] = useState(1000);
  const containerRef = useRef(null);

  const COMPOUND_MARKERS = {
    '《': { close: '》', length: 4, className: 'compound-four' },
    '【': { close: '】', length: 3, className: 'compound-three' },
    '『': { close: '』', length: 2, className: 'compound-two' }
  };

  useEffect(() => {
    fetch(`/data/${currentText}.txt`)
      .then(res => res.text())
      .then(content => {
        // For English text, ensure proper spacing and formatting
        if (currentText === 'english') {
          // Replace multiple newlines with a standard paragraph break
          const formattedContent = content
            .replace(/\n\s*\n/g, '\n\n')  // Standardize paragraph breaks
            .replace(/\s+/g, ' ')          // Standardize spacing
            .trim();                       // Remove extra whitespace
          setText(formattedContent);
        } else {
          setText(content);
        }
      });
  }, [currentText]);

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
            className={token.className}
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {token.text}
          </span>
        ))}
      </div>

      <div className="position-info">
        Position: {position} / {tokens.length}
      </div>
    </div>
  );
}

export default Reader; 