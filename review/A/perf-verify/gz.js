// Static server with gzip for text (as GitHub Pages serves), for throttled runs. node gz.js ROOT PORT
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = process.argv[2], PORT = +process.argv[3];
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  const ext = path.extname(f); let body = fs.readFileSync(f); const h = { 'content-type': T[ext] || 'application/octet-stream', 'cache-control': 'max-age=600' };
  if (/\.(html|css|js|svg|json|xml|txt|webmanifest)$/.test(f) && /gzip/.test(req.headers['accept-encoding'] || '')) { body = zlib.gzipSync(body, { level: 6 }); h['content-encoding'] = 'gzip'; }
  h['content-length'] = body.length; res.writeHead(200, h); res.end(body);
}).listen(PORT);
