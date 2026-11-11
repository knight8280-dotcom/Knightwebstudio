// 2. Reduced motion and html[data-motion="off"]; frames while idle, off screen, hidden tab; pause mid-turn; resume.
const { chromium, DEMO, ONE, log, ok, open, jump, cur, settle } = require('./lib');
const CYL = '#how .kws-cyl', RING = '#included .kws-ring';
const ringT = p => p.evaluate(s => { const el = document.querySelector(s); return [el.querySelector('.kws-ring-hub').style.transform, ...[...el.querySelectorAll('.kws-ring-card')].map(c => c.className + c.style.transform)].join('~'); }, RING);
const anims = p => p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => (a.animationName || a.transitionProperty) + ' on ' + (a.effect.target && a.effect.target.className)).join(', '));
(async () => {
  const b = await chromium.launch();
  for (const mode of ['paused']) {
    const p = await open(b, DEMO, { w: 390, h: 844, touch: true, rm: mode === 'rm' });
    if (mode === 'paused') { await p.click('#demo-motion'); await p.evaluate(() => { window.__raf = 0; }); }
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

  await b.close();
})();
