import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const backgroundsDir = path.join(projectRoot, 'public', 'backgrounds');

function generateWarriorBackground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="warSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a3f5f"/>
        <stop offset="50%" stop-color="#5a6f8f"/>
        <stop offset="100%" stop-color="#8a5f3f"/>
      </linearGradient>
      <linearGradient id="warGround" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4a3f2f"/>
        <stop offset="100%" stop-color="#2a1f1f"/>
      </linearGradient>
      <filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#warSky)"/>
    <rect y="700" width="1920" height="380" fill="url(#warGround)"/>
    <polygon points="0,800 400,400 800,700 1920,500 1920,1080 0,1080" fill="#3a3a3a" opacity="0.8"/>
    <polygon points="200,900 600,500 950,850 1920,600 1920,1080 0,1080" fill="#4a4a4a" opacity="0.6"/>
    <rect x="800" y="500" width="320" height="400" fill="#5a5a5a"/>
    <rect x="850" y="480" width="220" height="50" fill="#7a7a7a"/>
    <rect x="950" y="300" width="120" height="400" fill="#6a6a6a"/>
    <polygon points="950,300 1010,200 1070,300" fill="#5a5a5a"/>
    <rect x="970" y="350" width="20" height="25" fill="#ff6b35" filter="url(#glow)"/>
    <rect x="1010" y="350" width="20" height="25" fill="#ff6b35" filter="url(#glow)"/>
    <rect x="970" y="430" width="20" height="25" fill="#ff6b35" filter="url(#glow)"/>
    <rect x="1010" y="430" width="20" height="25" fill="#ff6b35" filter="url(#glow)"/>
    <path d="M 950 320 L 950 320 Q 980 330 1000 320" stroke="#ff6b35" stroke-width="15" fill="none"/>
    <path d="M 1020 320 L 1020 320 Q 1050 330 1070 320" stroke="#8b0000" stroke-width="15" fill="none"/>
    <circle cx="800" cy="480" r="8" fill="#ff6b35" filter="url(#glow)"/>
    <circle cx="1120" cy="480" r="8" fill="#ff6b35" filter="url(#glow)"/>
    <path d="M 800 475 Q 795 460 800 445 Q 805 460 800 475" fill="#ff6b35" opacity="0.7"/>
    <path d="M 1120 475 Q 1115 460 1120 445 Q 1125 460 1120 475" fill="#ff6b35" opacity="0.7"/>
    <ellipse cx="300" cy="150" rx="150" ry="60" fill="#a0a0a0" opacity="0.4"/>
    <ellipse cx="1600" cy="200" rx="200" ry="70" fill="#808080" opacity="0.3"/>
  </svg>`;
}

function generateDiplomatBackground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="hallSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#e8d5c4"/>
        <stop offset="100%" stop-color="#d4a574"/>
      </linearGradient>
      <linearGradient id="marble" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f5f5f0" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#e0ddd6"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#hallSky)"/>
    <rect y="700" width="1920" height="380" fill="url(#marble)"/>
    <g opacity="0.3">
      <line x1="0" y1="700" x2="1920" y2="700" stroke="#8b7355" stroke-width="2"/>
      <line x1="0" y1="750" x2="1920" y2="750" stroke="#8b7355" stroke-width="1"/>
      <line x1="0" y1="800" x2="1920" y2="800" stroke="#8b7355" stroke-width="1"/>
    </g>
    <rect x="200" y="350" width="60" height="730" fill="#c9a780"/>
    <rect x="850" y="350" width="60" height="730" fill="#c9a780"/>
    <rect x="1500" y="350" width="60" height="730" fill="#c9a780"/>
    <polygon points="200,340 980,340 1020,360 220,360" fill="#b8956a"/>
    <polygon points="850,340 1630,340 1670,360 870,360" fill="#b8956a"/>
    <path d="M 500 200 L 500 450 L 450 450 L 450 200" fill="#d4af37" opacity="0.9"/>
    <path d="M 500 200 L 500 450 L 550 450 L 550 200" fill="#8b4513" opacity="0.9"/>
    <circle cx="500" cy="280" r="40" fill="#e8d5c4" opacity="0.8"/>
    <text x="1000" y="300" font-size="80" font-family="serif" fill="#8b4513" opacity="0.6">Nobility</text>
    <circle cx="100" cy="400" r="15" fill="#ff6b35" opacity="0.8"/>
    <circle cx="1820" cy="400" r="15" fill="#ff6b35" opacity="0.8"/>
    <path d="M 300 600 Q 400 550 500 600" stroke="#8b4513" stroke-width="3" fill="none" opacity="0.5"/>
    <path d="M 1700 600 Q 1600 550 1500 600" stroke="#8b4513" stroke-width="3" fill="none" opacity="0.5"/>
  </svg>`;
}

