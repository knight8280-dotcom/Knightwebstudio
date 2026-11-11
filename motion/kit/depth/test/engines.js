// The same behaviour in other engines: node test/engines.js webkit|firefox   (Playwright's builds on Linux)
// Mouse and keyboard only: touch gestures, frame times and leaks are measured in Chromium, which has the protocol for them.
const { engine, DEMO, BARE, CYL, RING, ok, open, jump, cur, settle, drum, ring, done } = require('./lib');
const name = process.argv[2] || 'webkit', STEP = 12, onCard = a => Math.abs(a / STEP - Math.round(a / STEP)) < .01;
(async () => {
  const b = await engine(name).launch();
  for (const w of [390, 1280]) {
    let p = await open(b, DEMO, { w, h: 844, noMobile: true });
    ok(p.errs.length === 0 && await p.evaluate(() => document.querySelectorAll('.is-live').length) === 4, `${name} ${w}px: the demo loads with no errors and all four components start`, p.errs.join(' | '));
    await jump(p, CYL, -70);
    await p.click(CYL + ' .kws-cyl-nav:last-child'); await settle(p); let d = await drum(p);
    ok(d.on === 1 && d.tOn === 'none' && /^Step 2 of 5/.test(d.said), `${name} ${w}px drum: Next moves one step, lands flat-on and says so`);
    await p.focus(CYL + ' .kws-cyl-dot'); await p.keyboard.press('ArrowRight'); await settle(p); await p.keyboard.press('End'); await settle(p); const e = await cur(p); await p.keyboard.press('Home'); await settle(p);
    ok(e === 4 && await cur(p) === 0, `${name} ${w}px drum: arrow keys, Home and End`);
    const bx = await p.locator(CYL + ' .kws-cyl-track').boundingBox(), cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2;
    await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(cx - i * 22, cy + 1); await p.waitForTimeout(20); } await p.mouse.up(); await settle(p); d = await drum(p);
    ok(d.on === 1 && !d.held && d.tOn === 'none', `${name} ${w}px drum: a mouse drag turns it one card`);
    await p.click(CYL + ' .kws-cyl-nav:last-child'); await p.waitForTimeout(120); await p.mouse.move(cx, cy); await p.mouse.down(); await p.waitForTimeout(60); await p.mouse.up(); await p.waitForTimeout(1800); d = await drum(p);
    ok(!d.moving && !d.held && d.tOn === 'none' && d.wc === 'auto', `${name} ${w}px drum: a press in mid-turn does not leave it part-way (it lands flat on a card)`, 'step ' + (d.on + 1));
    const off = await p.evaluate(sel => { const el = document.querySelector(sel); KWS.cylinder.mount(el)(); const r = { cls: el.className, kids: el.children.length, attrs: [...el.querySelectorAll('.kws-cyl-card')].map(c => c.getAttributeNames().join('+')).join() }; KWS.cylinder.mount(el); return r; }, CYL);
    ok(off.cls === 'kws-cyl' && off.kids === 1 && off.attrs === 'class,class,class,class,class', `${name} ${w}px drum: the remover leaves the markup as it found it`, JSON.stringify(off));
    // the ring
    await jump(p, RING, -80); await p.waitForTimeout(2500); let r0 = await ring(p);
    ok(r0.n === 30 && r0.up && r0.words === '1' && onCard(r0.ang) && /scale\(0\.5\)$/.test(r0.upT), `${name} ${w}px ring: thirty cards, one stood up flat with its words, at rest on a card`, `"${r0.tab}: ${r0.up}"`);
    for (let i = 0; i < 10; i++) { await p.mouse.wheel(0, 30); await p.waitForTimeout(40); }
    await p.waitForTimeout(3000); let r1 = await ring(p);
    ok(Math.abs(r1.ang - r0.ang) > 15 && onCard(r1.ang) && r1.up !== r0.up, `${name} ${w}px ring: it turns with the page and settles on another card`, `${(r1.ang - r0.ang).toFixed(0)} degrees, now "${r1.up}"`);
    await jump(p, RING, -80); await p.waitForTimeout(2500); r1 = await ring(p);
    const sb = await p.locator(RING + ' .kws-ring-stage').boundingBox(); if (sb) { const x = Math.min(w - 40, Math.max(200, sb.x + sb.width * .6)), y = sb.y + sb.height * .8;
      await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(x - i * 14, y); await p.waitForTimeout(20); } await p.mouse.up(); await p.waitForTimeout(3500); const r2 = await ring(p);
      ok(r2.ang < r1.ang - 8 && onCard(r2.ang), `${name} ${w}px ring: a sideways drag turns it and it settles on a card`, `${(r2.ang - r1.ang).toFixed(0)} degrees`); }
    const roff = await p.evaluate(sel => { const el = document.querySelector(sel), st = el.querySelector('.kws-ring-stage'); KWS.ring.mount(el)(); const r = { cls: el.className, kids: st.children.length, attrs: st.getAttributeNames().join('+') }; KWS.ring.mount(el); return r; }, RING);
    ok(roff.cls === 'kws-ring' && roff.kids === 0 && roff.attrs === 'class+aria-hidden', `${name} ${w}px ring: the remover leaves the markup as it found it`, JSON.stringify(roff));
    ok(p.errs.length === 0 && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} ${w}px: no errors, no sideways scroll`, p.errs.join());
    await p.ctx.close();
    // reduced motion
    p = await open(b, DEMO, { w, h: 844, rm: true, noMobile: true }); await jump(p, RING, -80); await p.waitForTimeout(600); r0 = await ring(p);
    await p.mouse.wheel(0, 120); await p.waitForTimeout(500); r1 = await ring(p);
    await jump(p, CYL, -70); await p.click(CYL + ' .kws-cyl-nav:last-child'); d = await drum(p);
    ok(r0.all === r1.all && r0.up && d.on === 1 && d.tOn === 'none' && !d.moving, `${name} ${w}px, reduced motion: the ring is still with one card up; the drum lands at once`);
    await p.ctx.close();
  }
  const p = await open(b, BARE, { w: 390, h: 844, noMobile: true });
  ok(p.errs.length === 0 && await p.evaluate(() => document.querySelectorAll('.is-live').length) === 2, `${name}: the bare client page starts both with no errors`, p.errs.join());
  await b.close(); process.exit(done() ? 1 : 0);
})();
