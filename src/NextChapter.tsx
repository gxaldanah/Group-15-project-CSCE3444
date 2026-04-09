import { useEffect, useMemo, useState } from 'react';
import type { Attributes, ChapterSceneId, ChoiceStyleProfile } from './gameProgress.ts';

type NextChapterProps = {
  characterId: string;
  characterName: string;
  pointsLeft: number;
  stats: Attributes;
  onStatsChange: (stats: Attributes) => void;
  choiceStyleProfile: ChoiceStyleProfile;
  onChoiceStyleProfileChange: (profile: ChoiceStyleProfile) => void;
  onSaveGame: () => void;
  saveInProgress: boolean;
  canSave: boolean;
  initialSceneId?: ChapterSceneId;
  onSceneChange: (sceneId: ChapterSceneId) => void;
  onReturnToMenu: () => void;
  onReallocate: () => void;
};

type AttributeDelta = Partial<Record<keyof Attributes, number>>;
type ChoiceStyle = 'bold' | 'careful';

type Scene = {
  id: ChapterSceneId;
  title: string;
  body: string;
  choices?: Array<{
    label: string;
    nextSceneId: ChapterSceneId;
    attributeDelta: AttributeDelta;
    choiceStyle: ChoiceStyle;
  }>;
  isEnding?: boolean;
};

type ChapterTemplate = {
  chapterNumber: number;
  title: string;
  body: string;
  choices: Array<{ label: string; attributeDelta: AttributeDelta; choiceStyle: ChoiceStyle }>;
};

const TOTAL_CHAPTERS = 10;

function chapterSceneId(chapterNumber: number): ChapterSceneId {
  return `chapter${chapterNumber}_start`;
}

function legacyToModernSceneId(sceneId: ChapterSceneId): ChapterSceneId {
  if (sceneId === 'arrival' || sceneId === 'villageNow' || sceneId === 'observe') {
    return chapterSceneId(1);
  }

  return sceneId;
}

const ATTRIBUTE_LABELS: Record<keyof Attributes, string> = {
  strength: 'Strength',
  intelligence: 'Intelligence',
  charisma: 'Charisma',
  agility: 'Agility',
  luck: 'Luck',
};

function applyAttributeDelta(stats: Attributes, delta: AttributeDelta): Attributes {
  return {
    strength: stats.strength + (delta.strength ?? 0),
    intelligence: stats.intelligence + (delta.intelligence ?? 0),
    charisma: stats.charisma + (delta.charisma ?? 0),
    agility: stats.agility + (delta.agility ?? 0),
    luck: stats.luck + (delta.luck ?? 0),
  };
}

function describeAttributeDelta(delta: AttributeDelta): string {
  const parts = (Object.entries(delta) as Array<[keyof Attributes, number]>)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => `${value > 0 ? '+' : ''}${value} ${ATTRIBUTE_LABELS[key]}`);

  return parts.join(', ');
}

type EndingStyle = 'legendaryBold' | 'bold' | 'balanced' | 'careful' | 'legendaryCareful';

function determineEndingStyle(profile: ChoiceStyleProfile): EndingStyle {
  const difference = profile.bold - profile.careful;

  if (profile.bold >= 8) {
    return 'legendaryBold';
  }

  if (profile.careful >= 8) {
    return 'legendaryCareful';
  }

  if (difference >= 2) {
    return 'bold';
  }

  if (difference <= -2) {
    return 'careful';
  }

  return 'balanced';
}