function generateGuardianBackground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="forestSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#87ceeb"/>
        <stop offset="50%" stop-color="#a8d8f1"/>
        <stop offset="100%" stop-color="#b8e6bd"/>
      </linearGradient>
      <linearGradient id="forest" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2d5016"/>
        <stop offset="100%" stop-color="#1a3a0f"/>
      </linearGradient>
    </defs>
    <rect width="1920" height="1080" fill="url(#forestSky)"/>
    <rect y="600" width="1920" height="480" fill="url(#forest)"/>
    <ellipse cx="200" cy="400" rx="80" ry="120" fill="#1a4d1f"/>
    <ellipse cx="500" cy="350" rx="100" ry="150" fill="#1a5a2a"/>
    <ellipse cx="900" cy="380" rx="90" ry="140" fill="#1a4d1f"/>
    <ellipse cx="1400" cy="340" rx="110" ry="160" fill="#1a5a2a"/>
    <ellipse cx="1800" cy="360" rx="85" ry="130" fill="#1a4d1f"/>
    <rect x="180" y="500" width="40" height="200" fill="#6b4423"/>
    <rect x="480" y="480" width="40" height="220" fill="#6b4423"/>
    <rect x="880" y="490" width="40" height="210" fill="#6b4423"/>
    <rect x="1380" y="480" width="40" height="220" fill="#6b4423"/>
    <rect x="1780" y="490" width="40" height="210" fill="#6b4423"/>
    <circle cx="960" cy="650" r="150" fill="none" stroke="#8fbc8f" stroke-width="3" opacity="0.6"/>
    <circle cx="960" cy="700" r="20" fill="#ff6b35" opacity="0.7"/>
    <circle cx="950" cy="680" r="15" fill="#ff8c42" opacity="0.6"/>
    <circle cx="970" cy="680" r="15" fill="#ff8c42" opacity="0.6"/>
    <circle cx="750" cy="680" r="8" fill="#8b8b8b"/>
    <circle cx="1170" cy="680" r="8" fill="#8b8b8b"/>
    <circle cx="1170" cy="660" r="8" fill="#8b8b8b"/>
    <circle cx="750" cy="660" r="8" fill="#8b8b8b"/>
    <circle cx="1600" cy="150" r="80" fill="#ffeb3b" opacity="0.4"/>
  </svg>`;
}

function generateMysticBackground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
    <defs>
      <radialGradient id="mysticVoid" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#2a1a4a"/>
        <stop offset="100%" stop-color="#0f0820"/>
      </radialGradient>
      <filter id="glow2"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#mysticVoid)"/>
    <polygon points="600,200 1320,200 1400,900 520,900" fill="#1a1a4a" opacity="0.6"/>
    <rect x="700" y="300" width="80" height="600" fill="#2a2a5a"/>
    <rect x="1140" y="300" width="80" height="600" fill="#2a2a5a"/>
    <circle cx="740" cy="500" r="25" fill="none" stroke="#7c3aed" stroke-width="2" filter="url(#glow2)"/>
    <path d="M 740 480 L 740 520 M 720 500 L 760 500" stroke="#7c3aed" stroke-width="2" filter="url(#glow2)"/>
    <circle cx="1180" cy="500" r="25" fill="none" stroke="#d946ef" stroke-width="2" filter="url(#glow2)"/>
    <path d="M 1180 480 L 1180 520 M 1160 500 L 1200 500" stroke="#d946ef" stroke-width="2" filter="url(#glow2)"/>
    <circle cx="400" cy="300" r="20" fill="#7c3aed" opacity="0.6" filter="url(#glow2)"/>
    <circle cx="1520" cy="350" r="25" fill="#d946ef" opacity="0.5" filter="url(#glow2)"/>
    <circle cx="960" cy="200" r="18" fill="#a78bfa" opacity="0.6" filter="url(#glow2)"/>
    <path d="M 400 300 Q 600 250 800 300" stroke="#7c3aed" stroke-width="2" fill="none" opacity="0.4"/>
    <path d="M 1520 350 Q 1300 380 1100 350" stroke="#d946ef" stroke-width="2" fill="none" opacity="0.4"/>
    <path d="M 960 200 Q 900 400 1000 600" stroke="#a78bfa" stroke-width="2" fill="none" opacity="0.3"/>
    <circle cx="960" cy="550" r="120" fill="none" stroke="#7c3aed" stroke-width="2" opacity="0.6"/>
    <circle cx="960" cy="550" r="100" fill="none" stroke="#d946ef" stroke-width="1" opacity="0.4"/>
    <circle cx="300" cy="150" r="3" fill="#ffd700"/>
    <circle cx="900" cy="100" r="2" fill="#ffd700"/>
    <circle cx="1600" cy="120" r="3" fill="#ffd700"/>
    <circle cx="500" cy="80" r="2" fill="#ffd700"/>
    <circle cx="1200" cy="150" r="2" fill="#ffd700"/>
  </svg>`;
}

