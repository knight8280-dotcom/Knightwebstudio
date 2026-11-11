// A pass-through to the kit server that drops "Cache-Control: no-store", so the back-forward cache is allowed. Port 8741.
const http = require('http');
http.createServer((req, res) => { const up = http.request({ host: '127.0.0.1', port: 8730, path: req.url, method: req.method, headers: req.headers }, r => { const h = { ...r.headers }; delete h['cache-control']; res.writeHead(r.statusCode, h); r.pipe(res); }); up.on('error', () => { res.writeHead(502); res.end(); }); req.pipe(up); }).listen(8741, '127.0.0.1');
