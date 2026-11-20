import { buildDossier } from './vendor/makefun-frontend.ts';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

for (const dir of ['app', 'screenshots']) {
  const src = join(root, dir);
  if (existsSync(src)) {
    mkdirSync(join(out, dir), { recursive: true });
    cpSync(src, join(out, dir), { recursive: true });
  }
}

const dossier = buildDossier(out, caps);
const { writeFileSync } = await import('node:fs');
writeFileSync(join(out, 'dossier.json'), dossier);
console.log('dossier.json written to', join(out, 'dossier.json'));
