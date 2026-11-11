// Read-only static server that behaves like GitHub Pages: gzip for text, max-age=600, 404.html fallback.
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = process.argv[2], PORT = +process.argv[3];
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  let f = path.join(ROOT, p); if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  let status = 200; if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { f = path.join(ROOT, '404.html'); status = 404; }
  const ext = path.extname(f); let body = fs.readFileSync(f); const h = { 'Content-Type': T[ext] || 'application/octet-stream', 'Cache-Control': 'max-age=600' };
  if (/html|css|javascript|svg|json|xml|text/.test(h['Content-Type']) && /gzip/.test(req.headers['accept-encoding'] || '')) { body = zlib.gzipSync(body, { level: 6 }); h['Content-Encoding'] = 'gzip'; }
  h['Content-Length'] = body.length; res.writeHead(status, h); res.end(body);
}).listen(PORT, '127.0.0.1', () => console.log('listening', PORT));
