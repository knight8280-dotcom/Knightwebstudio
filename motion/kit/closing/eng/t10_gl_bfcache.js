// 5b. The shader layers the band and the footer carry: draws on/off screen and in a hidden tab, contexts, canvas sizes, context loss, mount/remove x10, Save-Data / no WebGL.
// 6c. A real back/forward-cache restore (own tiny server without no-store; Playwright's bfcache switch removed).
const { chromium, ARGS, BLOCK, launch, open } = require('./common');
const http = require('http'), fs = require('fs'), path = require('path');
const KIT = '/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/motion', REPO = '/home/user/Knightwebstudio';
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.ico': 'image/x-icon' };
const srv = http.createServer((req, res) => { let u = decodeURIComponent(req.url.split('?')[0]); const root = u.startsWith('/kit/') ? KIT : REPO; let f = path.join(root, path.normalize(u)); if (!f.startsWith(root)) { res.writeHead(403); return res.end(); } if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end('nf'); } res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=60' }); res.end(d); }); });
const INS = () => {
  window.__draws = 0; window.__raf = 0; window.__ctxs = [];
  const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap; ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; return o.call(this, b); };
  const r = window.requestAnimationFrame; window.requestAnimationFrame = function (f) { window.__raf++; return r.call(window, f); };
  if (window.OffscreenCanvas) { const g = OffscreenCanvas.prototype.getContext; OffscreenCanvas.prototype.getContext = function (t) { const c = g.apply(this, arguments); if (c && /webgl/.test(t)) window.__ctxs.push(c); return c; }; }
  const hg = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t) { const c = hg.apply(this, arguments); if (c && /webgl/.test(t)) window.__ctxs.push(c); return c; };
};
const rate = async (p, ms) => { const a = await p.evaluate(() => [window.__draws, window.__raf]); await p.waitForTimeout(ms); const c = await p.evaluate(() => [window.__draws, window.__raf]); return `${((c[0] - a[0]) / ms * 1000).toFixed(1)} draws/s, ${((c[1] - a[1]) / ms * 1000).toFixed(1)} rAF/s`; };
(async () => {
  await new Promise(r => srv.listen(8793, '127.0.0.1', r));
  const b = await launch();
  for (const [w, h, thr] of [[390, 844, 4], [1440, 900, 1]]) {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: h } }, init: INS });
    const s = await p.context().newCDPSession(p); await s.send('Emulation.setCPUThrottlingRate', { rate: thr });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; try { localStorage.setItem('kws-motion', 'on'); } catch (e) {} });
    await p.waitForTimeout(1500);
    const top = await rate(p, 3000);
    await p.evaluate(() => { const c = document.querySelector('.kws-close'); scrollTo(0, c.getBoundingClientRect().top + scrollY); }); await p.waitForTimeout(800);
    const band = await rate(p, 4000);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(800);
    const foot = await rate(p, 4000);
    const info = await p.evaluate(() => ({ ctxs: window.__ctxs.length, lost: window.__ctxs.filter(c => c.isContextLost()).length, canvases: [...document.querySelectorAll('.kws-shader canvas')].map(c => { const q = c.parentElement.getBoundingClientRect(); return c.width + 'x' + c.height + ' for a ' + Math.round(q.width) + 'x' + Math.round(q.height) + ' layer, ' + c.style.transform; }), live: document.querySelectorAll('.kws-shader.is-live').length }));
    // hidden tab: make the document report hidden and fire the event the script listens for
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForTimeout(400); const hidden = await rate(p, 3000);
    await p.evaluate(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(400);
    const back = await rate(p, 2000);
    console.log(`[${w}px, CPU ${thr}x] top of page (band + sky off screen): ${top} | band on screen: ${band} | page end (sky on screen): ${foot} | tab hidden: ${hidden} | visible again: ${back}\n     WebGL contexts ${info.ctxs} (lost ${info.lost}); live layers ${info.live}; canvases: ${info.canvases.join(' ; ')}`);
    // context loss at the page end
    await p.evaluate(() => { const gl = window.__ctxs[window.__ctxs.length - 1]; const x = gl.getExtension('WEBGL_lose_context'); x && x.loseContext(); }); await p.waitForTimeout(300);
    const l1 = await p.evaluate(() => ({ live: document.querySelectorAll('.kws-shader.is-live').length, skyStill: getComputedStyle(document.querySelector('.kws-skyline-sky')).backgroundImage.slice(0, 30) }));
    await p.screenshot({ path: `ctxloss-${w}.png` });
    await p.waitForTimeout(2500); await p.evaluate(() => scrollBy(0, -40)); await p.waitForTimeout(1500);
    const l2 = await p.evaluate(() => ({ live: document.querySelectorAll('.kws-shader.is-live').length, ctxs: window.__ctxs.length, lost: window.__ctxs.filter(c => c.isContextLost()).length }));
    console.log(`     context lost at the page end: right after ${JSON.stringify(l1)}; 4s later, after a nudge ${JSON.stringify(l2)}; console ${p.errs.filter(e => !/404|ERR_FAILED/.test(e)).join(' | ') || 'clean'}`);
    await p.context().close();
  }
  // mount and remove a band + footer ten times: nodes, listeners, heap, contexts
  {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: 1280, height: 900 } }, init: INS });
    const s = await p.context().newCDPSession(p); await s.send('Performance.enable'); await p.waitForTimeout(1500);
    const mem = async () => { await s.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(250); const m = (await s.send('Performance.getMetrics')).metrics; const g = n => m.find(x => x.name === n).value; return { heapMB: +(g('JSHeapUsedSize') / 1048576).toFixed(2), nodes: g('Nodes'), listeners: g('JSEventListeners') }; };
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); }); await p.waitForTimeout(800);
    const m0 = await mem();
    for (let i = 0; i < 10; i++) {
      await p.evaluate(() => { const band = document.querySelector('.kws-close'), foot = document.querySelector('footer.kws-foot'); const b2 = band.cloneNode(true), f2 = foot.cloneNode(true); for (const n of [b2, f2]) { n.querySelectorAll('canvas').forEach(c => c.remove()); n.querySelectorAll('.is-live').forEach(c => c.classList.remove('is-live')); n.querySelectorAll('[id]').forEach(e => e.removeAttribute('id')); } document.body.appendChild(b2); document.body.appendChild(f2); window.__ends = [...b2.querySelectorAll('.kws-shader'), ...f2.querySelectorAll('.kws-shader')].map(el => KWS.shader.mount(el)); window.__b2 = b2; window.__f2 = f2; scrollTo(0, document.documentElement.scrollHeight); });
      await p.waitForTimeout(450);
      await p.evaluate(i => { if (i % 2) window.__ends.forEach(f => f()); window.__b2.remove(); window.__f2.remove(); window.__b2 = window.__f2 = window.__ends = null; }, i);   // odd rounds clean up first, even rounds just remove (React-less removal)
      await p.waitForTimeout(250);
    }
    await p.waitForTimeout(800);
    const m1 = await mem(); const st = await p.evaluate(() => ({ ctxs: window.__ctxs.length, lost: window.__ctxs.filter(c => c.isContextLost()).length, canvases: document.querySelectorAll('canvas').length, live: document.querySelectorAll('.kws-shader.is-live').length }));
    console.log(`band + footer cloned in, mounted and removed 10 times: before ${JSON.stringify(m0)} | after ${JSON.stringify(m1)} | ${JSON.stringify(st)} | console ${p.errs.filter(e => !/404|ERR_FAILED/.test(e)).join(' | ') || 'clean'}`);
    await p.context().close();
  }
  // Save-Data and no WebGL: the CSS still must be the picture
  for (const [name, init, hdr] of [['Save-Data', () => { Object.defineProperty(navigator, 'connection', { get: () => ({ saveData: true }) }); }, { 'Save-Data': 'on' }], ['no WebGL', () => { const g = OffscreenCanvas.prototype.getContext; OffscreenCanvas.prototype.getContext = function (t) { return /webgl/.test(t) ? null : g.apply(this, arguments); }; }, {}]]) {
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, extraHTTPHeaders: hdr }); await c.route(BLOCK, r => r.abort()); await c.addInitScript(init);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8730/kit/closing/test/pricing-with-kit.html', { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.kws-close').scrollIntoView(); }); await p.waitForTimeout(600);
    const r = await p.evaluate(() => ({ canvases: document.querySelectorAll('.kws-shader canvas').length, live: document.querySelectorAll('.kws-shader.is-live').length, folds: getComputedStyle(document.querySelector('.kws-close')).backgroundImage.slice(0, 40), pauseShown: [...document.querySelectorAll('.kws-motion')].map(x => !x.hidden), sky: getComputedStyle(document.querySelector('.kws-skyline-sky')).backgroundImage.slice(0, 24) }));
    await p.screenshot({ path: `fallback-${name.replace(/\W/g, '')}-band.png` }); await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(400); await p.screenshot({ path: `fallback-${name.replace(/\W/g, '')}-foot.png` });
    console.log(`fallback ${name}: ${JSON.stringify(r)} errors ${errs.join('|') || 'none'}`);
    await c.close();
  }
  await b.close();
  // real bfcache
  {
    const b2 = await chromium.launch({ args: ARGS, ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    const c = await b2.newContext({ viewport: { width: 390, height: 844 } }); await c.route(BLOCK, r => r.abort()); await c.addInitScript(INS);
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://127.0.0.1:8793/kit/closing/test/pricing-with-kit.html', { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); window.__marker = 'kept'; addEventListener('pageshow', e => { window.__persisted = e.persisted; }); });
    await p.waitForTimeout(1500);
    const before = await p.evaluate(() => ({ live: document.querySelectorAll('.kws-shader.is-live').length, draws: window.__draws }));
    await p.goto('http://127.0.0.1:8793/kit/closing/portable.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
    await p.goBack({ waitUntil: 'commit' }).catch(e => console.log('goBack', String(e).slice(0, 80))); await p.waitForTimeout(1500);
    const d0 = await p.evaluate(() => window.__draws); await p.waitForTimeout(2000);
    const after = await p.evaluate(() => { const n = document.querySelector('.kws-skyline-name'); return { marker: window.__marker || 'RELOADED (not from bfcache)', persisted: window.__persisted, atEnd: Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) < 2, live: document.querySelectorAll('.kws-shader.is-live').length, draws: window.__draws, nameY: new DOMMatrix(getComputedStyle(n).transform).m42, anims: n.getAnimations().length, prog: n.getAnimations()[0] && n.getAnimations()[0].effect.getComputedTiming().progress, year: document.getElementById('year').textContent, bar: document.getElementById('mobile-cta').classList.contains('show'), pause: document.querySelector('.kws-foot .kws-motion').getAttribute('aria-label'), booking: document.querySelector('.kws-appt-btn').target }; });
    await p.screenshot({ path: 'bfcache-restored.png' });
    console.log(`bfcache restore: before ${JSON.stringify(before)} | after back ${JSON.stringify(after)}; shader draws in the 2s after restore: ${after.draws - d0}; errors ${errs.join('|') || 'none'}`);
    await b2.close();
  }
  srv.close();
})();