function generateRogueBackground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#1a1a3a"/>
        <stop offset="100%" stop-color="#3a3a5a"/>
      </linearGradient>
      <linearGradient id="rooftops" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#2a2a3a"/>
        <stop offset="50%" stop-color="#1a1a2a"/>
        <stop offset="100%" stop-color="#2a2a3a"/>
      </linearGradient>
      <filter id="moonGlow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#nightSky)"/>
    <polygon points="0,500 200,400 500,450 800,350 1100,420 1400,380 1700,450 1920,400 1920,1080 0,1080" fill="url(#rooftops)"/>
    <polygon points="100,500 300,350 400,500" fill="#1a1a2a"/>
    <polygon points="600,450 900,280 1000,450" fill="#2a2a3a"/>
    <polygon points="1200,420 1500,300 1600,420" fill="#1a1a2a"/>
    <rect x="150" y="420" width="15" height="15" fill="#0a0a1a"/>
    <rect x="180" y="420" width="15" height="15" fill="#ffd700" opacity="0.6"/>
    <rect x="210" y="420" width="15" height="15" fill="#0a0a1a"/>
    <rect x="650" y="350" width="15" height="15" fill="#ffd700" opacity="0.4"/>
    <rect x="1250" y="340" width="15" height="15" fill="#0a0a1a"/>
    <rect x="1280" y="340" width="15" height="15" fill="#ffd700" opacity="0.5"/>
    <rect x="280" y="320" width="25" height="80" fill="#3a3a4a"/>
    <rect x="950" y="260" width="25" height="90" fill="#3a3a4a"/>
    <rect x="1550" y="300" width="25" height="80" fill="#3a3a4a"/>
    <circle cx="1700" cy="150" r="80" fill="#e8e8d0" opacity="0.9" filter="url(#moonGlow)"/>
    <circle cx="1680" cy="130" r="8" fill="#d0d0b8" opacity="0.6"/>
    <circle cx="1720" cy="160" r="6" fill="#d0d0b8" opacity="0.6"/>
    <ellipse cx="960" cy="900" rx="500" ry="100" fill="#000000" opacity="0.2"/>
    <circle cx="250" cy="100" r="1.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="600" cy="80" r="1" fill="#ffffff" opacity="0.6"/>
    <circle cx="1100" cy="120" r="1.5" fill="#ffffff" opacity="0.7"/>
    <circle cx="1400" cy="90" r="1" fill="#ffffff" opacity="0.5"/>
  </svg>`;
}

function generateScholarBackground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
    <defs>
      <linearGradient id="libraryAmbient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8b7355"/>
        <stop offset="50%" stop-color="#a0826d"/>
        <stop offset="100%" stop-color="#5a4a3a"/>
      </linearGradient>
      <linearGradient id="bookShelf" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#6b4423"/>
        <stop offset="100%" stop-color="#4a3020"/>
      </linearGradient>
      <filter id="candleGlow"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>
    <rect width="1920" height="1080" fill="url(#libraryAmbient)"/>
    <rect x="100" y="200" width="400" height="880" fill="url(#bookShelf)"/>
    <rect x="1420" y="200" width="400" height="880" fill="url(#bookShelf)"/>
    <line x1="100" y1="400" x2="500" y2="400" stroke="#8b4513" stroke-width="8"/>
    <line x1="100" y1="600" x2="500" y2="600" stroke="#8b4513" stroke-width="8"/>
    <line x1="100" y1="800" x2="500" y2="800" stroke="#8b4513" stroke-width="8"/>
    <line x1="1420" y1="400" x2="1820" y2="400" stroke="#8b4513" stroke-width="8"/>
    <line x1="1420" y1="600" x2="1820" y2="600" stroke="#8b4513" stroke-width="8"/>
    <line x1="1420" y1="800" x2="1820" y2="800" stroke="#8b4513" stroke-width="8"/>
    <rect x="120" y="320" width="40" height="70" fill="#8b0000"/>
    <rect x="170" y="340" width="35" height="50" fill="#1a4d2e"/>
    <rect x="215" y="330" width="38" height="60" fill="#8b6914"/>
    <rect x="265" y="350" width="35" height="40" fill="#4a1f4a"/>
    <rect x="310" y="325" width="40" height="65" fill="#1f1f4a"/>
    <rect x="1440" y="320" width="40" height="70" fill="#8b0000"/>
    <rect x="1490" y="340" width="35" height="50" fill="#1a4d2e"/>
    <rect x="1535" y="330" width="38" height="60" fill="#8b6914"/>
    <rect x="650" y="400" width="620" height="500" fill="#a0826d" opacity="0.3"/>
    <rect x="700" y="550" width="520" height="300" fill="#6b4423" opacity="0.7"/>
    <polygon points="800,600 1100,600 1095,700 805,700" fill="#f5deb3"/>
    <line x1="950" y1="600" x2="950" y2="700" stroke="#8b4513" stroke-width="2"/>
    <circle cx="750" cy="550" r="12" fill="#ffd700" filter="url(#candleGlow)"/>
    <circle cx="1150" cy="550" r="12" fill="#ffd700" filter="url(#candleGlow)"/>
    <rect x="740" y="560" width="20" height="40" fill="#8b4513"/>
    <rect x="1140" y="560" width="20" height="40" fill="#8b4513"/>
    <circle cx="1250" cy="620" r="15" fill="#f5deb3" opacity="0.9"/>
    <circle cx="1200" cy="630" r="12" fill="#e6d4a8" opacity="0.8"/>
    <line x1="850" y1="580" x2="880" y2="550" stroke="#8b4513" stroke-width="3"/>
    <circle cx="880" cy="550" r="6" fill="#1a1a1a"/>
  </svg>`;
}

