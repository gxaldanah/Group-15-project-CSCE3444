import React from 'react';
import './MainMenu.css';

interface MainMenuProps {
  onStartNewGame: () => void;
  onLoadGame: () => void;
  hasSavedGame: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartNewGame, onLoadGame, hasSavedGame }) => {
  return (
    <div className="main-menu-container">
      <div className="menu-card">
        <h1 className="game-title">Forge Your Destiny</h1>
        <p className="game-subtitle">Shape your story through your choices.</p>
        
        <div className="button-group">
          {/* Main button for UC-01: Start New Game */}
          <button 
            className="menu-button start-button" 
            onClick={onStartNewGame}
          >
            Start New Game
          </button>
          
          {/* Support for UC-05: Load Saved Game */}
          <button 
            className="menu-button load-button" 
            onClick={onLoadGame}
            disabled={!hasSavedGame}
          >
            {hasSavedGame ? 'Continue Adventure' : 'No Saved Games'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu; 