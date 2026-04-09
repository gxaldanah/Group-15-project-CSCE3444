import { doc, getDoc, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';

export type GameScreen = 'points' | 'nextScreen';
export type ChapterSceneId = string;

export type Attributes = {
  strength: number;
  intelligence: number;
  charisma: number;
  agility: number;
  luck: number;
};

export type ChoiceStyleProfile = {
  bold: number;
  careful: number;
};

export type GameProgress = {
  screen: GameScreen;
  selectedCharacterId: string;
  pointsLeft: number;
  stats: Attributes;
  chapterSceneId: ChapterSceneId;
  choiceStyleProfile: ChoiceStyleProfile;
};

export const defaultAttributes: Attributes = {
  strength: 0,
  intelligence: 0,
  charisma: 0,
  agility: 0,
  luck: 0,
};

export const defaultPoints = 20;
export const defaultChapterSceneId: ChapterSceneId = 'chapter1_start';
export const defaultChoiceStyleProfile: ChoiceStyleProfile = {
  bold: 0,
  careful: 0,
};

export function isGameScreen(value: string): value is GameScreen {
  return value === 'points' || value === 'nextScreen';
}

export function isChapterSceneId(value: string): value is ChapterSceneId {
  return value.trim().length > 0;
}

function normalizeChapterSceneId(value: string): ChapterSceneId {
  if (value === 'arrival' || value === 'villageNow' || value === 'observe') {
    return 'chapter1_start';
  }

  return value;
}

export async function loadGameProgress(db: Firestore, userId: string): Promise<GameProgress | null> {
  const snapshot = await getDoc(doc(db, 'gameProgress', userId));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Partial<GameProgress>;

  if (
    typeof data.screen !== 'string' ||
    !isGameScreen(data.screen) ||
    typeof data.selectedCharacterId !== 'string' ||
    typeof data.pointsLeft !== 'number' ||
    !data.stats ||
    typeof data.stats !== 'object'
  ) {
    return null;
  }

  const stats = data.stats as Attributes;
  const profile = (data.choiceStyleProfile ?? {}) as Partial<ChoiceStyleProfile>;
  const chapterSceneId =
    typeof data.chapterSceneId === 'string' && isChapterSceneId(data.chapterSceneId)
      ? normalizeChapterSceneId(data.chapterSceneId)
      : defaultChapterSceneId;

  return {
    screen: data.screen,
    selectedCharacterId: data.selectedCharacterId,
    pointsLeft: data.pointsLeft,
    chapterSceneId,
    choiceStyleProfile: {
      bold: Number(profile.bold) || 0,
      careful: Number(profile.careful) || 0,
    },
    stats: {
      strength: Number(stats.strength) || 0,
      intelligence: Number(stats.intelligence) || 0,
      charisma: Number(stats.charisma) || 0,
      agility: Number(stats.agility) || 0,
      luck: Number(stats.luck) || 0,
    },
  };
}

export async function saveGameProgress(
  db: Firestore,
  userId: string,
  progress: GameProgress,
): Promise<void> {
  await setDoc(
    doc(db, 'gameProgress', userId),
    {
      screen: progress.screen,
      selectedCharacterId: progress.selectedCharacterId,
      pointsLeft: progress.pointsLeft,
      chapterSceneId: progress.chapterSceneId,
      choiceStyleProfile: progress.choiceStyleProfile,
      stats: progress.stats,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
