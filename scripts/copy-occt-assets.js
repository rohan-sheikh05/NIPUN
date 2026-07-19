// Copies the occt-import-js WASM runtime into public/ so it's served as a
// static asset. Runs automatically on `npm install` (see package.json).
// Safe to re-run any time — e.g. after bumping the occt-import-js version.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'node_modules', 'occt-import-js', 'dist');
const destDir = join(__dirname, '..', 'public', 'occt');

const files = ['occt-import-js.js', 'occt-import-js.wasm', 'occt-import-js-worker.js'];

if (!existsSync(srcDir)) {
  console.warn('[copy-occt-assets] occt-import-js not found in node_modules — skipping.');
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });

for (const file of files) {
  copyFileSync(join(srcDir, file), join(destDir, file));
}

console.log(`[copy-occt-assets] copied ${files.length} files to public/occt/`);
