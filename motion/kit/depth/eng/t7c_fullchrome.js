// Back-forward cache and hidden-tab behaviour in the full Chromium build (new headless), where both exist.
const { chromium, log, ok, cur, settle, jump } = require('./lib');
require('./proxy');
(async () => {
  const D = 'http://localhost:8741/kit/depth/demo.html';
  const b = await chromium.launch({ channel: 'chromium', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
  log('browser: ' + b.version());
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => { window.__run = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => /kit\/depth\/(cylinder|ring)\.js/.test(new Error().stack) ? r.call(window, t => { window.__run++; f(t); }) : r.call(window, f); });
  const f = await ctx.newPage(); const errs = []; f.on('pageerror', e => errs.push(String(e)));
  await f.goto(D, { waitUntil: 'load' }); await f.waitForTimeout(500);
  await jump(f, '#included .kws-ring', -300); await f.waitForTimeout(600);
  await f.evaluate(() => { window.__mark = 1; window.addEventListener('pageshow', e => { window.__persisted = e.persisted; }); document.querySelector('#how .kws-cyl-nav:last-child').click(); scrollBy(0, 150); });
  await f.waitForTimeout(60);
  await f.goto('http://localhost:8741/kit/depth/test/bare.html'); await f.waitForTimeout(600); await f.goBack({ waitUntil: 'commit', timeout: 5000 }).catch(() => {}); await f.waitForTimeout(1500);
  const bf = await f.evaluate(() => ({ persisted: window.__persisted, sameDoc: window.__mark === 1, live: document.querySelectorAll('.is-live').length, moving: document.querySelectorAll('.is-moving').length, on: [...document.querySelectorAll('#how .kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), tOn: document.querySelector('#how .kws-cyl-card.is-on').style.transform, ctl: document.querySelectorAll('#how .kws-cyl-ctl').length, hubs: document.querySelectorAll('#included .kws-ring-hub').length }));
  await f.evaluate(() => document.querySelector('#how .kws-cyl-nav:last-child').click()); await settle(f, '#how .kws-cyl'); const after = await cur(f, '#how .kws-cyl');
  const h0 = await f.evaluate(() => document.querySelector('#included .kws-ring-hub').style.transform); await f.evaluate(() => scrollBy(0, 200)); await f.waitForTimeout(800); const h1 = await f.evaluate(() => document.querySelector('#included .kws-ring-hub').style.transform);
  ok(bf.persisted === true && bf.live === 4 && bf.moving === 0 && bf.tOn === 'none' && bf.ctl === 1 && bf.hubs === 1 && after === (bf.on + 1) % 5 && h0 !== h1 && !errs.length, 'back-forward cache: left mid-turn, came back: the turn finished, one set of controls, both still work', JSON.stringify(bf) + ` next > ${after}; ring turns: ${h0 !== h1}; errors: ${errs.join('|') || 'none'}`);

  // hidden tab: open a second tab in front
  await jump(f, '#included .kws-ring', -200); await f.waitForTimeout(600);
  const p2 = await ctx.newPage(); await p2.goto('about:blank'); await p2.bringToFront(); await p2.waitForTimeout(500);
  const vis = await f.evaluate(() => document.visibilityState);
  const r0 = await f.evaluate(() => { const n = window.__run; scrollBy(0, 300); document.querySelector('#how .kws-cyl-nav:last-child').click(); return n; });
  await p2.waitForTimeout(3000);
  const r1 = await f.evaluate(() => window.__run);
  ok(vis === 'hidden' && r1 - r0 === 0, 'tab in the background: no kit frame callbacks run', `visibilityState "${vis}"; frames run in 3s after a scroll and a Next press: ${r1 - r0}`);
  await f.bringToFront(); await f.waitForTimeout(1500);
  const s = await f.evaluate(() => ({ vis: document.visibilityState, moving: document.querySelectorAll('.is-moving').length, t: document.querySelector('#how .kws-cyl-card.is-on').style.transform, run: window.__run }));
  ok(s.moving === 0 && s.t === 'none', 'back to the front: the pending turn completes and everything settles', JSON.stringify(s) + ` (${s.run - r1} frames after returning)`);
  await b.close(); process.exit(0);
})().catch(e => { console.log('ERR ' + e.message.slice(0, 400)); process.exit(1); });
