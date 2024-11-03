import React from 'react';

function PopupMenu({ selection, onClose, onSwitchText }) {
  return (
    <div className="popup">
      <div className="popup-content">
        <button onClick={onClose} className="close-btn">×</button>
        <div className="options">
          {selection.type === 'compound' ? (
            <>
              <div className="compound-info">
                <h3>
                  {selection.text}
                  <span className="compound-length">
                    ({selection.length}-character compound)
                  </span>
                </h3>
                <p>{selection.definition}</p>
              </div>
              <div className="individual-characters">
                <h4>Individual Characters:</h4>
                {selection.characters.map((char, index) => (
                  <div key={index} className="char-definition">
                    <strong>{char.char}</strong>: {char.definition}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="single-char-info">
              <h3>{selection.text}</h3>
              <p>{selection.definition}</p>
            </div>
          )}
          <div className="switch-option" onClick={() => {
            onSwitchText();
            onClose();
          }}>
            Switch to English Text
          </div>
        </div>
      </div>
    </div>
  );
}

export default PopupMenu; 