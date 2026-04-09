import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const backgroundsDir = path.join(projectRoot, 'public', 'backgrounds');

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
  await buildCharacterOverlays();
  console.log('Story backgrounds generated as WebP with character overlays.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
