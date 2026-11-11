// 2. Reduced motion and html[data-motion="off"]; frames while idle, off screen, hidden tab; pause mid-turn; resume.
const { chromium, DEMO, ONE, log, ok, open, jump, cur, settle } = require('./lib');
const CYL = '#how .kws-cyl', RING = '#included .kws-ring';
const ringT = p => p.evaluate(s => { const el = document.querySelector(s); return [el.querySelector('.kws-ring-hub').style.transform, ...[...el.querySelectorAll('.kws-ring-card')].map(c => c.className + c.style.transform)].join('~'); }, RING);
const anims = p => p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => (a.animationName || a.transitionProperty) + ' on ' + (a.effect.target && a.effect.target.className)).join(', '));
(async () => {
  const b = await chromium.launch();
  for (const mode of ['rm', 'paused']) {
    const p = await open(b, DEMO, { w: 390, h: 844, touch: true, rm: mode === 'rm', init: mode === 'paused' ? 'document.documentElement.setAttribute("data-motion","off")' : '' });
    const cdp = await p.ctx.newCDPSession(p);
    const name = mode === 'rm' ? 'reduced motion' : 'data-motion=off';
    // complete?
    const c = await p.evaluate(([cs, rs]) => { const el = document.querySelector(cs), r = document.querySelector(rs); return { live: el.classList.contains('is-live'), on: el.querySelectorAll('.is-on').length, ctl: el.querySelectorAll('.kws-cyl-ctl button').length, ring: r.classList.contains('is-live'), cards: r.querySelectorAll('.kws-ring-card').length, front: r.querySelectorAll('.is-front').length, hub: !!r.querySelector('.kws-ring-hub').style.transform }; }, [CYL, RING]);
    ok(c.live && c.on === 1 && c.ctl === 7 && c.ring && c.cards === 30 && c.front === 1 && c.hub, `${name}: both complete at load`, JSON.stringify(c));
    // ring: scroll past + drag: nothing changes, no frames
    await jump(p, RING, -400); await p.waitForTimeout(300); const t0 = await ringT(p);
    for (let i = 0; i < 12; i++) { await p.evaluate(() => scrollBy(0, 60)); await p.waitForTimeout(30); }
    const sb = await p.locator(RING + ' .kws-ring-stage').boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sb.x + 250, y: sb.y + 100, id: 1 }] });
    for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sb.x + 250 - i * 18, y: sb.y + 100, id: 1 }] }); await p.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(500);
    const t1 = await ringT(p);
    ok(t0 === t1, `${name}: ring unchanged through 720px of scroll and a sideways drag`);
    // cylinder: operable, instant
    await jump(p, CYL, -60); await p.waitForTimeout(200);
    await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), CYL);
    const i1 = await p.evaluate(s => { const el = document.querySelector(s), c = [...el.querySelectorAll('.kws-cyl-card')]; return { on: c.findIndex(x => x.classList.contains('is-on')), t: c[1].style.transform, moving: el.classList.contains('is-moving'), said: el.querySelector('.kws-cyl-sr').textContent }; }, CYL);
    ok(i1.on === 1 && i1.t === 'none' && !i1.moving && /Step 2 of 5/.test(i1.said), `${name}: Next lands at once and is announced`, JSON.stringify(i1));
    await p.focus(CYL + ' .kws-cyl-dot'); await p.keyboard.press('End'); const e = await cur(p, CYL); await p.keyboard.press('ArrowLeft'); const e2 = await cur(p, CYL); await p.keyboard.press('Home'); const e3 = await cur(p, CYL);
    ok(e === 4 && e2 === 3 && e3 === 0, `${name}: End, Left, Home work at once`, [e, e2, e3].join());
    await p.evaluate(s => document.querySelectorAll(s + ' .kws-cyl-dot')[2].click(), CYL); ok(await cur(p, CYL) === 2, `${name}: a dot lands at once`);
    const cb = await p.locator(CYL + ' .kws-cyl-track').boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cb.x + 300, y: cb.y + 300, id: 1 }] });
    const mid = []; for (let i = 1; i <= 10; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cb.x + 300 - i * 14, y: cb.y + 300, id: 1 }] }); await p.waitForTimeout(16); mid.push(await p.evaluate(s => document.querySelectorAll(s + ' .kws-cyl-card')[2].style.transform, CYL)); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(200);
    ok(mid.every(m => m === 'none') && await cur(p, CYL) === 3, `${name}: a swipe steps one card on release; nothing follows the finger`, `now ${await cur(p, CYL)}`);
    const raf = await p.evaluate(() => window.__raf), run = await anims(p);
    ok(raf === 0 && run === '', `${name}: no frames asked for by the kit in the whole run, no CSS animation or transition running`, `rAF ${raf}; running: ${run || 'none'}`);
    await p.ctx.close();
  }

  // ---- pause while a turn is in flight, then resume
  let p = await open(b, DEMO, { w: 1280, h: 900 });
  await jump(p, CYL); await p.waitForTimeout(200);
  await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), CYL); await p.waitForTimeout(100);
  await p.click('#demo-motion'); await p.waitForTimeout(1500);
  let s = await p.evaluate(s => { const el = document.querySelector(s), c = [...el.querySelectorAll('.kws-cyl-card')]; return { on: c.findIndex(x => x.classList.contains('is-on')), t: c[1].style.transform, moving: el.classList.contains('is-moving') }; }, CYL);
  const pressed = await p.evaluate(() => { const b = document.getElementById('demo-motion'); return b.getAttribute('aria-pressed') + ' "' + b.textContent + '"'; });
  log(`INFO  pause pressed 100ms into a cylinder turn: after 1.5s the card is ${s.t === 'none' ? 'flat on step ' + (s.on + 1) : 'at ' + s.t}; is-moving ${s.moving}; pause button ${pressed}  (the turn ${s.t === 'none' ? 'ran to its end (a 0.7s spring finishing is acceptable)' : 'froze part-way'})`);
  await p.click('#demo-motion');
  // ring: pause mid-coast
  await jump(p, RING, -200); await p.waitForTimeout(600);
  const sb = await p.locator(RING + ' .kws-ring-stage').boundingBox();
  await p.mouse.move(sb.x + 400, sb.y + 150); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(sb.x + 400 - i * 30, sb.y + 150); await p.waitForTimeout(12); } await p.mouse.up();
  await p.waitForTimeout(80); await p.click('#demo-motion'); await p.waitForTimeout(120); const h0 = await p.evaluate(s => document.querySelector(s + ' .kws-ring-hub').style.transform, RING); await p.waitForTimeout(700); const h1 = await p.evaluate(s => document.querySelector(s + ' .kws-ring-hub').style.transform, RING);
  ok(h0 === h1, 'pause pressed while the ring coasts: it stops within 120ms and stays put', `${h0.match(/rotateY\([^)]*\)$/)} = ${h1.match(/rotateY\([^)]*\)$/)}`);
  const rafA = await p.evaluate(() => window.__raf); await p.waitForTimeout(1500); const rafB = await p.evaluate(() => window.__raf);
  ok(rafA === rafB, 'paused: no further frames asked for', `${rafB - rafA}`);
  // scroll a long way while paused, resume, then resize (rotate the device): does it spin to catch up?
  await p.evaluate(() => scrollBy(0, 1)); for (let i = 0; i < 10; i++) { await p.evaluate(() => scrollBy(0, -60)); await p.waitForTimeout(20); }
  await p.click('#demo-motion'); await p.waitForTimeout(200);
  const a0 = await p.evaluate(s => +document.querySelector(s + ' .kws-ring-hub').style.transform.match(/rotateY\(([-\d.]+)deg\)$/)[1], RING);
  await p.setViewportSize({ width: 1180, height: 900 }); await p.waitForTimeout(1200);
  const a1 = await p.evaluate(s => +document.querySelector(s + ' .kws-ring-hub').style.transform.match(/rotateY\(([-\d.]+)deg\)$/)[1], RING);
  log(`INFO  paused, scrolled 600px, resumed, then the window was resized: ring angle ${a0} > ${a1} (${Math.abs(a1 - a0).toFixed(1)} degrees turned with no scroll or drag)`);
  await p.ctx.close();

  // ---- frames: idle, off screen, hidden tab
  p = await open(b, DEMO, { w: 390, h: 844, touch: true });
  await jump(p, RING, -100); await p.waitForTimeout(1200);
  let r0 = await p.evaluate(() => window.__raf); await p.waitForTimeout(3000); let r1 = await p.evaluate(() => window.__raf);
  ok(r1 === r0, 'idle with a ring and a cylinder on screen: no frames asked for in 3s', `${r1 - r0}`);
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800); r0 = await p.evaluate(() => window.__raf);
  for (let i = 0; i < 20; i++) { await p.evaluate(() => scrollBy(0, 12)); await p.waitForTimeout(30); } r1 = await p.evaluate(() => window.__raf);
  const hubs = await p.evaluate(() => [...document.querySelectorAll('.kws-ring-hub')].map(h => getComputedStyle(h).display).join());
  ok(r1 === r0, 'scrolling the top of the page with both rings off screen: no frames asked for; hubs not rendered', `${r1 - r0} frames; hub display: ${hubs}`);
  // scroll the ring through, count frames asked vs frames run, then leave: stops?
  await jump(p, RING, -700); await p.waitForTimeout(500); r0 = await p.evaluate(() => window.__raf);
  for (let i = 0; i < 60; i++) { await p.evaluate(() => scrollBy(0, 20)); await p.waitForTimeout(16); }
  await p.waitForTimeout(1500); r1 = await p.evaluate(() => window.__raf); await p.waitForTimeout(1500); const r2 = await p.evaluate(() => window.__raf);
  ok(r2 === r1 && r1 - r0 > 20, 'scrolling the ring through: frames while it moves, none 1.5s after it stops', `${r1 - r0} frames asked during a 1,200px scroll, ${r2 - r1} after`);
  // hidden tab: start a ring coast and a cylinder turn, hide the page, count kit frames that RUN
  await jump(p, RING, -100); await p.waitForTimeout(600);
  const cdp = await p.ctx.newCDPSession(p);
  await p.evaluate(() => scrollBy(0, 200));
  const p2 = await p.ctx.newPage(); await p2.goto('about:blank'); await p2.bringToFront();
  await cdp.send('Emulation.setIdleOverride', { isUserActive: true, isScreenUnlocked: true }).catch(() => {});
  const vis = await p.evaluate(() => document.visibilityState); const run0 = await p.evaluate(() => window.__rafRun);
  await p.evaluate(() => { scrollBy(0, 200); document.querySelector('.kws-cyl-nav:last-child').click(); });
  await p2.waitForTimeout(2000); const run1 = await p.evaluate(() => window.__rafRun), asked = await p.evaluate(() => window.__raf);
  log(`INFO  tab in the background (visibilityState "${vis}"): kit frame callbacks run in 2s: ${run1 - run0} (headless Chromium may keep painting background pages; a real browser stops rAF in hidden tabs, and the kit has no timers)`);
  await p.ctx.close();
  // timers in the kit?
  const fs = require('fs'); const src = ['../cylinder.js', '../ring.js'].map(f => fs.readFileSync(require('path').join(__dirname, f), 'utf8'));
  log(`INFO  timers in source: cylinder setTimeout x${(src[0].match(/setTimeout/g) || []).length}, setInterval x${(src[0].match(/setInterval/g) || []).length}; ring setTimeout x${(src[1].match(/setTimeout/g) || []).length}, setInterval x${(src[1].match(/setInterval/g) || []).length}; wheel listeners: ${(src.join('').match(/['"]wheel['"]/g) || []).length}; preventDefault calls: cylinder ${(src[0].match(/preventDefault/g) || []).length}, ring ${(src[1].match(/preventDefault/g) || []).length}`);
  await b.close();
})();
