// Leonida Trophy Guide — entry program (Node 22, stdlib only).
// Copies app/ and screenshots/ into the output dir, then writes
// dossier.json with the kit's buildDossier. Run with:
//   MAKEFUN_OUTPUT_DIR=/tmp/trophy-out node main.ts
// In the grader, /output is used when MAKEFUN_OUTPUT_DIR is unset.
import { buildDossier } from './vendor/makefun-frontend.ts';
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(out, { recursive: true });

for (const name of ['app', 'screenshots']) {
  const src = join(here, name);
  if (existsSync(src)) cpSync(src, join(out, name), { recursive: true });
}

// Pre-flight: fail with a useful message instead of a bare DossierError
// when the entry is incomplete (e.g. screenshots not taken yet).
import { readdirSync, statSync } from 'node:fs';
const missing = [];
if (!existsSync(join(here, 'app', 'index.html'))) missing.push('app/index.html');
if (!existsSync(join(here, 'app', 'data', 'trophies.json'))) missing.push('app/data/trophies.json');
const shotDir = join(here, 'screenshots');
const shots = existsSync(shotDir)
  ? readdirSync(shotDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  : [];
if (shots.length === 0) missing.push('screenshots/ (take at least one render of the guide)');
if (missing.length > 0) {
  console.error('entry incomplete — missing: ' + missing.join(', '));
  process.exit(1);
}

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000
};

const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);
const appFiles = readdirSync(join(out, 'app'), { recursive: true })
  .filter((f) => statSync(join(out, 'app', String(f))).isFile()).length;
console.log('wrote ' + join(out, 'dossier.json') + ' (' + dossier.length + ' bytes, ' +
  appFiles + ' app files, ' + shots.length + ' screenshots)');
