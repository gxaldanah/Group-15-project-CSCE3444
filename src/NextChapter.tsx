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
  onTryAnotherPath: () => void;
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
const GAME_OVER_SCENE_ID: ChapterSceneId = 'game_over';

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
): { title: string; body: string } {
  const endings: Record<string, Record<EndingStyle, { title: string; body: string }>> = {
    warrior: {
      legendaryBold: {
        title: 'Ending: Warbrand of the Valley',
        body: `${characterName} charges forward one final time, shattering the enemy advance in a blaze of defiant glory. Outnumbered but unbroken, your blade becomes legend. Entire armies break at your advance, and the valley trembles at your name. History will sing of this moment for a thousand years.`,
      },
      bold: {
        title: 'Ending: The Iron Vanguard',
        body: `${characterName} wins through fearless action and relentless momentum. Warriors follow you into impossible odds because they believe nothing can defeat you. Your victory is carved in blood and steel, and songs of your charge echo through taverns for generations.`,
      },
      careful: {
        title: 'Ending: The Shielded General',
        body: `${characterName} tempers force with patience, building an unshakeable defense that keeps every border secure. Your strategic wisdom saves more lives than any sword ever could. The valley knows peace because you chose discipline over brutality.`,
      },
      balanced: {
        title: 'Ending: The Warden of Balance',
        body: `${characterName} blends courage and restraint, becoming a symbol neither purely feared nor pitied. You forge a legacy where strength protects rather than dominates, and people rebuild with hope.`,
      },
      legendaryCareful: {
        title: 'Ending: The Eternal Bastion',
        body: `${characterName} masters preparation and timing so completely that enemies never breach the valley's defenses. Your wards and strategies create an impenetrable barrier. No attacker ever sees your true strength—only unbreakable walls they cannot cross.`,
      },
    },
    diplomat: {
      legendaryBold: {
        title: 'Ending: Crown of the Unifier',
        body: `${characterName} takes audacious diplomatic gambles, brokering an alliance so vast and unexpected it redraws the entire region's map overnight. Rivals who would have fought forever instead stand unified. Your vision reshapes civilization itself.`,
      },
      bold: {
        title: 'Ending: The Flame of Unity',
        body: `${characterName} takes bold political risks and forges an historic accord between powers that seemed eternally opposed. Your charisma and vision inspire enemies to become allies. The valley enters a new era of cooperation.`,
      },
      careful: {
        title: 'Ending: The Silent Architect',
        body: `${characterName} resolves every conflict through patient negotiation and masterful strategy. Peace emerges not from grand gestures but from careful agreements that hold because they're built on trust and mutual benefit.`,
      },
      balanced: {
        title: 'Ending: The Golden Voice',
        body: `${characterName} knows exactly when to press and when to listen, when to dream big and when to compromise. Rivals call you the era's most trusted leader because you've proven your word is bond.`,
      },
      legendaryCareful: {
        title: 'Ending: Concord Without End',
        body: `${characterName} weaves layer upon layer of careful treaties and agreements until war becomes not just unthinkable but impossible. Future generations will inherit a peace so durable it outlasts empires. Your treaties become the foundation of civilization itself.`,
      },
    },
    guardian: {
      legendaryBold: {
        title: 'Ending: The Rampart King',
        body: `${characterName} meets every threat at the front, personally defending those who cannot defend themselves. Your heroic acts become legend—sheltering hundreds, shielding the vulnerable, standing against impossible odds. You become the living symbol of unbreakable resistance.`,
      },
      bold: {
        title: 'Ending: Bastion Unbroken',
        body: `${characterName} stands at every critical front, turning desperate battles into impossible holds. Your courage inspires others to fight harder. Communities rally behind you because they know you'll never abandon them.`,
      },
      careful: {
        title: 'Ending: Keeper of the Hearth',
        body: `${characterName} prioritizes safe routes, hidden shelters, and strong communities. Refugees survive the conflict not through heroic battles but through careful planning. You ensure people not only survive but can rebuild quickly.`,
      },
      balanced: {
        title: 'Ending: The Living Wall',
        body: `${characterName} becomes a symbol of protection—feared by enemies for your strength, beloved by civilians for your kindness. You stand between the innocent and danger with unwavering resolve.`,
      },
      legendaryCareful: {
        title: 'Ending: Guardian of Ages',
        body: `${characterName} designs protections so enduring and perfect that children grow old having never known siege, famine, or fear. Your wisdom creates safe havens that survive for centuries. Generations will live in peace because of your foresight.`,
      },
    },
    mystic: {
      legendaryBold: {
        title: 'Ending: Starfire Ascension',
        body: `${characterName} embraces the fiercest arcane paths, channeling power that defies mortal understanding. Reality bends to your will as you reshape destiny itself. Ancient seals shatter at your command, and the world transforms in a single night of impossible magic.`,
      },
      bold: {
        title: 'Ending: Stormcaller Ascendant',
        body: `${characterName} embraces dangerous power and rewrites the old magical order with confidence and daring. Lightning obeys your voice, spirits bow before your will, and the valley awakens to new possibilities.`,
      },
      careful: {
        title: 'Ending: Keeper of Seals',
        body: `${characterName} stabilizes ancient forces and prevents catastrophe through discipline and precision. While others might have unleashed ruin, you chose wisdom. The seals remain bound, but now benign rather than threatening.`,
      },
      balanced: {
        title: 'Ending: Oracle of the Vale',
        body: `${characterName} harmonizes wild power with wisdom, merging the old magic and the new world. The valley awakens to its true potential, and people learn to live alongside forces they once feared.`,
      },
      legendaryCareful: {
        title: 'Ending: Warden of the Veil',
        body: `${characterName} constructs perfect wards and safeguards every ancient force without unleashing ruin. Your mastery of the magical arts becomes legendary—safe, enduring, impeccable. The veil between worlds holds strong because of your work.`,
      },
    },
    rogue: {
      legendaryBold: {
        title: 'Ending: Emperor of Night Roads',
        body: `${characterName} wins through relentless daring and audacious plays until every smuggler, spy, and thief in the realm answers to your signal. You build an empire of shadows that controls the valley's true power. History will never know your name, but everything happens because of your will.`,
      },
      bold: {
        title: 'Ending: Kingpin of Shadows',
        body: `${characterName} outplays every rival through daring moves, controlling the region's hidden networks. The valley's destiny shifts through operations no one can trace back to you. True power is never seen in the light.`,
      },
      careful: {
        title: 'Ending: The Unseen Hand',
        body: `${characterName} wins through stealth and planning, ending threats before anyone knows they began. Your greatest victories happen silently. Wars are won through sabotage, information, and perfect timing.`,
      },
      balanced: {
        title: 'Ending: The Gray Legend',
        body: `${characterName} walks both spotlight and shadow, becoming a myth whispered in every tavern and marketplace. Some say you're a hero, others a thief. Everyone knows your name, but no one truly knows your game.`,
      },
      legendaryCareful: {
        title: 'Ending: Ghost of the Realm',
        body: `${characterName} perfects subtlety so fully that major wars end from moves no one can trace to you. Empires fall, alliances crumble, and the valley enters a new era—all because of decisions made in darkness. You are the perfect shadow.`,
      },
    },
    scholar: {
      legendaryBold: {
        title: 'Ending: Architect of the New Age',
        body: `${characterName} pushes discovery at full speed and launches an age of innovation that transforms the valley forever. Revolutionary discoveries flow from your research. Technology and knowledge advance faster than anyone thought possible. You spark a renaissance.`,
      },
      bold: {
        title: 'Ending: The Revolutionary Mind',
        body: `${characterName} uses high-risk discoveries to transform the valley into a center of new knowledge and innovation. Your theories reshape how people understand the world. The valley becomes a beacon of learning.`,
      },
      careful: {
        title: 'Ending: The Eternal Chronicler',
        body: `${characterName} preserves and restores truth with rigorous care, ensuring history can never be lost or rewritten again. Your archive becomes humanity's greatest treasure. Future generations will access the complete, authentic record of this era.`,
      },
      balanced: {
        title: 'Ending: Sage of Two Ages',
        body: `${characterName} pairs innovation with caution, creating progress that remains stable and sustainable for generations. You teach others to think like scholars. Knowledge and wisdom become the valley's greatest strength.`,
      },
      legendaryCareful: {
        title: 'Ending: Master of the Grand Archive',
        body: `${characterName} builds the most complete knowledge sanctuary in history, preserving every lesson, every discovery, and every truth for centuries to come. Scholars will study in your library for a thousand years. You have ensured that humanity never loses its memory.`,
      },
    },
  };

  const fallback = {
    legendaryBold: {
      title: 'Ending: Myth of the Spearhead',
      body: `${characterName} commits to decisive momentum and changes the course of history through bold, relentless action. Your name becomes legend. The valley will remember this moment forever.`,
    },
    bold: {
      title: 'Ending: Path of Bold Resolve',
      body: `${characterName} takes decisive risks and wins the valley's future through relentless momentum. People follow you because you lead without fear.`,
    },
    careful: {
      title: 'Ending: Path of Patient Insight',
      body: `${characterName} chooses strategy and precision, securing victory with minimal losses. Your discipline saves lives and shapes a stable future.`,
    },
    balanced: {
      title: 'Ending: Path of Measured Heroism',
      body: `${characterName} balances courage and caution, guiding the valley into a stable new era of hope and possibility.`,
    },
    legendaryCareful: {
      title: 'Ending: Myth of the Silent Compass',
      body: `${characterName} relies on mastery and foresight so complete that crises are solved before they begin. Your legacy is peace through perfect preparation.`,
    },
  };

  const selected = endings[characterId]?.[endingStyle] ?? fallback[endingStyle];

  return {
    title: selected.title,
    body: `${selected.body}`,
  };
}

