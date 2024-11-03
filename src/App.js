import React, { useState, useEffect } from 'react';
import Reader from './components/Reader';
import './App.css';

function App() {
  const [currentText, setCurrentText] = useState('fully_parsed_chinese');
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('bookmarks');
    return saved ? JSON.parse(saved) : Array(5).fill(0);
  });
  const [position, setPosition] = useState(() => {
    return parseInt(localStorage.getItem('readingPosition')) || 0;
  });

  useEffect(() => {
    localStorage.setItem('readingPosition', position);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [position, bookmarks]);

  return (
    <div className="app">
      <Reader 
        currentText={currentText}
        position={position}
        setPosition={setPosition}
        bookmarks={bookmarks}
        setBookmarks={setBookmarks}
        onSwitch={() => setCurrentText(current => 
          current === 'fully_parsed_chinese' ? 'english' : 'fully_parsed_chinese'
        )}
      />
    </div>
  );
}

export default App;