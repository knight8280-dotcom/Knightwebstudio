// A real bfcache hit: full Chromium (new headless), no request interception, own server without no-store.
const { chromium, ARGS } = require('./common');
const http = require('http'), fs = require('fs'), path = require('path');
const KIT = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/motion', REPO = '/home/user/Knightwebstudio';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); const root = u.startsWith('/kit/') ? KIT : REPO; let f = path.join(root, path.normalize(u)); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end('nf'); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=60' }); res.end(d); }); });
(async () => {
  await new Promise(r => srv.listen(8794, '127.0.0.1', r));
  for (const opt of [{ channel: 'chromium' }, {}]) {
    let b; try { b = await chromium.launch(Object.assign({ args: ARGS.concat(['--enable-features=BackForwardCache']), ignoreDefaultArgs: ['--disable-back-forward-cache'] }, opt)); } catch (e) { console.log('launch failed', JSON.stringify(opt), String(e).split('\n')[0].slice(0, 120)); continue; }
    const c = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8794/kit/closing/test/pricing-with-kit.html', { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); window.__marker = 'kept'; addEventListener('pageshow', e => { window.__persisted = e.persisted; }); });
    await p.waitForTimeout(1200);
    await p.evaluate(() => { location.href = '/kit/closing/portable.html'; }); await p.waitForTimeout(1200);
    await p.evaluate(() => history.back()); await p.waitForTimeout(2000);
    const after = await p.evaluate(() => { const n = document.querySelector('.kws-skyline-name'); return { marker: window.__marker || 'RELOADED', persisted: window.__persisted, atEnd: Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) < 2, live: document.querySelectorAll('.kws-shader.is-live').length, nameY: new DOMMatrix(getComputedStyle(n).transform).m42, prog: n.getAnimations()[0] && n.getAnimations()[0].effect.getComputedTiming().progress, year: document.getElementById('year').textContent, bar: document.getElementById('mobile-cta').classList.contains('show'), booking: document.querySelector('.kws-appt-btn').href }; }).catch(e => ({ err: String(e).slice(0, 100) }));
    console.log(JSON.stringify(opt), b.version(), JSON.stringify(after), errs.join('|') || 'no errors');
    await b.close();
  }
  srv.close();
})();
