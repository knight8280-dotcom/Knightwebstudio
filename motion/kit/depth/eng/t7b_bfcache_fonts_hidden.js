const { chromium, log, ok, cur, settle, jump } = require('./lib');
require('./proxy');
(async () => {
  const D = 'http://localhost:8741/kit/depth/demo.html';
  // ---- back-forward cache (Playwright turns it off by default; turn it back on)
  const b = await chromium.launch({ ignoreDefaultArgs: ['--disable-back-forward-cache'], args: ['--enable-features=BackForwardCache'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const f = await ctx.newPage(); const errs = []; f.on('pageerror', e => errs.push(String(e)));
  await f.goto(D, { waitUntil: 'load' }); await f.waitForTimeout(500);
  await jump(f, '#included .kws-ring', -300); await f.waitForTimeout(600);
  await f.evaluate(() => { window.__mark = 1; window.addEventListener('pageshow', e => { window.__persisted = e.persisted; }); document.querySelector('#how .kws-cyl-nav:last-child').click(); scrollBy(0, 150); });   // leave while both are moving
  await f.waitForTimeout(60);
  await f.goto('http://localhost:8741/kit/depth/test/bare.html'); await f.waitForTimeout(500); await f.goBack(); await f.waitForTimeout(1500);
  const bf = await f.evaluate(() => ({ persisted: window.__persisted, sameDoc: window.__mark === 1, live: document.querySelectorAll('.is-live').length, moving: document.querySelectorAll('.is-moving').length, on: [...document.querySelectorAll('#how .kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), tOn: document.querySelector('#how .kws-cyl-card.is-on').style.transform, ctl: document.querySelectorAll('#how .kws-cyl-ctl').length, hubs: document.querySelectorAll('#included .kws-ring-hub').length }));
  await f.evaluate(() => document.querySelector('#how .kws-cyl-nav:last-child').click()); await settle(f, '#how .kws-cyl'); const after = await cur(f, '#how .kws-cyl');
  const h0 = await f.evaluate(() => document.querySelector('#included .kws-ring-hub').style.transform); await f.evaluate(() => scrollBy(0, 200)); await f.waitForTimeout(800); const h1 = await f.evaluate(() => document.querySelector('#included .kws-ring-hub').style.transform);
  ok(bf.persisted === true && bf.live === 4 && bf.moving === 0 && bf.tOn === 'none' && bf.ctl === 1 && bf.hubs === 1 && after === (bf.on + 1) % 5 && h0 !== h1 && !errs.length, 'back-forward cache: left mid-turn, came back: the turn finished, one set of controls, both still work', JSON.stringify(bf) + ` next > ${after}; ring turns: ${h0 !== h1}; errors: ${errs.join('|') || 'none'}`);
  await ctx.close(); await b.close();

  // ---- fonts late or missing: does the component's size depend on the web font?
  const b2 = await chromium.launch();
  const sizes = async block => { const c = await b2.newContext({ viewport: { width: 390, height: 844 } }); if (block) await c.route(/\.woff2/, r => r.abort()); const p = await c.newPage(); await p.goto('http://localhost:8730/kit/depth/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(700); const r = await p.evaluate(() => ({ cyl: Math.round(document.querySelector('#how .kws-cyl').getBoundingClientRect().height), ring: Math.round(document.querySelector('#included .kws-ring').getBoundingClientRect().height), stage: Math.round(document.querySelector('#included .kws-ring-stage').getBoundingClientRect().height), sw: document.documentElement.scrollWidth - innerWidth, fonts: [...document.fonts].filter(f => f.status === 'loaded').length })); await c.close(); return r; };
  const withF = await sizes(false), noF = await sizes(true);
  log(`INFO  fonts: with the web fonts ${JSON.stringify(withF)}; with every font file blocked ${JSON.stringify(noF)} (difference when a font arrives late: drum ${withF.cyl - noF.cyl}px, ring block ${withF.ring - noF.ring}px; the ring stage itself ${withF.stage - noF.stage}px)`);

  // ---- hidden tab: minimise the window (headed semantics via CDP) and count kit frames that run
  const c = await b2.newContext({ viewport: { width: 1280, height: 800 } });
  await c.addInitScript(() => { window.__run = 0; const r = window.requestAnimationFrame; window.requestAnimationFrame = f => /kit\/depth\/(cylinder|ring)\.js/.test(new Error().stack) ? r.call(window, t => { window.__run++; f(t); }) : r.call(window, f); });
  const p = await c.newPage(); await p.goto('http://localhost:8730/kit/depth/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const cdp = await c.newCDPSession(p);
  await jump(p, '#included .kws-ring', -200); await p.waitForTimeout(500);
  let how = 'Page.setWebLifecycleState frozen';
  try { await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false }); const { windowId } = await cdp.send('Browser.getWindowForTarget'); await cdp.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } }); how = 'window minimised'; } catch (e) { how = 'minimise not available (' + e.message.slice(0, 60) + ')'; }
  await p.waitForTimeout(400);
  const vis = await p.evaluate(() => document.visibilityState);
  const r0 = await p.evaluate(() => { const n = window.__run; scrollBy(0, 300); document.querySelector('#how .kws-cyl-nav:last-child').click(); return n; });
  await new Promise(r => setTimeout(r, 2500));
  const r1 = await p.evaluate(() => window.__run);
  log(`INFO  hidden tab (${how}; visibilityState "${vis}"): kit frame callbacks that ran in 2.5s after a scroll and a Next press: ${r1 - r0}`);
  await c.close(); await b2.close(); process.exit(0);
})();
