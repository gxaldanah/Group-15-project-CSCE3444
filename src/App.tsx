import { useEffect, useRef, useState } from 'react';
import './App.css';
import PointAllocation from './PointAllocation';
import NextChapter from './NextChapter';
import { firebaseAuth, firebaseDb, hasFirebaseConfig } from './firebase.ts';
import { type User, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import {
  loadGameProgress,
  saveGameProgress,
  type Attributes,
  type ChapterSceneId,
  type ChoiceStyleProfile,
  defaultAttributes,
  defaultChapterSceneId,
  defaultChoiceStyleProfile,
  defaultPoints,
  isGameScreen,
} from './gameProgress.ts';

type Screen = 'menu' | 'charSelect' | 'points' | 'nextScreen';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [pointsLeft, setPointsLeft] = useState(defaultPoints);
  const [stats, setStats] = useState<Attributes>(defaultAttributes);
  const [chapterSceneId, setChapterSceneId] = useState<ChapterSceneId>(defaultChapterSceneId);
  const [choiceStyleProfile, setChoiceStyleProfile] = useState<ChoiceStyleProfile>(defaultChoiceStyleProfile);
  const [savedProgressAvailable, setSavedProgressAvailable] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [manualSaveInProgress, setManualSaveInProgress] = useState(false);
  const savedProgressRef = useRef<null | {
    screen: Exclude<Screen, 'menu' | 'charSelect'>;
    selectedCharacterId: string;
    pointsLeft: number;
    stats: Attributes;
    chapterSceneId: ChapterSceneId;
    choiceStyleProfile: ChoiceStyleProfile;
  }>(null);
  const progressHydratedRef = useRef(false);

  useEffect(() => {
    if (!firebaseAuth) return;

    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseDb || !user) {
      savedProgressRef.current = null;
      progressHydratedRef.current = false;
      setSavedProgressAvailable(false);
      setChapterSceneId(defaultChapterSceneId);
      setChoiceStyleProfile(defaultChoiceStyleProfile);
      return;
    }

    let cancelled = false;
    setProgressStatus('Loading saved progress...');
    setProgressError(null);

    loadGameProgress(firebaseDb, user.uid)
      .then((progress) => {
        if (cancelled) return;

        if (progress) {
          savedProgressRef.current = progress;
          setChapterSceneId(progress.chapterSceneId);
          setChoiceStyleProfile(progress.choiceStyleProfile);
          setSavedProgressAvailable(true);
          setProgressStatus('Saved progress ready.');
        } else {
          savedProgressRef.current = null;
          setSavedProgressAvailable(false);
          setProgressStatus('No saved progress found.');
        }

        progressHydratedRef.current = true;
      })
      .catch((error) => {
        if (cancelled) return;
        setProgressError(error instanceof Error ? error.message : 'Failed to load progress.');
        setProgressStatus(null);
        progressHydratedRef.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const db = firebaseDb;

    if (!db || !user || !selectedCharacterId || !progressHydratedRef.current) {
      return;
    }

    if (!isGameScreen(screen)) {
      return;
    }

    const currentScreen = screen;

    const timeoutId = window.setTimeout(() => {
      void saveGameProgress(db, user.uid, {
        screen: currentScreen,
        selectedCharacterId,
        pointsLeft,
        stats,
        chapterSceneId,
        choiceStyleProfile,
      })
        .then(() => {
          savedProgressRef.current = {
            screen: currentScreen,
            selectedCharacterId,
            pointsLeft,
            stats,
            chapterSceneId,
            choiceStyleProfile,
          };
          setSavedProgressAvailable(true);
          setProgressStatus('Progress saved.');
          setProgressError(null);
        })
        .catch((error) => {
          setProgressError(error instanceof Error ? error.message : 'Failed to save progress.');
        });
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [chapterSceneId, choiceStyleProfile, pointsLeft, screen, selectedCharacterId, stats, user]);

  const handleManualSave = async () => {
    const db = firebaseDb;

    if (!db || !user || !selectedCharacterId || !isGameScreen(screen)) {
      setProgressError('Sign in and start a game before saving.');
      return;
    }

    setManualSaveInProgress(true);
    setProgressError(null);

    try {
      await saveGameProgress(db, user.uid, {
        screen,
        selectedCharacterId,
        pointsLeft,
        stats,
        chapterSceneId,
        choiceStyleProfile,
      });

      savedProgressRef.current = {
        screen,
        selectedCharacterId,
        pointsLeft,
        stats,
        chapterSceneId,
        choiceStyleProfile,
      };
      setSavedProgressAvailable(true);
      setProgressStatus('Game saved. You can safely resume later.');
    } catch (error) {
      setProgressError(error instanceof Error ? error.message : 'Failed to save progress.');
    } finally {
      setManualSaveInProgress(false);
    }
  };

  const handleGuestSignIn = async () => {
    if (!firebaseAuth || !hasFirebaseConfig) {
      setAuthError('Firebase is not configured. Add VITE_FIREBASE_* values in .env.local.');
      return;
    }

    setAuthError(null);

    try {
      await signInAnonymously(firebaseAuth);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign-in failed.');
    }
  };

  const handleSignOut = async () => {
    if (!firebaseAuth) return;

    setAuthError(null);

    try {
      await signOut(firebaseAuth);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Sign-out failed.');
    }
  };

  const handleSelectCharacter = (characterId: string) => {
    setSelectedCharacterId(characterId);
    setPointsLeft(defaultPoints);
    setStats(defaultAttributes);
    setChapterSceneId(defaultChapterSceneId);
    setChoiceStyleProfile(defaultChoiceStyleProfile);
    setScreen('points');
  };

  const handleResumeGame = () => {
    const progress = savedProgressRef.current;

    if (!progress) {
      return;
    }

    setSelectedCharacterId(progress.selectedCharacterId);
    setPointsLeft(progress.pointsLeft);
    setStats(progress.stats);
    setChapterSceneId(progress.chapterSceneId);
    setChoiceStyleProfile(progress.choiceStyleProfile);
    setScreen(progress.screen);
  };

  const handleNewGame = () => {
    setSelectedCharacterId(null);
    setPointsLeft(defaultPoints);
    setStats(defaultAttributes);
    setChapterSceneId(defaultChapterSceneId);
    setChoiceStyleProfile(defaultChoiceStyleProfile);
    setScreen('charSelect');
  };

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
        <div className="selection-overlay" aria-labelledby="character-select-title">
          <h1 className="game-title">Choose Your Character</h1>
          <p className="game-subtitle">Each character has unique strengths that will shape your journey.</p>

          <div className="character-grid">
            {characters.map((char) => (
              <article key={char.id} className="char-card">
                <h3>{char.name}</h3>
                <p>{char.desc}</p>
                <button className="select-btn" onClick={() => handleSelectCharacter(char.id)}>
                  Choose {char.name.split(' ')[1]}
                </button>
              </article>
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
          <p className="game-subtitle">
            Distribute your points to shape your abilities.
          </p>

          <PointAllocation
            initialPoints={pointsLeft}
            initialStats={stats}
            onBack={() => setScreen('charSelect')}
            onChange={(nextPoints, nextStats) => {
              setPointsLeft(nextPoints);
              setStats(nextStats);
            }}
            onContinue={(nextPoints, nextStats) => {
              setPointsLeft(nextPoints);
              setStats(nextStats);
              setChapterSceneId(defaultChapterSceneId);
              setScreen('nextScreen');
            }}
          />

          <div className="button-group" style={{ marginTop: '1rem' }}>
            <button
              className="menu-button load-button"
              onClick={() => void handleManualSave()}
              disabled={manualSaveInProgress || !user || !hasFirebaseConfig}
            >
              {manualSaveInProgress ? 'Saving...' : 'Save Game'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'nextScreen') {
    const selectedCharacter = characters.find((character) => character.id === selectedCharacterId);

    if (!selectedCharacter) {
      return (
        <div className="main-menu-container">
          <div className="selection-overlay">
            <h1 className="game-title">Continue Your Journey</h1>
            <p className="game-subtitle">Select a character to begin this chapter.</p>
            <div className="button-group">
              <button className="menu-button start-button" onClick={() => setScreen('charSelect')}>
                Choose Character
              </button>
              <button className="menu-button load-button" onClick={() => setScreen('menu')}>
                Return to Menu
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <NextChapter
        characterId={selectedCharacter.id}
        characterName={selectedCharacter.name}
        pointsLeft={pointsLeft}
        stats={stats}
        onStatsChange={setStats}
        choiceStyleProfile={choiceStyleProfile}
        onChoiceStyleProfileChange={setChoiceStyleProfile}
        onSaveGame={() => void handleManualSave()}
        saveInProgress={manualSaveInProgress}
        canSave={Boolean(user && hasFirebaseConfig)}
        initialSceneId={chapterSceneId}
        onSceneChange={setChapterSceneId}
        onReturnToMenu={() => setScreen('menu')}
        onReallocate={() => setScreen('points')}
      />
    );
  }

  return (
    <main className="main-menu-container">
      <section className="menu-card">
        <h1 className="game-title">Forge Your Destiny</h1>
        <br />
        <p className="game-subtitle">Shape your story through your choices.</p>
        {hasFirebaseConfig ? (
          <p className="game-subtitle" style={{ fontSize: '0.95rem', opacity: 0.85 }}>
            {user ? `Signed in as ${user.isAnonymous ? 'Guest' : user.uid}` : 'Not signed in'}
          </p>
        ) : null}
        {progressStatus ? (
          <p className="game-subtitle" style={{ fontSize: '0.9rem', opacity: 0.85 }}>
            {progressStatus}
          </p>
        ) : null}
        {progressError ? (
          <p className="game-subtitle" style={{ fontSize: '0.9rem', color: '#ffb8b8' }}>
            {progressError}
          </p>
        ) : null}
        {authError ? (
          <p className="game-subtitle" style={{ fontSize: '0.9rem', color: '#ffb8b8' }}>
            {authError}
          </p>
        ) : null}
        <div className="button-group">
          {user ? (
            <button className="menu-button load-button" onClick={handleSignOut}>
              Sign Out
            </button>
          ) : (
            <button className="menu-button load-button" onClick={handleGuestSignIn}>
              Play as Guest
            </button>
          )}
          <button className="menu-button start-button" onClick={handleNewGame}>
            Start New Game
          </button>
          <button className="menu-button load-button" onClick={handleResumeGame} disabled={!savedProgressAvailable}>
            Resume Game
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;