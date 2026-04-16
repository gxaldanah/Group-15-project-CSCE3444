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

type CharacterOption = {
  id: string;
  name: string;
  desc: string;
  baseStats: Attributes;
};

type StoredProgress = {
  screen: Exclude<Screen, 'menu' | 'charSelect'>;
  selectedCharacterId: string;
  pointsLeft: number;
  stats: Attributes;
  chapterSceneId: ChapterSceneId;
  choiceStyleProfile: ChoiceStyleProfile;
};

const localProgressKey = 'forge-destiny-progress-v1';

function loadLocalProgress(): StoredProgress | null {
  try {
    const raw = window.localStorage.getItem(localProgressKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.selectedCharacterId || typeof parsed.selectedCharacterId !== 'string') return null;
    if (!parsed.screen || !isGameScreen(parsed.screen)) return null;
    if (typeof parsed.pointsLeft !== 'number') return null;
    if (!parsed.stats || typeof parsed.stats !== 'object') return null;
    if (!parsed.chapterSceneId || typeof parsed.chapterSceneId !== 'string') return null;

    return {
      screen: parsed.screen,
      selectedCharacterId: parsed.selectedCharacterId,
      pointsLeft: parsed.pointsLeft,
      stats: parsed.stats as Attributes,
      chapterSceneId: parsed.chapterSceneId,
      choiceStyleProfile: parsed.choiceStyleProfile ?? defaultChoiceStyleProfile,
    };
  } catch {
    return null;
  }
}