const CHARACTER_OVERLAYS = {
  warrior: {
    c1: '#ffb27a',
    c2: '#bf3f1f',
    symbol: 'M40 380 L240 40 L440 380 Z',
  },
  diplomat: {
    c1: '#ffe6a3',
    c2: '#c48b2a',
    symbol: 'M80 220 Q240 60 400 220 Q240 380 80 220 Z',
  },
  guardian: {
    c1: '#b8ffe1',
    c2: '#2f8f66',
    symbol: 'M240 40 L420 120 L420 280 Q240 420 60 280 L60 120 Z',
  },
  mystic: {
    c1: '#e8c7ff',
    c2: '#6f3fa8',
    symbol: 'M240 30 L420 210 L240 390 L60 210 Z',
  },
  rogue: {
    c1: '#c7ffe8',
    c2: '#2f8a6d',
    symbol: 'M60 320 L420 80 L300 380 Z',
  },
  scholar: {
    c1: '#d3e7ff',
    c2: '#346ca8',
    symbol: 'M80 60 H400 V320 H80 Z',
  },
};

function overlaySvg({ c1, c2, symbol }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <radialGradient id="rg" cx="70%" cy="20%" r="85%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${c2}" stop-opacity="0.7"/>
      </radialGradient>
      <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${c2}" stop-opacity="0.38"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#rg)"/>
    <path d="M0 512 L170 260 L320 420 L512 120 L512 512 Z" fill="url(#lg)"/>
    <path d="${symbol}" fill="${c1}" fill-opacity="0.22"/>
  </svg>`;
}

async function convertSvgsToWebp() {
  const files = await readdir(backgroundsDir);
  const svgFiles = files.filter((file) => file.endsWith('.svg'));

  await Promise.all(
    svgFiles.map(async (fileName) => {
      const svgPath = path.join(backgroundsDir, fileName);
      const webpPath = path.join(backgroundsDir, fileName.replace(/\.svg$/, '.webp'));
      const content = await readFile(svgPath);

      await sharp(content)
        .resize(1920, 1080, { fit: 'cover' })
        .webp({ quality: 90 })
        .toFile(webpPath);
    }),
  );
}

async function buildCharacterBackgrounds() {
  const backgrounds = {
    warrior: generateWarriorBackground(),
    diplomat: generateDiplomatBackground(),
    guardian: generateGuardianBackground(),
    mystic: generateMysticBackground(),
    rogue: generateRogueBackground(),
    scholar: generateScholarBackground(),
  };

  await Promise.all(
    Object.entries(backgrounds).map(async ([characterId, svg]) => {
      const svgPath = path.join(backgroundsDir, `bg-${characterId}.svg`);
      const webpPath = path.join(backgroundsDir, `bg-${characterId}.webp`);

      await writeFile(svgPath, svg, 'utf8');
      await sharp(Buffer.from(svg))
        .resize(1920, 1080, { fit: 'cover' })
        .webp({ quality: 90 })
        .toFile(webpPath);
    }),
  );
}

async function buildCharacterOverlays() {
  await Promise.all(
    Object.entries(CHARACTER_OVERLAYS).map(async ([characterId, config]) => {
      const svg = overlaySvg(config);
      const svgPath = path.join(backgroundsDir, `overlay-${characterId}.svg`);
      const webpPath = path.join(backgroundsDir, `overlay-${characterId}.webp`);

      await writeFile(svgPath, svg, 'utf8');
      await sharp(Buffer.from(svg))
        .resize(1920, 1080, { fit: 'cover' })
        .webp({ quality: 86 })
        .toFile(webpPath);
    }),
  );
}

async function main() {
  await convertSvgsToWebp();
  await buildCharacterBackgrounds();
  await buildCharacterOverlays();
  console.log('✨ Story backgrounds generated with character-specific themes and overlays.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
