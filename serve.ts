// Leonida Trophy Guide — tiny static server for local testing.
// Serves app/ as the web root on port 8080 (NOT the repo root,
// so relative links resolve exactly as they do offline).
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(join(new URL('.', import.meta.url).pathname, 'app'));
const PORT = Number(process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url || '/', 'http://x').pathname))
    .replace(/^(\.\.[/\\])+/, '');
  let file = join(root, path === sep ? 'index.html' : path);
  if (!file.startsWith(root)) { res.writeHead(403); res.end('forbidden'); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log('Leonida Trophy Guide at http://localhost:' + PORT + '/'));