function getCharacterEnding(
  characterId: string,
  characterName: string,
  endingStyle: EndingStyle,
  dominantAttribute: keyof Attributes,
): { title: string; body: string } {
  const endings: Record<string, Record<EndingStyle, { title: string; body: string }>> = {
    warrior: {
      legendaryBold: {
        title: 'Ending: Warbrand of the Valley',
        body: `${characterName} chooses action again and again until entire armies break at your advance. Your campaign ends the crisis in a single unforgettable era.`,
      },
      bold: {
        title: 'Ending: The Iron Vanguard',
        body: `${characterName} wins through fearless action, becoming the blade the valley rallies behind. Songs of your charge echo for generations.`,
      },
      careful: {
        title: 'Ending: The Shielded General',
        body: `${characterName} tempers force with patience, building a disciplined defense that keeps every border secure long after the war.`,
      },
      balanced: {
        title: 'Ending: The Warden of Balance',
        body: `${characterName} blends courage and restraint, forging a legacy where strength protects rather than dominates.`,
      },
      legendaryCareful: {
        title: 'Ending: The Eternal Bastion',
        body: `${characterName} masters preparation and timing so completely that no enemy can ever breach the valley again.`,
      },
    },
    diplomat: {
      legendaryBold: {
        title: 'Ending: Crown of the Unifier',
        body: `${characterName} takes audacious diplomatic gambles and forges an alliance so vast it redraws the region's map overnight.`,
      },
      bold: {
        title: 'Ending: The Flame of Unity',
        body: `${characterName} takes bold political risks and unifies rival powers in a single historic accord.`,
      },
      careful: {
        title: 'Ending: The Silent Architect',
        body: `${characterName} resolves conflict through patient negotiation, creating a durable peace few thought possible.`,
      },
      balanced: {
        title: 'Ending: The Golden Voice',
        body: `${characterName} knows exactly when to press and when to listen, becoming the era's most trusted leader.`,
      },
      legendaryCareful: {
        title: 'Ending: Concord Without End',
        body: `${characterName} weaves layer upon layer of careful treaties until war becomes unthinkable across generations.`,
      },
    },
    guardian: {
      legendaryBold: {
        title: 'Ending: The Rampart King',
        body: `${characterName} meets every threat at the front and becomes the living symbol of unbreakable resistance.`,
      },
      bold: {
        title: 'Ending: Bastion Unbroken',
        body: `${characterName} stands at every critical front, turning desperate battles into impossible holds.`,
      },
      careful: {
        title: 'Ending: Keeper of the Hearth',
        body: `${characterName} prioritizes safe routes and strong communities, ensuring people survive and rebuild quickly.`,
      },
      balanced: {
        title: 'Ending: The Living Wall',
        body: `${characterName} becomes a symbol of protection, feared by enemies and beloved by civilians.`,
      },
      legendaryCareful: {
        title: 'Ending: Guardian of Ages',
        body: `${characterName} designs protections so enduring that children grow old never knowing siege or famine.`,
      },
    },
    mystic: {
      legendaryBold: {
        title: 'Ending: Starfire Ascension',
        body: `${characterName} embraces the fiercest arcane paths and reshapes destiny with power no council can contain.`,
      },
      bold: {
        title: 'Ending: Stormcaller Ascendant',
        body: `${characterName} embraces dangerous power and rewrites the old magical order in a single night.`,
      },
      careful: {
        title: 'Ending: Keeper of Seals',
        body: `${characterName} stabilizes ancient forces and prevents catastrophe through discipline and precision.`,
      },
      balanced: {
        title: 'Ending: Oracle of the Vale',
        body: `${characterName} harmonizes wild power with wisdom, leaving behind a safer and awakened land.`,
      },
      legendaryCareful: {
        title: 'Ending: Warden of the Veil',
        body: `${characterName} constructs perfect wards and safeguards every ancient force without unleashing ruin.`,
      },
    },
    rogue: {
      legendaryBold: {
        title: 'Ending: Emperor of Night Roads',
        body: `${characterName} wins by relentless daring until every smuggler, spy, and thief answers to your signal.`,
      },
      bold: {
        title: 'Ending: Kingpin of Shadows',
        body: `${characterName} outplays every rival through daring moves, controlling the region's hidden networks.`,
      },
      careful: {
        title: 'Ending: The Unseen Hand',
        body: `${characterName} wins through stealth and planning, ending threats before anyone knows they began.`,
      },
      balanced: {
        title: 'Ending: The Gray Legend',
        body: `${characterName} walks both spotlight and shadow, becoming a myth whispered in every tavern.`,
      },
      legendaryCareful: {
        title: 'Ending: Ghost of the Realm',
        body: `${characterName} perfects subtlety so fully that major wars end from moves no one can trace.`,
      },
    },
    scholar: {
      legendaryBold: {
        title: 'Ending: Architect of the New Age',
        body: `${characterName} pushes discovery at full speed and launches an age of innovation that transforms the valley forever.`,
      },
      bold: {
        title: 'Ending: The Revolutionary Mind',
        body: `${characterName} uses high-risk discoveries to transform the valley into a center of new knowledge.`,
      },
      careful: {
        title: 'Ending: The Eternal Chronicler',
        body: `${characterName} preserves and restores truth with rigorous care, ensuring history can never be lost again.`,
      },
      balanced: {
        title: 'Ending: Sage of Two Ages',
        body: `${characterName} pairs innovation with caution, creating progress that remains stable for generations.`,
      },
      legendaryCareful: {
        title: 'Ending: Master of the Grand Archive',
        body: `${characterName} builds the most complete knowledge sanctuary in history, preserving every lesson for centuries to come.`,
      },
    },
  };

  const fallback = {
    legendaryBold: {
      title: 'Ending: Myth of the Spearhead',
      body: `${characterName} commits to decisive momentum and changes the course of history through relentless action.`,
    },
    bold: {
      title: 'Ending: Path of Bold Resolve',
      body: `${characterName} takes decisive risks and wins the valley's future through relentless momentum.`,
    },
    careful: {
      title: 'Ending: Path of Patient Insight',
      body: `${characterName} chooses strategy and precision, securing victory with minimal losses.`,
    },
    balanced: {
      title: 'Ending: Path of Measured Heroism',
      body: `${characterName} balances courage and caution, guiding the valley into a stable new era.`,
    },
    legendaryCareful: {
      title: 'Ending: Myth of the Silent Compass',
      body: `${characterName} relies on mastery and foresight, shaping a future where crises are solved before they begin.`,
    },
  };

  const selected = endings[characterId]?.[endingStyle] ?? fallback[endingStyle];

  return {
    title: selected.title,
    body: `${selected.body} Your strongest attribute at the end is ${dominantAttribute}.`,
  };
}