function getSceneBackgroundPath(sceneId: ChapterSceneId, endingStyle: EndingStyle): string {
  const version = '20260416-2';
  if (sceneId === 'ending') {
    return `/backgrounds/ending-${endingStyle}.webp?v=${version}`;
  }

  const chapterMatch = /^chapter(\d+)_start$/.exec(sceneId);
  if (chapterMatch) {
    return `/backgrounds/chapter-${chapterMatch[1]}.webp?v=${version}`;
  }

  return `/backgrounds/chapter-1.webp?v=${version}`;
}

function getCharacterOverlayPath(characterId: string): string {
  const version = '20260416-2';
  const supportedCharacters = new Set([
    'warrior',
    'diplomat',
    'guardian',
    'mystic',
    'rogue',
    'scholar',
  ]);

  if (supportedCharacters.has(characterId)) {
    return `/backgrounds/overlay-${characterId}.webp?v=${version}`;
  }

  return `/backgrounds/overlay-guardian.webp?v=${version}`;
}

function getCharacterBackgroundPath(characterId: string): string {
  const version = '20260416-2';
  const supportedCharacters = new Set([
    'warrior',
    'diplomat',
    'guardian',
    'mystic',
    'rogue',
    'scholar',
  ]);

  if (supportedCharacters.has(characterId)) {
    return `/backgrounds/bg-${characterId}.webp?v=${version}`;
  }

  return `/backgrounds/bg-guardian.webp?v=${version}`;
}

