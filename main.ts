// Sizzle Station — the hand-in program (Node 22, standard library only).
// It stages this repository's game/ and screenshots/ into the output folder
// and asks the vendored make.fun library to write the dossier the judge reads.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR set:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

const shotsDir = join(outputDir, 'screenshots');
// Clear a stale screenshots folder first, so a re-run never ships an image
// the repository no longer holds (the grader runs twice into a fresh folder,
// but a local re-run into the same folder must stay honest too).
rmSync(shotsDir, { recursive: true, force: true });
mkdirSync(shotsDir, { recursive: true });
const repoShots = join(repoRoot, 'screenshots');
if (existsSync(repoShots)) cpSync(repoShots, shotsDir, { recursive: true });

// Same caps the sealed gate enforces, so a local run refuses exactly what the
// grader would refuse: at most 4 screenshots of 256 KiB, game/ under 993
// files and 48 MiB, paths under 1,000 bytes, dossier text under 160 KiB.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