function getSceneBackgroundPath(sceneId: ChapterSceneId, endingStyle: EndingStyle): string {
  if (sceneId === 'ending') {
    return `/backgrounds/ending-${endingStyle}.webp`;
  }

  const chapterMatch = /^chapter(\d+)_start$/.exec(sceneId);
  if (chapterMatch) {
    return `/backgrounds/chapter-${chapterMatch[1]}.webp`;
  }

  return '/backgrounds/chapter-1.webp';
}

function getCharacterOverlayPath(characterId: string): string {
  const supportedCharacters = new Set([
    'warrior',
    'diplomat',
    'guardian',
    'mystic',
    'rogue',
    'scholar',
  ]);

  if (supportedCharacters.has(characterId)) {
    return `/backgrounds/overlay-${characterId}.webp`;
  }

  return '/backgrounds/overlay-guardian.webp';
}

function toChapterTemplates(characterName: string, activeStory: {
  arrivalIntro: string;
  villageNowChoice: string;
  observeChoice: string;
}): ChapterTemplate[] {
  return [
    {
      chapterNumber: 1,
      title: 'Chapter 1: Lost in the Woods',
      body: `${characterName} walks deeper into the woods, convinced they may be lost forever. ${activeStory.arrivalIntro}`,
      choices: [
        {
          label: activeStory.villageNowChoice,
          attributeDelta: { strength: 1, charisma: 1, intelligence: -1 },
          choiceStyle: 'bold',
        },
        {
          label: activeStory.observeChoice,
          attributeDelta: { intelligence: 1, agility: 1, charisma: -1 },
          choiceStyle: 'careful',
        },
      ],
    },
    {
      chapterNumber: 2,
      title: 'Chapter 2: The Village Gates',
      body: 'The gate captain questions your intentions while townsfolk whisper nearby. Your answer now will define your place in the village.',
      choices: [
        {
          label: 'Speak with confidence and ask to meet the elder',
          attributeDelta: { charisma: 1, luck: 1, agility: -1 },
          choiceStyle: 'bold',
        },
        {
          label: 'Scan the gate, spot weak points, and stay ready',
          attributeDelta: { intelligence: 1, agility: 1, charisma: -1 },
          choiceStyle: 'careful',
        },
      ],
    },
    {
      chapterNumber: 3,
      title: 'Chapter 3: Trouble on the Road',
      body: 'A merchant caravan reports raids outside the village walls. You are asked to help before more supplies disappear.',
      choices: [
        {
          label: 'Escort the caravan and face danger head-on',
          attributeDelta: { strength: 1, luck: 1, intelligence: -1 },
          choiceStyle: 'bold',
        },
        {
          label: 'Set a trap route and predict the raiders',
          attributeDelta: { intelligence: 1, agility: 1, strength: -1 },
          choiceStyle: 'careful',
        },
      ],
    },
    {
      chapterNumber: 4,
      title: 'Chapter 4: Echoes Beneath the Shrine',
      body: 'An old shrine hums with strange energy under the village. Something hidden there seems linked to every recent threat.',
      choices: [
        {
          label: 'Step into the shrine chamber and invoke the relic',
          attributeDelta: { luck: 1, charisma: 1, agility: -1 },
          choiceStyle: 'bold',
        },
        {
          label: 'Study the runes first and disable the wards safely',
          attributeDelta: { intelligence: 1, luck: 1, charisma: -1 },
          choiceStyle: 'careful',
        },
      ],
    },
    {
      chapterNumber: 5,
      title: 'Chapter 5: Crossing the Grey Pass',
      body: 'To reach the source of the unrest, you must cross a mountain pass full of ambush points and collapsing stone bridges.',
      choices: [
        {
          label: 'Force your way through before enemies regroup',
          attributeDelta: { strength: 1, agility: 1, intelligence: -1 },
          choiceStyle: 'bold',
        },
        {
          label: 'Chart a safer route using old waymarkers',
          attributeDelta: { intelligence: 1, luck: 1, strength: -1 },
          choiceStyle: 'careful',
        },
      ],
    },
    {
      chapterNumber: 6,
      title: 'Chapter 6: The Hidden Camp',
      body: 'You discover the raiders\' hidden camp. Striking now could end the threat, but one mistake could alert everyone.',
      choices: [
        {
          label: 'Challenge their leader directly to break morale',
          attributeDelta: { strength: 1, charisma: 1, intelligence: -1 },
          choiceStyle: 'bold',
        },
        {
          label: 'Infiltrate quietly and sabotage their supplies',
          attributeDelta: { agility: 1, intelligence: 1, charisma: -1 },
          choiceStyle: 'careful',
        },
      ],
    },
    {
      chapterNumber: 7,
      title: 'Chapter 7: Council of Ash and Steel',
      body: 'With the camp shaken, rival factions in the region demand your allegiance. Your next move can unite or divide them.',
      choices: [
        {
          label: 'Broker peace terms and bind them to a pact',
          attributeDelta: { charisma: 1, intelligence: 1, strength: -1 },
          choiceStyle: 'careful',
        },
        {
          label: 'Back one faction and prepare for open conflict',
          attributeDelta: { strength: 1, luck: 1, charisma: -1 },
          choiceStyle: 'bold',
        },
      ],
    },
    {
      chapterNumber: 8,
      title: 'Chapter 8: Storm Over Blackwater',
      body: 'A siege begins under a violent storm. You command defenders while chaos spreads across the walls and river crossings.',
      choices: [
        {
          label: 'Lead the countercharge at the main breach',
          attributeDelta: { strength: 1, agility: 1, intelligence: -1 },
          choiceStyle: 'bold',
        },
        {
          label: 'Redirect forces and outmaneuver the attackers',
          attributeDelta: { intelligence: 1, charisma: 1, luck: -1 },
          choiceStyle: 'careful',
        },
      ],
    },
    {
      chapterNumber: 9,
      title: 'Chapter 9: The Broken Seal',
      body: 'The true mastermind reveals an ancient seal that can reshape the valley. You have one chance to decide how it is used.',
      choices: [
        {
          label: 'Channel the seal\'s power through will alone',
          attributeDelta: { luck: 1, strength: 1, intelligence: -1 },
          choiceStyle: 'bold',
        },
        {
          label: 'Stabilize the ritual using precise control',
          attributeDelta: { intelligence: 1, agility: 1, strength: -1 },
          choiceStyle: 'careful',
        },
      ],
    },
    {
      chapterNumber: 10,
      title: 'Chapter 10: Fate of the Valley',
      body: 'All paths converge in a final stand. The people you helped, the risks you took, and your attributes now decide the legacy you leave behind.',
      choices: [
        {
          label: 'Take command and inspire everyone to hold the line',
          attributeDelta: { charisma: 1, strength: 1, luck: -1 },
          choiceStyle: 'bold',
        },
        {
          label: 'Execute a precise final plan to end the crisis',
          attributeDelta: { intelligence: 1, agility: 1, charisma: -1 },
          choiceStyle: 'careful',
        },
      ],
    },
  ];
}

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
  onStatsChange,
  choiceStyleProfile,
  onChoiceStyleProfileChange,
  onSaveGame,
  saveInProgress,
  canSave,
  initialSceneId = 'chapter1_start',
  onSceneChange,
  onReturnToMenu,
  onReallocate,
}: NextChapterProps) {
  const [sceneId, setSceneId] = useState<ChapterSceneId>(legacyToModernSceneId(initialSceneId));

  useEffect(() => {
    setSceneId(legacyToModernSceneId(initialSceneId));
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
  const endingStyle = determineEndingStyle(choiceStyleProfile);
  const ending = getCharacterEnding(characterId, characterName, endingStyle, dominantAttribute);

  const chapterTemplates = toChapterTemplates(characterName, activeStory);

  const scenes = chapterTemplates.reduce<Record<ChapterSceneId, Scene>>((acc, chapter) => {
    const nextSceneId = chapter.chapterNumber === TOTAL_CHAPTERS
      ? 'ending'
      : chapterSceneId(chapter.chapterNumber + 1);

    acc[chapterSceneId(chapter.chapterNumber)] = {
      id: chapterSceneId(chapter.chapterNumber),
      title: chapter.title,
      body: `${chapter.body} Your current edge is ${dominantAttribute}.`,
      choices: chapter.choices.map((choice) => ({
        ...choice,
        nextSceneId,
      })),
    };

    return acc;
  }, {});

  scenes.ending = {
    id: 'ending',
    title: ending.title,
    body: `${ending.body} Choice path: Bold ${choiceStyleProfile.bold}, Careful ${choiceStyleProfile.careful}.`,
    isEnding: true,
  };

  const currentScene = scenes[sceneId] ?? scenes[chapterSceneId(1)];
  const backgroundPath = getSceneBackgroundPath(currentScene.id, endingStyle);
  const overlayPath = getCharacterOverlayPath(characterId);

  const handleChoiceSelect = (
    nextSceneId: ChapterSceneId,
    attributeDelta: AttributeDelta,
    choiceStyle: ChoiceStyle,
  ) => {
    onStatsChange(applyAttributeDelta(stats, attributeDelta));
    onChoiceStyleProfileChange({
      ...choiceStyleProfile,
      bold: choiceStyleProfile.bold + (choiceStyle === 'bold' ? 1 : 0),
      careful: choiceStyleProfile.careful + (choiceStyle === 'careful' ? 1 : 0),
    });
    setSceneId(nextSceneId);
  };

  return (
    <div
      className="main-menu-container story-scene-background"
      style={{
        backgroundImage: `linear-gradient(rgba(10, 4, 22, 0.58), rgba(8, 2, 16, 0.72)), url(${overlayPath}), url(${backgroundPath})`,
      }}
    >
      <div key={currentScene.id} className="selection-overlay scene-fade">
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
                onClick={() => handleChoiceSelect(choice.nextSceneId, choice.attributeDelta, choice.choiceStyle)}
              >
                {choice.label} ({describeAttributeDelta(choice.attributeDelta)})
              </button>
            ))}
          </div>
        ) : (
          <div className="button-group" style={{ marginTop: '1rem' }}>
            <button className="menu-button load-button" onClick={() => setSceneId(chapterSceneId(1))}>
              Try Another Path
            </button>
            <button className="menu-button start-button" onClick={onReturnToMenu}>
              {currentScene.isEnding ? 'Return to Menu' : 'Leave Chapter'}
            </button>
          </div>
        )}

        <button className="back-link" onClick={onReallocate} style={{ marginTop: '1rem' }}>
          Back to Attribute Allocation
        </button>

        <div className="button-group" style={{ marginTop: '1rem' }}>
          <button
            className="menu-button load-button"
            onClick={onSaveGame}
            disabled={saveInProgress || !canSave}
          >
            {saveInProgress ? 'Saving...' : 'Save Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
