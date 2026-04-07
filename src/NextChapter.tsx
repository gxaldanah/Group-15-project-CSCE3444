import { useEffect, useMemo, useState } from 'react';
import type { Attributes, ChapterSceneId } from './gameProgress.ts';

type NextChapterProps = {
  characterId: string;
  characterName: string;
  pointsLeft: number;
  stats: Attributes;
  initialSceneId?: ChapterSceneId;
  onSceneChange: (sceneId: ChapterSceneId) => void;
  onReturnToMenu: () => void;
  onReallocate: () => void;
};

type Scene = {
  id: ChapterSceneId;
  title: string;
  body: string;
  choices?: Array<{ label: string; nextSceneId: ChapterSceneId }>;
};

function getDominantAttribute(stats: Attributes): keyof Attributes {
  const entries = Object.entries(stats) as Array<[keyof Attributes, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export default function NextChapter({
  characterId,
  characterName,
  pointsLeft,
  stats,
  initialSceneId = 'arrival',
  onSceneChange,
  onReturnToMenu,
  onReallocate,
}: NextChapterProps) {
  const [sceneId, setSceneId] = useState<ChapterSceneId>(initialSceneId);

  useEffect(() => {
    setSceneId(initialSceneId);
  }, [initialSceneId]);

  useEffect(() => {
    onSceneChange(sceneId);
  }, [onSceneChange, sceneId]);

  const dominantAttribute = useMemo(() => getDominantAttribute(stats), [stats]);

  const characterStory: Record<string, {
    arrivalIntro: string;
    villageNowTitle: string;
    villageNowBody: string;
    observeTitle: string;
    observeBody: string;
    villageNowChoice: string;
    observeChoice: string;
  }> = {
    warrior: {
      arrivalIntro: 'Your hand stays close to your blade as branches scrape your armor. Hunger and doubt creep in, but then you spot smoke curling above rooftops in the distance.',
      villageNowTitle: 'The Warrior Enters the Gate',
      villageNowBody: 'You march straight to the village gate. The guards tense at first, then step aside when they see your fearless stance. A blacksmith asks for help driving raiders from the road.',
      observeTitle: 'The Warrior Scouts First',
      observeBody: 'You crouch behind thick pines and study patrol patterns. You spot a hidden side gate and a weak point in the palisade, giving you a tactical advantage before first contact.',
      villageNowChoice: 'Go to the village immediately, hand on your sword',
      observeChoice: 'Get closer and observe patrol routes from cover',
    },
    diplomat: {
      arrivalIntro: 'You rehearse calming words in your head while weaving through the silent forest. Just as hope fades, a village appears ahead with lanterns flickering at the gate.',
      villageNowTitle: 'The Diplomat Makes Contact',
      villageNowBody: 'You approach openly and greet the villagers with measured confidence. A tense crowd gathers, but your voice settles them. The elder invites you to mediate a brewing dispute.',
      observeTitle: 'The Diplomat Reads the Room',
      observeBody: 'From a nearby ridge, you watch body language and routines. You notice who gives orders and who is ignored, learning exactly who to approach first for trust.',
      villageNowChoice: 'Go to the village immediately and introduce yourself',
      observeChoice: 'Get closer and observe social dynamics before speaking',
    },
    guardian: {
      arrivalIntro: 'You move carefully through the woods, protecting your remaining supplies as daylight fades. Then you spot a village and realize shelter may finally be within reach.',
      villageNowTitle: 'The Guardian Seeks Shelter',
      villageNowBody: 'You step forward and request safe passage with calm authority. The villagers sense reliability in your posture and ask you to help fortify their outer wall before nightfall.',
      observeTitle: 'The Guardian Assesses Risks',
      observeBody: 'You circle closer and inspect watch posts, exits, and blind spots. The village has weaknesses, but you also identify safe routes to protect others if danger erupts.',
      villageNowChoice: 'Go to the village immediately and request shelter',
      observeChoice: 'Get closer and observe defenses before entering',
    },
    mystic: {
      arrivalIntro: 'The forest hums with strange energy as you follow instinct rather than trail. Through the fog, a village appears, its rooftops shimmering with faint, unnatural light.',
      villageNowTitle: 'The Mystic Walks into Omen',
      villageNowBody: 'You enter without hesitation. Villagers whisper about visions and curses as you pass. A shrine keeper recognizes your aura and begs for help interpreting a warning.',
      observeTitle: 'The Mystic Reads the Veil',
      observeBody: 'You draw nearer in silence and sense layered enchantments around the village perimeter. Hidden wards and broken sigils reveal that something ancient is protecting, or trapping, this place.',
      villageNowChoice: 'Go to the village immediately and follow the strange energy',
      observeChoice: 'Get closer and observe magical signs before entering',
    },
    rogue: {
      arrivalIntro: 'You slip between shadows and broken roots, certain this forest might swallow you whole. Then you catch sight of a village, along with unguarded carts near the edge.',
      villageNowTitle: 'The Rogue Blends In',
      villageNowBody: 'You stroll in like you belong there and quickly gather rumors from distracted merchants. A smuggler offers a risky shortcut to coin if you can stay unseen.',
      observeTitle: 'The Rogue Watches from the Brush',
      observeBody: 'You creep close and mark guard rotations, loose shutters, and dark alleys. In minutes, you map every quiet entry and decide exactly where to strike or sneak.',
      villageNowChoice: 'Go to the village immediately and blend into the crowd',
      observeChoice: 'Get closer and observe guard patterns from stealth',
    },
    scholar: {
      arrivalIntro: 'You keep notes even while lost, recording landmarks in fading light. At last, you see a village ahead, and with it the possibility of maps, archives, and answers.',
      villageNowTitle: 'The Scholar Seeks Knowledge',
      villageNowBody: 'You approach directly and ask for records of the surrounding region. A librarian welcomes you but warns that several pages are missing from their oldest chronicle.',
      observeTitle: 'The Scholar Gathers Evidence',
      observeBody: 'You move closer and study architecture, symbols, and supply paths from afar. Before entering, you already infer the village age, trade habits, and likely power structure.',
      villageNowChoice: 'Go to the village immediately and ask for guidance',
      observeChoice: 'Get closer and observe clues before speaking',
    },
  };

  const fallbackStory = {
    arrivalIntro: 'After hours lost in the woods, you think you may never find a way out. In the distance, you finally spot a village.',
    villageNowTitle: 'A Bold Arrival',
    villageNowBody: `You head straight to the village and are met with wary stares. Your ${dominantAttribute} helps you hold your ground as the first conversation begins.`,
    observeTitle: 'A Careful Approach',
    observeBody: `You move closer and observe from a hidden vantage point. Your ${dominantAttribute} helps you notice details that most travelers would miss.`,
    villageNowChoice: 'Go to the village immediately',
    observeChoice: 'Get closer and observe',
  };

  const activeStory = characterStory[characterId] ?? fallbackStory;

  const scenes: Record<ChapterSceneId, Scene> = {
    arrival: {
      id: 'arrival',
      title: 'Chapter 1: Lost in the Woods',
      body: `${characterName} walks deeper into the woods, convinced they may be lost forever. ${activeStory.arrivalIntro}`,
      choices: [
        { label: activeStory.villageNowChoice, nextSceneId: 'villageNow' },
        { label: activeStory.observeChoice, nextSceneId: 'observe' },
      ],
    },
    villageNow: {
      id: 'villageNow',
      title: activeStory.villageNowTitle,
      body: `${activeStory.villageNowBody} Your highest attribute, ${dominantAttribute}, shapes how this encounter unfolds.`,
    },
    observe: {
      id: 'observe',
      title: activeStory.observeTitle,
      body: `${activeStory.observeBody} Your highest attribute, ${dominantAttribute}, gives you an edge before the village ever notices you.`,
    },
  };

  const currentScene = scenes[sceneId];

  return (
    <div className="main-menu-container">
      <div className="selection-overlay">
        <h1 className="game-title">{currentScene.title}</h1>

        <p className="game-subtitle" style={{ marginBottom: '0.75rem' }}>
          {currentScene.body}
        </p>

        <p className="game-subtitle" style={{ fontSize: '0.95rem', opacity: 0.85 }}>
          Points remaining: {pointsLeft}
        </p>

        <div className="character-grid" style={{ marginTop: '1rem' }}>
          <article className="char-card">
            <h3>Final Attributes</h3>
            <p>Strength: {stats.strength}</p>
            <p>Intelligence: {stats.intelligence}</p>
            <p>Charisma: {stats.charisma}</p>
            <p>Agility: {stats.agility}</p>
            <p>Luck: {stats.luck}</p>
          </article>
        </div>

        {currentScene.choices ? (
          <div className="button-group" style={{ marginTop: '1rem' }}>
            {currentScene.choices.map((choice) => (
              <button
                key={choice.label}
                className="menu-button start-button"
                onClick={() => setSceneId(choice.nextSceneId)}
              >
                {choice.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="button-group" style={{ marginTop: '1rem' }}>
            <button className="menu-button load-button" onClick={() => setSceneId('arrival')}>
              Try Another Path
            </button>
            <button className="menu-button start-button" onClick={onReturnToMenu}>
              Return to Menu
            </button>
          </div>
        )}

        <button className="back-link" onClick={onReallocate} style={{ marginTop: '1rem' }}>
          Back to Attribute Allocation
        </button>
      </div>
    </div>
  );
}
