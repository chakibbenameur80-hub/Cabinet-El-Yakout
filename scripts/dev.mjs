import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };

export function serve(root = path.resolve('dist'), port = 4173) {
  const server = http.createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      const st = await fs.stat(file).catch(() => null);
      if (st?.isDirectory()) {
        if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' }).end(); return; }
        file = path.join(file, 'index.html');
      }
      const data = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(data);
    } catch {
      const nf = await fs.readFile(path.join(root, '404.html')).catch(() => 'Not found');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(nf);
    }
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await serve();
  console.log('Serving dist/ on http://localhost:4173');
}
