import React, { useState } from 'react';
import './App.css';
import PointAllocation from "./PointAllocation";

function App() {
  const [screen, setScreen] = useState('menu');

  // Character Data from Sprint 1 Report [cite: 76-95]
  const characters = [
    { id: 'warrior', name: 'The Warrior', desc: 'A brave fighter who leads with strength and courage.' },
    { id: 'diplomat', name: 'The Diplomat', desc: 'A wise negotiator who builds bridges through trust.' },
    { id: 'guardian', name: 'The Guardian', desc: 'A balanced protector with steady abilities.' },
    { id: 'mystic', name: 'The Mystic', desc: 'A seeker of ancient wisdom and hidden power.' },
    { id: 'rogue', name: 'The Rogue', desc: 'A quick and clever adventurer who relies on agility.' },
    { id: 'scholar', name: 'The Scholar', desc: 'A brilliant researcher with sharp insight.' }
  ];

  if (screen === 'charSelect') {
    return (
      <div className="main-menu-container">
        <div className="selection-overlay">
          <h1 className="game-title">Choose Your Character</h1>
          <p className="game-subtitle">Each character has unique strengths that will shape your journey.</p>
          
          <div className="character-grid">
            {characters.map((char) => (
              <div key={char.id} className="char-card">
                <h3>{char.name}</h3>
                <p>{char.desc}</p>
                <button className="select-btn" onClick={() => {
                  alert(`Selected ${char.name}`);
                  setScreen('points');
                }}
                  >
                  Choose {char.name.split(' ')[1]}
                </button>
              </div>
            ))}
          </div>

          <button className="back-link" onClick={() => setScreen('menu')}>Back to Menu</button>
        </div>
      </div>
    );
  }
if (screen === 'points') {
  return (
    <div className="main-menu-container">
      <div className="selection-overlay">
        <h1 className="game-title">Allocate Your Points</h1>

        <PointAllocation />

        <button className="back-link" onClick={() => setScreen('charSelect')}>
          Back to Character Select
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="main-menu-container">
      <div className="menu-card">
        <h1 className="game-title">Forge Your Destiny</h1>
        <br />
        <p className="game-subtitle">Shape your story through your choices.</p>
        <div className="button-group">
          <button className="menu-button start-button" onClick={() => setScreen('charSelect')}>
            Start New Game
          </button>
          <button className="menu-button load-button" disabled>No Saved Games</button>
        </div>
      </div>
    </div>
  );
}

export default App;