function saveLocalProgress(progress: StoredProgress) {
  window.localStorage.setItem(localProgressKey, JSON.stringify(progress));
}

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [pointsLeft, setPointsLeft] = useState(defaultPoints);
  const [stats, setStats] = useState<Attributes>(defaultAttributes);
  const [runBaselinePoints, setRunBaselinePoints] = useState(defaultPoints);
  const [runBaselineStats, setRunBaselineStats] = useState<Attributes>(defaultAttributes);
  const [chapterSceneId, setChapterSceneId] = useState<ChapterSceneId>(defaultChapterSceneId);
  const [choiceStyleProfile, setChoiceStyleProfile] = useState<ChoiceStyleProfile>(defaultChoiceStyleProfile);
  const [savedProgressAvailable, setSavedProgressAvailable] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [manualSaveInProgress, setManualSaveInProgress] = useState(false);
  const savedProgressRef = useRef<StoredProgress | null>(null);
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
      const localProgress = loadLocalProgress();
      savedProgressRef.current = localProgress;
      setSavedProgressAvailable(Boolean(localProgress));
      setProgressStatus(localProgress ? 'Local progress ready.' : 'No saved progress found.');
      if (localProgress) {
        setChapterSceneId(localProgress.chapterSceneId);
        setChoiceStyleProfile(localProgress.choiceStyleProfile);
      } else {
        setChapterSceneId(defaultChapterSceneId);
        setChoiceStyleProfile(defaultChoiceStyleProfile);
      }
      progressHydratedRef.current = true;
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
    if (!selectedCharacterId || !progressHydratedRef.current) {
      return;
    }

    if (!isGameScreen(screen)) {
      return;
    }

    const currentScreen = screen;
    const progressPayload: StoredProgress = {
      screen: currentScreen,
      selectedCharacterId,
      pointsLeft,
      stats,
      chapterSceneId,
      choiceStyleProfile,
    };

    const timeoutId = window.setTimeout(() => {
      if (firebaseDb && user) {
        void saveGameProgress(firebaseDb, user.uid, progressPayload)
          .then(() => {
            savedProgressRef.current = progressPayload;
            setSavedProgressAvailable(true);
            setProgressStatus('Progress saved.');
            setProgressError(null);
          })
          .catch(() => {
            saveLocalProgress(progressPayload);
            savedProgressRef.current = progressPayload;
            setSavedProgressAvailable(true);
            setProgressStatus('Saved locally (offline mode).');
          });
        return;
      }

      saveLocalProgress(progressPayload);
      savedProgressRef.current = progressPayload;
      setSavedProgressAvailable(true);
      setProgressStatus('Saved locally (offline mode).');
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [chapterSceneId, choiceStyleProfile, pointsLeft, screen, selectedCharacterId, stats, user]);

  const handleManualSave = async (): Promise<boolean> => {
    if (!selectedCharacterId || !isGameScreen(screen)) {
      setProgressError('Sign in and start a game before saving.');
      return false;
    }

    setManualSaveInProgress(true);
    setProgressError(null);

    try {
      const progressPayload: StoredProgress = {
        screen,
        selectedCharacterId,
        pointsLeft,
        stats,
        chapterSceneId,
        choiceStyleProfile,
      };

      if (firebaseDb && user) {
        await saveGameProgress(firebaseDb, user.uid, progressPayload);
        setProgressStatus('Game saved. You can safely resume later.');
      } else {
        saveLocalProgress(progressPayload);
        setProgressStatus('Game saved locally.');
      }

      savedProgressRef.current = progressPayload;
      setSavedProgressAvailable(true);
      return true;
    } catch (error) {
      const progressPayload: StoredProgress = {
        screen,
        selectedCharacterId,
        pointsLeft,
        stats,
        chapterSceneId,
        choiceStyleProfile,
      };
      saveLocalProgress(progressPayload);
      savedProgressRef.current = progressPayload;
      setSavedProgressAvailable(true);
      setProgressStatus('Saved locally after cloud save failed.');
      setProgressError(error instanceof Error ? error.message : 'Cloud save failed, local save succeeded.');
      return true;
    } finally {
      setManualSaveInProgress(false);
    }
  };

  const handleSaveAndReturnHome = async () => {
    const saved = await handleManualSave();
    if (saved) {
      setScreen('menu');
    }
  };

  const handleGuestSignIn = async () => {
    if (!firebaseAuth) {
      setAuthError('Cloud guest sign-in unavailable. You can still play and save locally.');
      setProgressStatus('Offline guest mode enabled.');
      return;
    }

    setAuthError(null);

    try {
      await signInAnonymously(firebaseAuth);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign-in failed.';
      if (message.includes('auth/configuration-not-found')) {
        setAuthError('Guest auth is disabled in Firebase. You can still play and save locally.');
        setProgressStatus('Offline guest mode enabled.');
      } else {
        setAuthError(message);
      }
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
    const selectedCharacter = characters.find((character) => character.id === characterId);

    if (!selectedCharacter) {
      return;
    }

    setSelectedCharacterId(characterId);
    setPointsLeft(0);
    setStats(selectedCharacter.baseStats);
    setRunBaselinePoints(0);
    setRunBaselineStats(selectedCharacter.baseStats);
    setChapterSceneId(defaultChapterSceneId);
    setChoiceStyleProfile(defaultChoiceStyleProfile);
    setScreen('nextScreen');
  };

  const handleResumeGame = () => {
    const progress = savedProgressRef.current;

    if (!progress) {
      return;
    }

    setSelectedCharacterId(progress.selectedCharacterId);
    setPointsLeft(progress.pointsLeft);
    setStats(progress.stats);
    setRunBaselinePoints(progress.pointsLeft);
    setRunBaselineStats(progress.stats);
    setChapterSceneId(progress.chapterSceneId);
    setChoiceStyleProfile(progress.choiceStyleProfile);
    setScreen(progress.screen);
  };

  const handleNewGame = () => {
    setSelectedCharacterId(null);
    setPointsLeft(defaultPoints);
    setStats(defaultAttributes);
    setRunBaselinePoints(defaultPoints);
    setRunBaselineStats(defaultAttributes);
    setChapterSceneId(defaultChapterSceneId);
    setChoiceStyleProfile(defaultChoiceStyleProfile);
    setScreen('charSelect');
  };

  // Character Data from Sprint 1 Report [cite: 76-95]
  const characters: CharacterOption[] = [
    {
      id: 'warrior',
      name: 'The Warrior',
      desc: 'A brave fighter who leads with strength and courage.',
      baseStats: { strength: 11, intelligence: 5, charisma: 4, agility: 6, luck: 4 },
    },
    {
      id: 'diplomat',
      name: 'The Diplomat',
      desc: 'A wise negotiator who builds bridges through trust.',
      baseStats: { strength: 4, intelligence: 7, charisma: 11, agility: 3, luck: 5 },
    },
    {
      id: 'guardian',
      name: 'The Guardian',
      desc: 'A balanced protector with steady abilities.',
      baseStats: { strength: 7, intelligence: 6, charisma: 6, agility: 6, luck: 5 },
    },
    {
      id: 'mystic',
      name: 'The Mystic',
      desc: 'A seeker of ancient wisdom and hidden power.',
      baseStats: { strength: 3, intelligence: 12, charisma: 5, agility: 3, luck: 7 },
    },
    {
      id: 'rogue',
      name: 'The Rogue',
      desc: 'A quick and clever adventurer who relies on agility.',
      baseStats: { strength: 5, intelligence: 5, charisma: 5, agility: 11, luck: 4 },
    },
    {
      id: 'scholar',
      name: 'The Scholar',
      desc: 'A brilliant researcher with sharp insight.',
      baseStats: { strength: 2, intelligence: 13, charisma: 6, agility: 3, luck: 6 },
    },
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
                <p style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                  STR {char.baseStats.strength} | INT {char.baseStats.intelligence} | CHA {char.baseStats.charisma} | AGI {char.baseStats.agility} | LUCK {char.baseStats.luck}
                </p>
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
              setRunBaselinePoints(nextPoints);
              setRunBaselineStats(nextStats);
              setChapterSceneId(defaultChapterSceneId);
              setChoiceStyleProfile(defaultChoiceStyleProfile);
              setScreen('nextScreen');
            }}
          />

          <div className="button-group" style={{ marginTop: '1rem' }}>
            <button
              className="menu-button load-button"
              onClick={() => void handleSaveAndReturnHome()}
                disabled={manualSaveInProgress}
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
        onSaveGame={() => void handleSaveAndReturnHome()}
        saveInProgress={manualSaveInProgress}
          canSave={true}
        initialSceneId={chapterSceneId}
        onSceneChange={setChapterSceneId}
        onReturnToMenu={() => setScreen('menu')}
        onTryAnotherPath={() => {
          setPointsLeft(runBaselinePoints);
          setStats(runBaselineStats);
          setChoiceStyleProfile(defaultChoiceStyleProfile);
          setChapterSceneId(defaultChapterSceneId);
        }}
        onReallocate={() => setScreen('charSelect')}
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