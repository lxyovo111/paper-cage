// server.mjs — 开发用静态服务器（node，无需 Python）。生产走创空间 gradio 壳。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8', '.png':'image/png', '.svg':'image/svg+xml',
  '.json':'application/json; charset=utf-8', '.woff2':'font/woff2', '.ttf':'font/ttf',
  '.mp3':'audio/mpeg', '.wav':'audio/wav', '.m4a':'audio/mp4' };
const port = +(process.env.PORT || 7861);

http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p.indexOf('/static/') === 0) p = p.slice(7);  // 与创空间一致：/static 映射项目根
  if (p === '/') p = '/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root)) { res.writeHead(403).end('no'); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type':'text/plain; charset=utf-8' }).end('404 ' + p); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control':'no-store' });
    res.end(buf);
  });
}).listen(port, () => console.log('http://127.0.0.1:' + port));