function toChapterTemplates(characterName: string, activeStory: {
  arrivalIntro: string;
  villageNowChoice: string;
  observeChoice: string;
}, characterId: string): ChapterTemplate[] {
  // Base chapter that's common for all characters
  const chapter1: ChapterTemplate = {
    chapterNumber: 1,
    title: 'Chapter 1: Lost in the Woods',
    body: `${characterName} walks deeper into the woods, convinced they may be lost forever. ${activeStory.arrivalIntro}`,
    choices: [
      {
        label: activeStory.villageNowChoice,
        attributeDelta: { strength: 3, charisma: 2, intelligence: -2 } as Partial<Record<keyof Attributes, number>>,
        choiceStyle: 'bold',
      },
      {
        label: activeStory.observeChoice,
        attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as Partial<Record<keyof Attributes, number>>,
        choiceStyle: 'careful',
      },
    ],
  };

  // Character-specific chapters
  if (characterId === 'warrior') {
    return [
      chapter1,
      {
        chapterNumber: 2,
        title: 'Chapter 2: The Barracks Trial',
        body: 'The village militia tests your combat skill. A grizzled sergeant eyes you with respect—or contempt. Your choice will determine if they follow you into battle.',
        choices: [
          { label: 'Defeat their best fighter in single combat', attributeDelta: { strength: 3, luck: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Study their techniques and suggest improvements', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 3,
        title: 'Chapter 3: Bloodstained Roads',
        body: 'Raiders strike at dawn. Merchants and townspeople scatter in panic. A child runs toward danger—save them or hold the line?',
        choices: [
          { label: 'Charge through enemy lines to save the child', attributeDelta: { strength: 3, luck: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Create a tactical diversion to extract the child safely', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 4,
        title: 'Chapter 4: The Forge\'s Secret',
        body: 'A master weaponsmith reveals that the village\'s forge can craft ancient steel—but it requires the blood of a demon locked beneath the shrine.',
        choices: [
          { label: 'Descend alone into battle with the imprisoned demon', attributeDelta: { luck: 3, strength: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Research ward placement and weaken the demon first', attributeDelta: { intelligence: 3, luck: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 5,
        title: 'Chapter 5: The Mountain Gauntlet',
        body: 'Raiders hold the high passes. Your scouts report three routes: a direct assault through the strongest position, or two riskier but potentially undefended paths.',
        choices: [
          { label: 'Lead a frontal assault on the main position', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Orchestrate a flanking maneuver through treacherous terrain', attributeDelta: { intelligence: 3, luck: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 6,
        title: 'Chapter 6: The Enemy Commander',
        body: 'You encounter the raider leader in their war tent. They offer a proposal: combine forces or face mutual annihilation.',
        choices: [
          { label: 'Challenge them to a duel to decide the valley\'s fate', attributeDelta: { strength: 3, charisma: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Turn them against their own generals with strategic manipulation', attributeDelta: { agility: 3, intelligence: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 7,
        title: 'Chapter 7: War Council',
        body: 'Three factions now demand your allegiance with conflicting interests. Blood will be spilled either way.',
        choices: [
          { label: 'Unite them through an inspiring call to righteous war', attributeDelta: { charisma: 3, strength: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Play diplomatic games to create strategic advantage', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 8,
        title: 'Chapter 8: Siege Inferno',
        body: 'The enemy approaches with overwhelming numbers. Fire spreads beneath the storm. Your troops look to you for one final command.',
        choices: [
          { label: 'Execute a desperate, hero\'s last stand attack', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Coordinate a calculated tactical retreat to regroup', attributeDelta: { intelligence: 3, charisma: 2, luck: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 9,
        title: 'Chapter 9: The Warlord\'s Tomb',
        body: 'Deep underground, you find an ancient warrior sealed in enchanted slumber with a legendary weapon. Awakening them could turn the tide—or release something worse.',
        choices: [
          { label: 'Break the seal and face whatever emerges', attributeDelta: { luck: 3, strength: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Study the seal to understand the danger before acting', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 10,
        title: 'Chapter 10: The Final Clash',
        body: 'Face to face with the source of the valley\'s ruin. Your blade, your wits, and your will are all that remain. History watches.',
        choices: [
          { label: 'Engage in the most legendary battle of your life', attributeDelta: { charisma: 3, strength: 2, luck: -2 } as any, choiceStyle: 'bold' },
          { label: 'Strike with precision at the exact moment of victory', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
    ];
  }

  if (characterId === 'diplomat') {
    return [
      chapter1,
      {
        chapterNumber: 2,
        title: 'Chapter 2: The Parlor of Secrets',
        body: 'The village council meets in secret. Each member harbors a grievance and conspiracy. Your words will either heal rifts or exploit them.',
        choices: [
          { label: 'Appeal to their highest ideals and unite them publicly', attributeDelta: { charisma: 3, luck: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Learn their secrets first, then offer private solutions', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 3,
        title: 'Chapter 3: The Merchant\'s Gambit',
        body: 'A caravan is caught between rival camps. Both sides threaten violence unless the merchant chooses a side.',
        choices: [
          { label: 'Broker a dramatic peace deal that benefits all sides', attributeDelta: { charisma: 3, luck: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Identify leverage and negotiate from strength', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 4,
        title: 'Chapter 4: The Shrine\'s Prophecy',
        body: 'An oracle speaks in riddles about "three powers divided." Religious factions demand your interpretation align with their beliefs.',
        choices: [
          { label: 'Reinterpret the prophecy boldly to challenge false beliefs', attributeDelta: { luck: 3, charisma: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Carefully uncover the truth through patient analysis', attributeDelta: { intelligence: 3, luck: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 5,
        title: 'Chapter 5: Crossing the Divide',
        body: 'Two warlords control the mountain pass with competing claims. Neither will yield without loss of face.',
        choices: [
          { label: 'Propose a grand meeting place and mediate an accord', attributeDelta: { charisma: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Broker a neutral independent state between them', attributeDelta: { intelligence: 3, luck: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 6,
        title: 'Chapter 6: The Traitor Revealed',
        body: 'You discover a conspiracy: someone close to you sells information to the enemy. Confronting them could shatter alliances.',
        choices: [
          { label: 'Publicly expose the conspiracy to regain trust', attributeDelta: { charisma: 3, strength: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Turn the traitor as a double agent for advantage', attributeDelta: { agility: 3, intelligence: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 7,
        title: 'Chapter 7: The Assembly of Crowns',
        body: 'Five regional powers gather. Each demands a different outcome. Your negotiating skill is the only hope for unity.',
        choices: [
          { label: 'Propose a radical confederation with shared power', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'bold' },
          { label: 'Weave complex trade agreements that bind them together', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 8,
        title: 'Chapter 8: Siege and Negotiation',
        body: 'Armies surround the city. The enemy general offers terms—surrender or watch the city burn.',
        choices: [
          { label: 'Deliver an inspiring final ultimatum that rallies defense', attributeDelta: { strength: 3, charisma: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Find the general\'s hidden motive and negotiate peace', attributeDelta: { intelligence: 3, charisma: 2, luck: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 9,
        title: 'Chapter 9: The Hidden Treaty',
        body: 'An ancient alliance scrolls in the shrine reveal secrets about the region\'s origins. This knowledge could reshape all negotiations.',
        choices: [
          { label: 'Share the knowledge boldly to restructure agreements', attributeDelta: { luck: 3, charisma: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Carefully use knowledge as leverage for perfect advantage', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 10,
        title: 'Chapter 10: The New Order',
        body: 'The war is over. Now rebuild. Your vision of the valley\'s future will shape generations.',
        choices: [
          { label: 'Establish a visionary new federation of equals', attributeDelta: { charisma: 3, strength: 2, luck: -2 } as any, choiceStyle: 'bold' },
          { label: 'Carefully rebuild governance from first principles', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
    ];
  }

  if (characterId === 'guardian') {
    return [
      chapter1,
      {
        chapterNumber: 2,
        title: 'Chapter 2: The Forgotten Orphans',
        body: 'The village is full of orphans from the conflict. Resources are thin. You must choose who receives shelter and aid.',
        choices: [
          { label: 'Take all orphans under your personal care and provision', attributeDelta: { charisma: 3, luck: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Organize a sustainable long-term care system', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 3,
        title: 'Chapter 3: The Road Guard',
        body: 'Refugees stream along the roads. Some from the enemy, some from your own side. Protect all or maintain border security?',
        choices: [
          { label: 'Open the gates and welcome all refugees openly', attributeDelta: { strength: 3, luck: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Screen carefully while providing sanctuary camps', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 4,
        title: 'Chapter 4: The Sick Child',
        body: 'A child carries a curse from the shrine. Healing them requires a dangerous ritual that might spread the affliction.',
        choices: [
          { label: 'Perform the ritual alone to shield others from risk', attributeDelta: { luck: 3, strength: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Research a safer alternative before acting', attributeDelta: { intelligence: 3, luck: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 5,
        title: 'Chapter 5: The Treacherous Pass',
        body: 'Winter comes early. Refugees must cross a dangerous mountain pass. Prepare expeditions or wait for spring?',
        choices: [
          { label: 'Lead expeditions through snow and avalanche danger', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Build shelters and defensive positions for winter camps', attributeDelta: { intelligence: 3, luck: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 6,
        title: 'Chapter 6: The Mercy Choice',
        body: 'Wounded enemy soldiers are captured. Healing them saves lives but angers your allies.',
        choices: [
          { label: 'Treat all wounded soldiers equally and defend the choice publicly', attributeDelta: { strength: 3, charisma: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Secretly care for wounded enemies and maintain appearances', attributeDelta: { agility: 3, intelligence: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 7,
        title: 'Chapter 7: The Council of Care',
        body: 'Representative from each faction demand resources for their people. Resources are scarce.',
        choices: [
          { label: 'Redistribute fairly and trust communities to understand', attributeDelta: { charisma: 3, strength: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Create transparent systems so everyone sees fairness in action', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 8,
        title: 'Chapter 8: The Siege Wall',
        body: 'The city is surrounded. You command the defenses. Supply shortages force terrible rationing choices.',
        choices: [
          { label: 'Fight hard and short the rations minimally', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Plan a coordinated defense and precise resource management', attributeDelta: { intelligence: 3, charisma: 2, luck: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 9,
        title: 'Chapter 9: The Final Refuge',
        body: 'You discover an ancient sanctuary beneath the shrine. Room for thousands but sealed for centuries. Breaking the seal risks unknown consequences.',
        choices: [
          { label: 'Open it boldly to shelter the vulnerable', attributeDelta: { luck: 3, strength: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Study it carefully before revealing its purpose', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 10,
        title: 'Chapter 10: The New Dawn',
        body: 'Peace comes. Your legacy is the safety and hope you gave to thousands. Now rebuild a better world.',
        choices: [
          { label: 'Lead communities forward with bold new vision', attributeDelta: { charisma: 3, strength: 2, luck: -2 } as any, choiceStyle: 'bold' },
          { label: 'Strengthen foundations for lasting stability', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
    ];
  }

  if (characterId === 'mystic') {
    return [
      chapter1,
      {
        chapterNumber: 2,
        title: 'Chapter 2: The Silent Ritual',
        body: 'Cultists perform rituals to the shrine. You sense they\'re not evil—just desperate followers of something ancient and awakening.',
        choices: [
          { label: 'Join the ritual to commune directly with the entity', attributeDelta: { charisma: 3, luck: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Carefully observe to understand before intervening', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 3,
        title: 'Chapter 3: The Cursed Road',
        body: 'Travelers report a curse spreading like plague. Magic is the cause—and the only solution.',
        choices: [
          { label: 'Venture into the cursed zone and meet the spirit directly', attributeDelta: { strength: 3, luck: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Map the magical patterns before engaging', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 4,
        title: 'Chapter 4: The Sealed Tomb',
        body: 'Beneath the shrine lies the tomb of an ancient mage. Their power still pulses through the stones. The seals show signs of breaking.',
        choices: [
          { label: 'Break the seals and awaken the entity within', attributeDelta: { luck: 3, charisma: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Reinforce the seals with your own magic', attributeDelta: { intelligence: 3, luck: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 5,
        title: 'Chapter 5: The Haunted Mountains',
        body: 'The mountain pass is infested with spirits and phantoms. They seem trapped here, repeating their final moments endlessly.',
        choices: [
          { label: 'Communicate with spirits and help them move on', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Construct barriers to safely guide travelers through', attributeDelta: { intelligence: 3, luck: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 6,
        title: 'Chapter 6: The Entity\'s Proposal',
        body: 'The awakening force from the shrine reveals itself. It offers power and visions of the future—in exchange for a sacrifice.',
        choices: [
          { label: 'Accept the power and prepare for what\'s to come', attributeDelta: { strength: 3, charisma: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Negotiate for knowledge without binding yourself', attributeDelta: { agility: 3, intelligence: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 7,
        title: 'Chapter 7: The Council of Seers',
        body: 'Other mystics arrive, each claiming different visions of the valley\'s fate. Consensus seems impossible.',
        choices: [
          { label: 'Push for the boldest vision—transformation at any cost', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'bold' },
          { label: 'Seek harmony where all visions coexist', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 8,
        title: 'Chapter 8: The Magical Siege',
        body: 'Armies surround the city, but they battle illusions and hexes. Your magic has transformed warfare itself.',
        choices: [
          { label: 'Unleash devastating magical attacks', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Maintain protective barriers and prevent bloodshed', attributeDelta: { intelligence: 3, charisma: 2, luck: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 9,
        title: 'Chapter 9: The Ritual of Binding',
        body: 'You discover a ritual that could bind a god-like power to the valley\'s stone. But such binding demands terrible payment.',
        choices: [
          { label: 'Perform the ritual at full cost', attributeDelta: { luck: 3, strength: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Craft a modified ritual to minimize sacrifice', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 10,
        title: 'Chapter 10: The New Magical Order',
        body: 'Magic is now openly part of the valley. You must guide how this ancient power reshapes civilization.',
        choices: [
          { label: 'Teach magic boldly and transform society', attributeDelta: { charisma: 3, strength: 2, luck: -2 } as any, choiceStyle: 'bold' },
          { label: 'Carefully integrate magic into existing structures', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
    ];
  }

  if (characterId === 'rogue') {
    return [
      chapter1,
      {
        chapterNumber: 2,
        title: 'Chapter 2: The Thieves\' Guild',
        body: 'The village\'s underground crime network approaches. They recognize a kindred spirit and offer partnership.',
        choices: [
          { label: 'Unite with them to establish control', attributeDelta: { charisma: 3, luck: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Infiltrate and manipulate them from within', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 3,
        title: 'Chapter 3: The Heist',
        body: 'A nobleman\'s vault holds evidence that could reshape the region\'s power structure. It\'s heavily guarded.',
        choices: [
          { label: 'Execute a daring raid to take everything', attributeDelta: { strength: 3, luck: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Plan the perfect theft—in and out without a trace', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 4,
        title: 'Chapter 4: The Underground Network',
        body: 'Smugglers reveal a massive system beneath the shrine connecting the entire valley. Control it and you control everything.',
        choices: [
          { label: 'Take command and consolidate all operations', attributeDelta: { luck: 3, charisma: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Exploit it for leverage without drawing attention', attributeDelta: { intelligence: 3, luck: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 5,
        title: 'Chapter 5: The Border Crossing',
        body: 'Refugees and rebels want to escape. Smuggling them out is profitable—and dangerous. Which side do you choose?',
        choices: [
          { label: 'Run refugees for profit, no questions asked', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Help only those you\'re sure will compensate you later', attributeDelta: { intelligence: 3, luck: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 6,
        title: 'Chapter 6: The Double Betrayal',
        body: 'You\'re caught between two powerful factions, both threatening. Your network could save you—but at what cost?',
        choices: [
          { label: 'Play them against each other in an open gambit', attributeDelta: { strength: 3, charisma: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Orchestrate a perfect betrayal of both sides', attributeDelta: { agility: 3, intelligence: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 7,
        title: 'Chapter 7: The Shadow Alliance',
        body: 'Criminal factions across the valley recognize your genius. They propose a shadowy cooperative.',
        choices: [
          { label: 'Lead the alliance openly and rule from shadows', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'bold' },
          { label: 'Remain unknown while pulling all the strings', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 8,
        title: 'Chapter 8: The Siege from Shadows',
        body: 'The city is surrounded by armies that can\'t be beaten in direct combat. But you can turn their supply lines into your playground.',
        choices: [
          { label: 'Sabotage them into starvation and chaos', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Subtly redirect every supply to yourself', attributeDelta: { intelligence: 3, charisma: 2, luck: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 9,
        title: 'Chapter 9: The Final Score',
        body: 'One last heist could secure your empire of shadows. The prize is beyond imagination, but the risk is extinction.',
        choices: [
          { label: 'Execute the greatest theft in history', attributeDelta: { luck: 3, strength: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Plan it so perfectly that success is certain', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 10,
        title: 'Chapter 10: The Shadow\'s Legacy',
        body: 'The valley has no idea who changed its fate. Your legend lives in whispers. This is what you wanted.',
        choices: [
          { label: 'Embrace the mystery and deepen your power', attributeDelta: { charisma: 3, strength: 2, luck: -2 } as any, choiceStyle: 'bold' },
          { label: 'Perfect your invisibility and rule forever unseen', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
    ];
  }

  if (characterId === 'scholar') {
    return [
      chapter1,
      {
        chapterNumber: 2,
        title: 'Chapter 2: The Lost Library',
        body: 'The village\'s ancient library was buried during construction. You\'ve found the entrance. Inside lies knowledge thought lost forever.',
        choices: [
          { label: 'Search immediately for rare texts', attributeDelta: { charisma: 3, luck: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Carefully catalog and preserve everything', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 3,
        title: 'Chapter 3: The Merchant\'s Obscure Texts',
        body: 'A passing merchant has scrolls from distant lands. They hint at mysteries about the valley\'s origins. The price is steep.',
        choices: [
          { label: 'Negotiate fiercely to acquire them at any cost', attributeDelta: { strength: 3, luck: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Copy them secretly before leaving', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 4,
        title: 'Chapter 4: The Shrine\'s Secret Archives',
        body: 'The shrine keeper reveals hidden chambers with chronicles predating any known history of the valley.',
        choices: [
          { label: 'Demand immediate access to all records', attributeDelta: { luck: 3, charisma: 2, agility: -2 } as any, choiceStyle: 'bold' },
          { label: 'Slowly earn access through careful research', attributeDelta: { intelligence: 3, luck: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 5,
        title: 'Chapter 5: The Expedition',
        body: 'Ancient texts mention ruins in the mountains. An expedition would be dangerous but could rewrite history.',
        choices: [
          { label: 'Lead an immediate, well-armed expedition', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Research thoroughly and plan a safe route', attributeDelta: { intelligence: 3, luck: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 6,
        title: 'Chapter 6: The Discovery',
        body: 'You find evidence that the valley was once a center of advanced civilization. This discovery could transform everything.',
        choices: [
          { label: 'Publish your findings boldly and spark revolution', attributeDelta: { strength: 3, charisma: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Verify every detail before sharing the truth', attributeDelta: { agility: 3, intelligence: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 7,
        title: 'Chapter 7: Academic Council',
        body: 'Scholars from across the region gather. Your discoveries threaten established beliefs. Political maneuvering begins.',
        choices: [
          { label: 'Challenge the establishment and demand recognition', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'bold' },
          { label: 'Build alliances through careful academic networking', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 8,
        title: 'Chapter 8: Knowledge as Weapon',
        body: 'The siege approaches. Your knowledge of the valley\'s ancient defenses could turn the tide—if you share it.',
        choices: [
          { label: 'Teach the army how to use forgotten tactics', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Secretly deploy historical knowledge for advantage', attributeDelta: { intelligence: 3, charisma: 2, luck: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 9,
        title: 'Chapter 9: The Grand Archive',
        body: 'With peace coming, you have the chance to build the greatest library in history. All valley knowledge could be preserved forever.',
        choices: [
          { label: 'Build it fast and share knowledge openly', attributeDelta: { luck: 3, strength: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
          { label: 'Construct it perfectly over years with meticulous care', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
      {
        chapterNumber: 10,
        title: 'Chapter 10: Legacy of Learning',
        body: 'Your institution will outlast empires. Generations will learn within its walls. This is immortality through knowledge.',
        choices: [
          { label: 'Build a revolutionary center of discovery', attributeDelta: { charisma: 3, strength: 2, luck: -2 } as any, choiceStyle: 'bold' },
          { label: 'Establish eternal traditions of preservation', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
        ],
      } as ChapterTemplate,
    ];
  }

  // Default fallback chapters for unknown characters
  return [
    chapter1,
    {
      chapterNumber: 2,
      title: 'Chapter 2: The Village Gates',
      body: 'The gate captain questions your intentions while townsfolk whisper nearby. Your answer now will define your place in the village.',
      choices: [
        { label: 'Speak with confidence and ask to meet the elder', attributeDelta: { charisma: 3, luck: 2, agility: -2 } as any, choiceStyle: 'bold' },
        { label: 'Scan the gate, spot weak points, and stay ready', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
      ],
    } as ChapterTemplate,
    {
      chapterNumber: 3,
      title: 'Chapter 3: Trouble on the Road',
      body: 'A merchant caravan reports raids outside the village walls. You are asked to help before more supplies disappear.',
      choices: [
        { label: 'Escort the caravan and face danger head-on', attributeDelta: { strength: 3, luck: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
        { label: 'Set a trap route and predict the raiders', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
      ],
    } as ChapterTemplate,
    {
      chapterNumber: 4,
      title: 'Chapter 4: Echoes Beneath the Shrine',
      body: 'An old shrine hums with strange energy under the village. Something hidden there seems linked to every recent threat.',
      choices: [
        { label: 'Step into the shrine chamber and invoke the relic', attributeDelta: { luck: 3, charisma: 2, agility: -2 } as any, choiceStyle: 'bold' },
        { label: 'Study the runes first and disable the wards safely', attributeDelta: { intelligence: 3, luck: 2, charisma: -2 } as any, choiceStyle: 'careful' },
      ],
    } as ChapterTemplate,
    {
      chapterNumber: 5,
      title: 'Chapter 5: Crossing the Grey Pass',
      body: 'To reach the source of the unrest, you must cross a mountain pass full of ambush points and collapsing stone bridges.',
      choices: [
        { label: 'Force your way through before enemies regroup', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
        { label: 'Chart a safer route using old waymarkers', attributeDelta: { intelligence: 3, luck: 2, strength: -2 } as any, choiceStyle: 'careful' },
      ],
    } as ChapterTemplate,
    {
      chapterNumber: 6,
      title: 'Chapter 6: The Hidden Camp',
      body: 'You discover the raiders\' hidden camp. Striking now could end the threat, but one mistake could alert everyone.',
      choices: [
        { label: 'Challenge their leader directly to break morale', attributeDelta: { strength: 3, charisma: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
        { label: 'Infiltrate quietly and sabotage their supplies', attributeDelta: { agility: 3, intelligence: 2, charisma: -2 } as any, choiceStyle: 'careful' },
      ],
    } as ChapterTemplate,
    {
      chapterNumber: 7,
      title: 'Chapter 7: Council of Ash and Steel',
      body: 'With the camp shaken, rival factions in the region demand your allegiance. Your next move can unite or divide them.',
      choices: [
        { label: 'Broker peace terms and bind them to a pact', attributeDelta: { charisma: 3, intelligence: 2, strength: -2 } as any, choiceStyle: 'careful' },
        { label: 'Back one faction and prepare for open conflict', attributeDelta: { strength: 3, luck: 2, charisma: -2 } as any, choiceStyle: 'bold' },
      ],
    } as ChapterTemplate,
    {
      chapterNumber: 8,
      title: 'Chapter 8: Storm Over Blackwater',
      body: 'A siege begins under a violent storm. You command defenders while chaos spreads across the walls and river crossings.',
      choices: [
        { label: 'Lead the countercharge at the main breach', attributeDelta: { strength: 3, agility: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
        { label: 'Redirect forces and outmaneuver the attackers', attributeDelta: { intelligence: 3, charisma: 2, luck: -2 } as any, choiceStyle: 'careful' },
      ],
    } as ChapterTemplate,
    {
      chapterNumber: 9,
      title: 'Chapter 9: The Broken Seal',
      body: 'The true mastermind reveals an ancient seal that can reshape the valley. You have one chance to decide how it is used.',
      choices: [
        { label: 'Channel the seal\'s power through will alone', attributeDelta: { luck: 3, strength: 2, intelligence: -2 } as any, choiceStyle: 'bold' },
        { label: 'Stabilize the ritual using precise control', attributeDelta: { intelligence: 3, agility: 2, strength: -2 } as any, choiceStyle: 'careful' },
      ],
    } as ChapterTemplate,
    {
      chapterNumber: 10,
      title: 'Chapter 10: Fate of the Valley',
      body: 'All paths converge in a final stand. The people you helped, the risks you took, and your attributes now decide the legacy you leave behind.',
      choices: [
        { label: 'Take command and inspire everyone to hold the line', attributeDelta: { charisma: 3, strength: 2, luck: -2 } as any, choiceStyle: 'bold' },
        { label: 'Execute a precise final plan to end the crisis', attributeDelta: { intelligence: 3, agility: 2, charisma: -2 } as any, choiceStyle: 'careful' },
      ],
    } as ChapterTemplate,
  ];
}

function getDominantAttribute(stats: Attributes): keyof Attributes {
  const entries = Object.entries(stats) as Array<[keyof Attributes, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function getNegativeAttribute(stats: Attributes): keyof Attributes | null {
  const entries = Object.entries(stats) as Array<[keyof Attributes, number]>;
  const negativeEntry = entries.find(([, value]) => value < 0);
  return negativeEntry ? negativeEntry[0] : null;
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
  onTryAnotherPath,
  onReallocate,
}: NextChapterProps) {
  const [sceneId, setSceneId] = useState<ChapterSceneId>(legacyToModernSceneId(initialSceneId));
  const [failedAttribute, setFailedAttribute] = useState<keyof Attributes | null>(null);

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
  const ending = getCharacterEnding(characterId, characterName, endingStyle);

  const chapterTemplates = toChapterTemplates(characterName, activeStory, characterId);

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

  scenes[GAME_OVER_SCENE_ID] = {
    id: GAME_OVER_SCENE_ID,
    title: 'Defeat: Your Journey Ends Here',
    body: failedAttribute
      ? `Your ${ATTRIBUTE_LABELS[failedAttribute]} dropped below 0. Your party can no longer continue this campaign.`
      : 'One of your core attributes dropped below 0. Your party can no longer continue this campaign.',
    isEnding: true,
  };

  const currentScene = scenes[sceneId] ?? scenes[chapterSceneId(1)];
  const backgroundPath = getSceneBackgroundPath(currentScene.id, endingStyle);
  const overlayPath = getCharacterOverlayPath(characterId);
  const characterBackgroundPath = getCharacterBackgroundPath(characterId);

  const handleChoiceSelect = (
    nextSceneId: ChapterSceneId,
    attributeDelta: AttributeDelta,
    choiceStyle: ChoiceStyle,
  ) => {
    const nextStats = applyAttributeDelta(stats, attributeDelta);
    onStatsChange(nextStats);

    const negativeAttribute = getNegativeAttribute(nextStats);
    if (negativeAttribute) {
      setFailedAttribute(negativeAttribute);
      setSceneId(GAME_OVER_SCENE_ID);
      return;
    }

    setFailedAttribute(null);
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
        backgroundImage: `linear-gradient(rgba(10, 4, 22, 0.58), rgba(8, 2, 16, 0.72)), url(${overlayPath}), url(${backgroundPath}), url(${characterBackgroundPath})`,
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
            <button
              className="menu-button load-button"
              onClick={() => {
                onTryAnotherPath();
                onChoiceStyleProfileChange({ bold: 0, careful: 0 });
                setFailedAttribute(null);
                setSceneId(chapterSceneId(1));
              }}
            >
              Try Another Path
            </button>
            <button className="menu-button start-button" onClick={onReturnToMenu}>
              Return to Menu
            </button>
          </div>
        )}

        <button className="back-link" onClick={onReallocate} style={{ marginTop: '1rem' }}>
          Choose Different Character
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
