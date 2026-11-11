// The cylinder slider's contract, checked by script: node test/cylinder.js   (needs the kit server on :8730)
const { engine, DEMO, BARE, CYL, ok, note, open, jump, cur, settle, drum, finger, line, done } = require('./lib');
const chromium = engine('chromium');
const N = 5;
// put a link at the foot of every real card (the demo's cards have none)
const addLinks = (p, sel = CYL) => p.evaluate(s => { document.querySelectorAll(s + ' .kws-cyl-card:not([aria-hidden])').forEach((li, i) => { const a = document.createElement('a'); a.href = '#step-' + (i + 1); a.textContent = 'Read about step ' + (i + 1); a.className = 'x-link'; a.style.cssText = 'display:block;padding:14px 0'; li.append(a); }); history.replaceState(null, '', location.pathname); }, sel);
const remount = (p, n, opt = {}, sel = CYL) => p.evaluate(([s, n, opt]) => { const el = document.querySelector(s); KWS.cylinder.mount(el)(); const tr = el.querySelector('.kws-cyl-track'); while (tr.children.length < n) { const c = tr.children[0].cloneNode(true); tr.append(c); } KWS.cylinder.mount(el, opt); }, [sel, n, opt]);

(async () => {
  const b = await chromium.launch();

  // ---- 1. structure and names
  let p = await open(b, DEMO);
  ok(p.errs.length === 0, 'no console errors on load', p.errs.join(' | '));
  ok(await p.evaluate(() => document.querySelectorAll('.kws-cyl.is-live').length === 2 && document.querySelectorAll('.kws-ring.is-live').length === 2), 'two cylinders and two rings start themselves');
  ok(await p.evaluate(() => Object.keys(window).filter(k => /^kws/i.test(k) && k !== 'kwsReady').join() === 'KWS'), 'one global namespace (window.KWS)', await p.evaluate(() => Object.keys(window.KWS).join()));
  let s = await p.evaluate(sel => { const el = document.querySelector(sel), tr = el.querySelector('.kws-cyl-track'), real = [...tr.children].filter(c => !c.hasAttribute('aria-hidden')), blank = [...tr.children].filter(c => c.hasAttribute('aria-hidden'));
    return { tag: el.tagName, label: el.getAttribute('aria-label'), role: el.getAttribute('aria-roledescription'), list: tr.tagName, real: real.length, slides: real.every((c, i) => c.getAttribute('aria-roledescription') === 'slide' && c.getAttribute('aria-label') === `${i + 1} of ${real.length}`), blank: blank.length, blankEmpty: blank.every(c => !c.textContent && !c.querySelector('a,button')),
      btns: [...el.querySelectorAll('.kws-cyl-ctl > *')].map(x => x.tagName + ':' + x.type + ':' + x.getAttribute('aria-label')), live: el.querySelector('.kws-cyl-sr').getAttribute('aria-live'), said: el.querySelector('.kws-cyl-sr').textContent, current: el.querySelectorAll('.kws-cyl-dot[aria-current="true"]').length, prevOff: el.querySelector('.kws-cyl-nav').getAttribute('aria-disabled') }; }, CYL);
  ok(s.tag === 'SECTION' && s.label && s.role === 'carousel' && s.list === 'OL', 'a labelled region with a list, described as a carousel', `${s.tag} "${s.label}" ${s.list}`);
  ok(s.real === N && s.slides, `each of the ${N} items is a slide labelled "n of ${N}"`);
  ok(s.blank === 4 && s.blankEmpty, 'the drum has two ends here: four blank cards beyond them, empty and hidden from assistive technology', `${s.blank} blank`);
  ok(s.btns.length === N + 2 && s.btns.every(x => /^BUTTON:button:\S/.test(x)) && /Previous step/.test(s.btns[0]) && /Next step/.test(s.btns[N + 1]) && /Step 2 of 5: Within a minute/.test(s.btns[2]), 'previous, next and five dots are real buttons with names', s.btns[1].split(':').slice(2).join(':') + ' / ' + s.btns[N].split(':').slice(2).join(':'));
  ok(s.live === 'polite' && s.said === '' && s.current === 1, 'polite live region, silent until the visitor moves it; one dot is current');
  ok(s.prevOff === 'true', 'at the first step the previous arrow is marked aria-disabled');

  // ---- 2. arrows and dots
  await jump(p, CYL);
  await p.click(CYL + ' .kws-cyl-nav:last-child'); await settle(p);
  let d = await drum(p);
  ok(d.on === 1 && d.dot === 1 && /^Step 2 of 5/.test(d.said), 'Next moves one step and says so', d.said);
  ok(d.tOn === 'none' && d.wc === 'auto', 'the card in the middle carries no transform at rest; will-change is off again', `${d.tOn} / ${d.wc}`);
  await p.click(CYL + ' .kws-cyl-dot:nth-of-type(5)'); await settle(p);   // dots are the 2nd to 6th buttons
  ok(await cur(p) === 3, 'a dot goes straight to its step', 'step ' + (await cur(p) + 1));
  await p.click(CYL + ' .kws-cyl-nav:last-child'); await settle(p); await p.click(CYL + ' .kws-cyl-nav:last-child', { force: true }).catch(() => {}); await p.waitForTimeout(400);
  d = await drum(p);
  ok(d.on === 4 && await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').getAttribute('aria-disabled'), CYL) === 'true', 'at the last step Next is marked aria-disabled and goes no further');
  s = await p.evaluate(sel => { const n = document.querySelector(sel + ' .kws-cyl-nav:last-child'), cs = getComputedStyle(n); return cs.pointerEvents + ' ' + cs.opacity; }, CYL);
  ok(s === 'none 0.4', 'the dimmed arrow takes no pointer: no hand cursor, no hover, no press', s);
  // the dot under the pointer keeps its fill
  await p.hover(CYL + ' .kws-cyl-dot[aria-current]'); await p.waitForTimeout(100);
  s = await p.evaluate(sel => { const e = document.querySelector(sel + ' .kws-cyl-dot[aria-current]'), o = document.querySelector(sel + ' .kws-cyl-dot:not([aria-current])'); return [getComputedStyle(e, '::before').backgroundColor, getComputedStyle(e, '::before').color, getComputedStyle(o, '::before').backgroundColor]; }, CYL);
  ok(s[0] === s[1] && s[0] !== s[2], 'the current dot stays filled in the accent colour while the pointer rests on it', s.join(' vs '));
  s = await p.evaluate(sel => [...document.querySelectorAll(sel + ' .kws-cyl-card')].map(c => getComputedStyle(c, '::after').opacity).join(), CYL);
  ok(s === '0.4,0.4,0.4,0.4,1,0.4,0.4,0.4,0.4', 'landed: only the card in the middle is at full light', s);
  await p.ctx.close();

  // ---- 3. keyboard
  p = await open(b, DEMO); await jump(p, CYL);
  await p.focus(CYL + ' .kws-cyl-dot'); await p.keyboard.press('ArrowRight'); await settle(p);
  let a = await cur(p); await p.keyboard.press('ArrowRight'); await settle(p); let c2 = await cur(p);
  await p.keyboard.press('ArrowLeft'); await settle(p); let c3 = await cur(p);
  await p.keyboard.press('End'); await settle(p); let c4 = await cur(p); await p.keyboard.press('Home'); await settle(p);
  ok(a === 1 && c2 === 2 && c3 === 1 && c4 === 4 && await cur(p) === 0, 'arrow keys, Home and End work when focus is inside', [a, c2, c3, c4, await cur(p)].join());
  let y0 = await p.evaluate(() => scrollY); await p.keyboard.press('ArrowDown'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => scrollY) > y0 && await cur(p) === 0, 'up and down arrows are left to the page');
  await p.focus(CYL + ' .kws-cyl-nav'); let tabs = 0, inside = true;
  while (inside && tabs < 20) { await p.keyboard.press('Tab'); tabs++; inside = await p.evaluate(s => document.querySelector(s).contains(document.activeElement), CYL); }
  ok(!inside && tabs === N + 2, 'focus is never trapped: Tab walks out past the dots and Next', tabs + ' presses');
  await addLinks(p); await p.waitForTimeout(100);
  // focus on a side card's link brings that card round
  await p.evaluate(s => document.querySelectorAll(s + ' .x-link')[2].focus({ preventScroll: true }), CYL); await settle(p);
  s = await p.evaluate(sel => { const a = document.querySelectorAll(sel + ' .x-link')[2].getBoundingClientRect(); return { off: Math.round((a.left + a.right) / 2 - innerWidth / 2), sl: document.querySelector(sel + ' .kws-cyl-track').scrollLeft }; }, CYL);
  ok(await cur(p) === 2 && Math.abs(s.off) < 3 && s.sl === 0, 'tabbing to a link on a side card brings that card to the middle', `offset ${s.off}px`);
  // an arrow key pressed with focus on a card's link: focus goes with the drum
  for (const w of [390, 1280]) {
    const q = await open(b, DEMO, { w, h: 844 }); await jump(q, CYL, -70); await addLinks(q);
    await q.evaluate(s => document.querySelector(s + ' .x-link').focus({ preventScroll: true }), CYL); await q.keyboard.press('ArrowRight'); await settle(q); if (w > 1000) { await q.keyboard.press('ArrowRight'); await settle(q); }
    const f = await q.evaluate(() => { const e = document.activeElement, r = e.getBoundingClientRect(); return { cls: e.className, name: e.getAttribute('aria-label'), vis: Math.min(r.right, innerWidth) - Math.max(r.left, 0), w: r.width, said: document.querySelector('.kws-cyl-sr').textContent }; });
    ok(/kws-cyl-dot/.test(f.cls) && f.vis === f.w && await cur(q) === (w > 1000 ? 2 : 1), `${w}px: an arrow key pressed on a link in a card moves focus to the dot of the card that came round, in view`, `"${f.name}" ${f.vis} of ${f.w}px visible; live region "${f.said}"`);
    await q.ctx.close();
  }
  await p.ctx.close();

  // ---- 4. clicks, taps and links
  p = await open(b, DEMO); await jump(p, CYL); await addLinks(p);
  let r = await p.evaluate(s => { const a = document.querySelectorAll(s + ' .x-link')[1].getBoundingClientRect(); return [a.left + 20, a.top + a.height / 2]; }, CYL);
  await p.mouse.click(r[0], r[1]); await settle(p);
  ok(await cur(p) === 1 && await p.evaluate(() => location.hash) === '', 'mouse: a click on a side card brings it round and does not follow its link');
  r = await p.evaluate(s => { const a = document.querySelectorAll(s + ' .x-link')[1].getBoundingClientRect(); return [a.left + 20, a.top + a.height / 2]; }, CYL);
  await p.mouse.click(r[0], r[1]); await p.waitForTimeout(200);
  ok(await p.evaluate(() => location.hash) === '#step-2', 'mouse: the same click on the card in the middle follows the link');
  await p.evaluate(() => history.replaceState(null, '', location.pathname));
  await p.mouse.move(r[0], r[1]); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(r[0] - i * 25, r[1]); await p.waitForTimeout(16); } await p.mouse.up(); await settle(p);
  ok(await p.evaluate(() => location.hash) === '' && await cur(p) === 2, 'a drag that starts on a link turns the drum and follows nothing', 'step ' + (await cur(p) + 1));
  await p.ctx.close();
  for (const w of [820, 390]) {
    p = await open(b, DEMO, { w, h: 900, touch: true }); await jump(p, CYL, -70); await addLinks(p); await p.waitForTimeout(200);
    // a visible point of the next card: its link at 820, its edge at 390
    r = await p.evaluate(s => { const c = document.querySelectorAll(s + ' .kws-cyl-card')[1], a = c.querySelector('.x-link').getBoundingClientRect(), cr = c.getBoundingClientRect(); return innerWidth > 700 ? [a.left + 30, a.top + a.height / 2] : [innerWidth - 12, cr.top + cr.height / 2]; }, CYL);
    const hit = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.closest('.kws-cyl-card') ? [...e.closest('.kws-cyl-track').children].indexOf(e.closest('.kws-cyl-card')) : -1); }, r);
    await finger(p, [r, r], 40); await p.waitForTimeout(1500);
    ok(hit === 1 && await cur(p) === 1 && await p.evaluate(() => location.hash) === '', `touch ${w}px: a tap on a side card${w > 700 ? "'s link" : ''} brings it round and follows nothing`, `step ${await cur(p) + 1}, hash "${await p.evaluate(() => location.hash)}"`);
    if (w === 390) {
      const bx = await p.locator(CYL + ' .kws-cyl-track').boundingBox();
      await finger(p, line(bx.x + 300, bx.y + 200, bx.x + 80, bx.y + 204, 8)); await settle(p);
      const on = await cur(p); await p.evaluate(s => document.querySelectorAll(s + ' .x-link')[2].focus({ preventScroll: true }), CYL); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
      ok(on === 2 && await p.evaluate(() => location.hash) === '#step-3', 'after a touch drag, Enter on a focused link still follows it');
    }
    await p.ctx.close();
  }

  // ---- 5. drag feel
  p = await open(b, DEMO); await jump(p, CYL);
  let bx = await p.locator(CYL + ' .kws-cyl-track').boundingBox(), cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2;
  await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(cx - i * 30, cy); await p.waitForTimeout(16); }
  d = await drum(p); ok(d.held && d.moving, 'while dragging the drum follows the pointer (is-held, is-moving)');
  await p.mouse.up(); await settle(p); d = await drum(p);
  ok(d.on === 1 && !d.held && d.tOn === 'none', 'a drag of half a card lands on the next card, flat-on');
  await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(cx - i * 5, cy); await p.waitForTimeout(30); } await p.waitForTimeout(150); await p.mouse.up(); await settle(p);
  ok(await cur(p) === 1, 'a small drag snaps back');
  // a quarter of a card, quickly, then held still for a second: no fling from the old speed
  const W = await p.evaluate(s => document.querySelector(s + ' .kws-cyl-card').offsetWidth, CYL);
  await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 4; i++) { await p.mouse.move(cx - i * W * .07, cy); await p.waitForTimeout(12); } await p.waitForTimeout(1000); await p.mouse.up(); await settle(p);
  ok(await cur(p) === 1, 'a quick quarter-card drag held still for a second, then let go, snaps back: no fling from the old speed', 'step ' + (await cur(p) + 1));
  // at an end the drum resists and returns
  await p.click(CYL + ' .kws-cyl-dot'); await settle(p);
  await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(cx + i * 40, cy); await p.waitForTimeout(16); } await p.mouse.up(); await settle(p);
  ok(await cur(p) === 0, 'dragged past its first card the drum gives a little and comes back');
  // the wheel is the page's
  y0 = await p.evaluate(() => scrollY); await p.mouse.move(cx, cy); await p.mouse.wheel(0, 240); await p.waitForTimeout(400);
  ok(await p.evaluate(() => scrollY) - y0 > 200 && await cur(p) === 0, 'the mouse wheel over the drum scrolls the page and turns nothing', `page moved ${await p.evaluate(() => scrollY) - y0}px`);
  await p.ctx.close();

  // ---- 6. interrupted turns never leave it part-way
  p = await open(b, DEMO); await jump(p, CYL);
  bx = await p.locator(CYL + ' .kws-cyl-track').boundingBox(); cx = bx.x + bx.width / 2; cy = bx.y + bx.height / 2;
  await p.click(CYL + ' .kws-cyl-nav:last-child'); await p.waitForTimeout(120);
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.waitForTimeout(60); await p.mouse.up(); await p.waitForTimeout(2000);
  d = await drum(p); ok(!d.moving && !d.held && d.tOn === 'none' && d.wc === 'auto' && d.on === 1, 'mouse: Next, then a plain press on the drum 120ms later: it finishes its turn', JSON.stringify(d));
  await p.ctx.close();
  p = await open(b, DEMO, { w: 390, h: 844, touch: true }); await jump(p, CYL, -60); await p.waitForTimeout(300);
  bx = await p.locator(CYL + ' .kws-cyl-track').boundingBox(); let x = bx.x + bx.width / 2, y = bx.y + 300;
  await finger(p, line(x + 60, y, x - 120, y + 3, 8)); await p.waitForTimeout(100);
  y0 = await p.evaluate(() => scrollY); await finger(p, line(x, y + 100, x, y - 150, 10)); await p.waitForTimeout(2200);
  d = await drum(p); let moved = await p.evaluate(() => scrollY) - y0;
  ok(moved > 100 && !d.moving && !d.held && d.tOn === 'none' && d.on === 1, 'touch: swipe the drum, then 100ms later scroll the page with a finger on it: the page scrolls and the drum finishes its turn', `page ${moved}px; ${JSON.stringify(d)}`);
  // a second finger landing in mid-drag
  await jump(p, CYL, -60); await p.waitForTimeout(200);
  const cdp = p.cdp;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x + 40, y, id: 1 }] });
  for (let i = 1; i <= 5; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40 - i * 14, y: y + 1, id: 1 }] }); await p.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 30, y: y + 1, id: 1 }, { x: x + 60, y: y + 120, id: 2 }] }); await p.waitForTimeout(50);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(2200);
  d = await drum(p); ok(!d.moving && !d.held && d.tOn === 'none', 'touch: a second finger landing in mid-drag leaves nothing held and nothing part-turned', JSON.stringify(d));
  // rapid input
  for (let i = 0; i < 12; i++) { await p.evaluate(([s, i]) => document.querySelector(s + (i % 3 ? ' .kws-cyl-nav:last-child' : ' .kws-cyl-nav')).click(), [CYL, i]); await p.waitForTimeout(35); }
  await settle(p); d = await drum(p);
  ok(!d.moving && d.tOn === 'none' && d.on === d.dot, 'twelve arrow presses 35ms apart leave it settled on one card with its dot', JSON.stringify(d));
  await p.ctx.close();

  // ---- 7. touch: the page scrolls up and down, the drum turns sideways
  p = await open(b, DEMO, { w: 390, h: 844, touch: true }); await jump(p, CYL, -60); await p.waitForTimeout(300);
  bx = await p.locator(CYL + ' .kws-cyl-track').boundingBox(); x = bx.x + bx.width / 2; y = bx.y + 320;
  y0 = await p.evaluate(() => scrollY); await finger(p, line(x, y, x + 6, y - 240, 10)); await p.waitForTimeout(500);
  moved = await p.evaluate(() => scrollY) - y0;
  ok(moved > 150 && await cur(p) === 0, 'a vertical swipe on the drum scrolls the page', `${moved}px`);
  await jump(p, CYL, -60); await p.waitForTimeout(200); y0 = await p.evaluate(() => scrollY);
  await finger(p, line(x + 80, y, x - 120, y + 8, 10)); await settle(p);
  ok(await cur(p) === 1 && Math.abs(await p.evaluate(() => scrollY) - y0) < 2, 'a sideways swipe turns the drum and the page does not move');
  s = await p.evaluate(sel => getComputedStyle(document.querySelector(sel + ' .kws-cyl-track')).touchAction, CYL);
  ok(/pan-y/.test(s) && /pinch-zoom/.test(s), 'touch-action leaves vertical scrolling and pinch-zoom to the browser', s);
  await p.ctx.close();

  // ---- 8. reduced motion and paused motion
  for (const mode of ['reduced motion', 'motion paused']) {
    p = await open(b, DEMO, { w: 390, h: 844, touch: true, rm: mode === 'reduced motion' }); if (mode !== 'reduced motion') await p.click('#demo-motion');
    await jump(p, CYL, -60); await p.waitForTimeout(300); const f0 = await p.evaluate(() => window.__raf);
    await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), CYL);
    d = await drum(p); const instant = d.on === 1 && d.tOn === 'none' && !d.moving;
    await p.keyboard.press('Tab'); await p.focus(CYL + ' .kws-cyl-dot'); await p.keyboard.press('ArrowRight'); const k = await cur(p);
    bx = await p.locator(CYL + ' .kws-cyl-track').boundingBox(); x = bx.x + bx.width / 2; y = bx.y + 300;
    const before = await p.evaluate(s => [...document.querySelectorAll(s + ' .kws-cyl-card')].map(c => c.style.transform).join('|'), CYL);
    const cdp2 = await p.ctx.newCDPSession(p);
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x + 60, y, id: 1 }] });
    for (let i = 1; i <= 8; i++) { await cdp2.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 60 - i * 18, y: y + 2, id: 1 }] }); await p.waitForTimeout(16); }
    const during = await p.evaluate(s => [...document.querySelectorAll(s + ' .kws-cyl-card')].map(c => c.style.transform).join('|'), CYL);
    await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(200);
    const frames = await p.evaluate(() => window.__raf) - f0;
    ok(instant && k === 2 && before === during && await cur(p) === 3 && frames === 0, `${mode}: arrows, keys and a swipe land at once; nothing follows the finger; no animation frames asked for`, `${frames} frames`);
    s = await p.evaluate(sel => getComputedStyle(document.querySelector(sel + ' .kws-cyl-card'), '::after').transitionDuration, CYL);
    ok(s === '0s', `${mode}: the light on the cards changes without a transition`, s);
    await p.ctx.close();
  }

  // ---- 9. at rest it costs nothing; every card in view is at full strength
  p = await open(b, DEMO, { w: 1920, h: 1000 }); await jump(p, CYL); await p.click(CYL + ' .kws-cyl-dot:nth-of-type(4)'); await settle(p); await p.waitForTimeout(200);
  let f0 = await p.evaluate(() => window.__raf); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => window.__raf) === f0, 'no animation frames while it rests');
  s = await p.evaluate(sel => [...document.querySelectorAll(sel + ' .kws-cyl-card')].map(c => { const r = c.getBoundingClientRect(); return { o: +c.style.opacity, vis: Math.min(r.right, innerWidth) - Math.max(r.left, 0) > 4, real: !c.hasAttribute('aria-hidden') }; }), CYL);
  ok(s.filter(c => c.vis && c.real).length === 5 && s.every(c => !c.real || !c.vis || c.o === 1), '1920px: all five cards are in view and every card in view is at full strength (nothing is faded)', s.map(c => c.o).join());
  await p.ctx.close();

  // ---- 10. phone: a step fits between the header and the phone bar
  p = await open(b, DEMO, { w: 390, h: 664, touch: true }); await jump(p, CYL, -64); await p.waitForTimeout(300);
  s = await p.evaluate(sel => { const el = document.querySelector(sel), c = el.querySelector('.kws-cyl-card').getBoundingClientRect(), k = el.querySelector('.kws-cyl-ctl').getBoundingClientRect(), n = el.querySelectorAll('.kws-cyl-card')[1].getBoundingClientRect(), tr = getComputedStyle(el.querySelectorAll('.kws-cyl-card')[1]).transform;
    return { card: Math.round(c.height), w: Math.round(c.width), top: Math.round(c.top), ctlBottom: Math.round(k.bottom), gap: Math.round(k.top - c.bottom), sliver: Math.round(innerWidth - n.left), turned: /matrix3d/.test(tr), lines: Math.max(...[...el.querySelectorAll('.kws-cyl-text')].map(t => Math.round(t.offsetHeight / parseFloat(getComputedStyle(t).lineHeight)))) }; }, CYL);
  ok(s.card <= 460 && s.ctlBottom <= 664 - 69, '390x664 with a 64px header and a 69px phone bar: the card and its controls fit on screen', `card ${s.card}px tall, ${s.w}px wide; controls end at ${s.ctlBottom}px of ${664 - 69}px; ${s.gap}px under the card; longest text ${s.lines} lines`);
  ok(s.sliver >= 36 && s.turned, 'the next card shows at the edge, turned on the drum', `${s.sliver}px of it`);
  await p.ctx.close();

  // ---- 11. controls stay 44px however many cards
  for (const [n, w] of [[5, 360], [5, 320], [6, 360], [7, 390], [7, 360], [12, 390]]) {
    p = await open(b, DEMO, { w, h: 800, touch: true }); await remount(p, n); await p.waitForTimeout(200);
    s = await p.evaluate(sel => { const k = document.querySelector(sel + ' .kws-cyl-ctl'), bs = [...k.children].map(x => x.getBoundingClientRect()); return { min: Math.min(...bs.map(r => Math.min(r.width, r.height))), left: Math.min(...bs.map(r => r.left)), right: Math.max(...bs.map(r => r.right)), rows: new Set(bs.map(r => Math.round(r.top))).size, overlap: bs.some((r, i) => bs.some((q, j) => j > i && r.left < q.right - .5 && q.left < r.right - .5 && r.top < q.bottom - .5 && q.top < r.bottom - .5)), sx: document.documentElement.scrollWidth - innerWidth }; }, CYL);
    ok(s.min >= 44 && s.left >= 0 && s.right <= w && !s.overlap && s.sx <= 0, `${n} cards at ${w}px: every control is 44px, on screen, none overlapping`, `${s.rows} row${s.rows > 1 ? 's' : ''}`);
    await p.ctx.close();
  }

  // ---- 12. mounting from code
  p = await open(b, DEMO); await jump(p, CYL);
  s = await p.evaluate(sel => { const el = document.querySelector(sel), off = KWS.cylinder.mount(el), same = KWS.cylinder.mount(el) === off; el.querySelector('.kws-cyl-nav:last-child').click(); off();
    const left = { cls: el.className, role: el.getAttribute('aria-roledescription'), kids: [...el.children].map(c => c.className).join(), cards: el.querySelectorAll('.kws-cyl-card').length, attrs: [...el.querySelectorAll('.kws-cyl-card')].map(c => c.getAttributeNames().join('+')).join() };
    const off2 = KWS.cylinder.mount(el, { start: 2, loop: true, noun: 'stage' }); const st = { on: [...el.querySelectorAll('.kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), cards: el.querySelectorAll('.kws-cyl-card').length, name: el.querySelector('.kws-cyl-nav').getAttribute('aria-label'), dis: el.querySelector('.kws-cyl-nav').getAttribute('aria-disabled') }; off2(); KWS.cylinder.mount(el);
    return { same, left, st }; }, CYL);
  ok(s.same, 'mounting the same element twice returns the same remover');
  ok(s.left.cls === 'kws-cyl' && s.left.role === null && s.left.kids === 'kws-cyl-track' && s.left.cards === 5 && s.left.attrs === 'class,class,class,class,class', 'the remover takes away everything it added: buttons, live region, blank cards, classes, attributes and inline styles', JSON.stringify(s.left));
  ok(s.st.on === 2 && s.st.cards === 5 && s.st.name === 'Previous stage' && s.st.dis === null, 'options from code: start, loop and noun', JSON.stringify(s.st));
  ok(await p.evaluate(sel => { const el = document.querySelector(sel); el.remove(); return true; }, '#client .kws-cyl') && p.errs.length === 0, 'an element removed from the page raises no errors', p.errs.join());
  await p.ctx.close();

  // ---- 13. fallbacks
  p = await open(b, DEMO, { w: 360, h: 760, touch: true }); await jump(p, CYL, -60);
  await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), CYL); await settle(p);
  s = await p.evaluate(sel => [...document.querySelectorAll(sel + ' .kws-cyl-card')].slice(0, 3).map(c => c.style.transform).join(' | '), CYL);
  ok(/^translateX\(-[\d.]+px\) \| none \| translateX\([\d.]+px\)$/.test(s) && await cur(p) === 1, 'under 380px the drum is a flat sliding row with the same controls', s);
  await p.ctx.close();
  p = await open(b, DEMO, { init: () => { const t = setInterval(() => { if (document.documentElement) { document.documentElement.setAttribute('data-kws3d', 'off'); clearInterval(t); } }, 0); new MutationObserver((m, o) => { if (document.documentElement) { document.documentElement.setAttribute('data-kws3d', 'off'); o.disconnect(); } }).observe(document, { childList: true }); } }); await jump(p, CYL);
  s = await p.evaluate(sel => [...document.querySelectorAll(sel + ' .kws-cyl-card')].slice(1, 3).map(c => c.style.transform).join(' | '), CYL);
  ok(/^translateX/.test(s) && !/perspective/.test(s) && await p.evaluate(() => document.querySelector('#included .kws-ring-hub') === null && !document.querySelector('#included .kws-ring').classList.contains('is-live') && getComputedStyle(document.querySelector('#included .kws-ring-stage')).display === 'none'), 'html[data-kws3d="off"]: the drum is flat and the ring gives way to its lists', s);
  await p.ctx.close();
  p = await open(b, DEMO, { js: false, w: 1280 });
  s = await p.evaluate(sel => { const el = document.querySelector(sel), cards = [...el.querySelectorAll('.kws-cyl-card')]; return { n: cards.length, vis: cards.every(c => { const r = c.getBoundingClientRect(), cs = getComputedStyle(c); return r.width > 200 && r.height > 200 && cs.visibility === 'visible' && r.left >= 0 && r.right <= innerWidth; }), cols: new Set(cards.map(c => Math.round(c.getBoundingClientRect().left))).size, ctl: el.querySelectorAll('button').length, bg: getComputedStyle(cards[0], '::after').opacity }; }, CYL);
  ok(s.n === 5 && s.vis && s.cols === 3 && s.ctl === 0 && s.bg === '1', 'script off: a grid of all five cards, three across at 1280px, nothing hidden and no dead buttons', JSON.stringify(s));
  await p.ctx.close();

  // ---- 14. a drum that loops (the bare client page), and long words
  p = await open(b, BARE, { w: 1280 }); const BC = '.kws-cyl'; await jump(p, BC);
  ok(p.errs.length === 0 && await p.evaluate(() => document.querySelectorAll('.kws-cyl.is-live,.kws-ring.is-live').length === 2), 'bare page (no site stylesheet, no site script): both start with no errors', p.errs.join());
  await p.click(BC + ' .kws-cyl-nav'); await settle(p, BC);
  s = await p.evaluate(sel => ({ on: [...document.querySelectorAll(sel + ' .kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), blank: document.querySelectorAll(sel + ' .kws-cyl-card[aria-hidden]').length, dis: document.querySelector(sel + ' .kws-cyl-nav').getAttribute('aria-disabled') }), BC);
  ok(s.on === 4 && s.blank === 0 && s.dis === null, 'a looping drum: Previous at the first card goes round to the last; no blank cards, no dimmed arrow', JSON.stringify(s));
  for (const [url, w] of [[BARE, 360], [DEMO, 390]]) {
    const q = await open(b, url, { w, h: 800, touch: true }); const sel = url === BARE ? '.kws-cyl' : CYL;
    const o = await q.evaluate(sel => { const c = document.querySelector(sel + ' .kws-cyl-card'), L = 'Donaudampfschifffahrtsgesellschaftskapitaensmuetze'; const tagText = c.querySelector('.kws-cyl-tag span'); tagText.firstChild.data = L + ' '; c.querySelector('.kws-cyl-title').textContent = L; c.querySelector('.kws-cyl-text').textContent = L + L;
      const cr = c.getBoundingClientRect(); return { out: [...c.querySelectorAll('.kws-cyl-tag span,.kws-cyl-title,.kws-cyl-text')].map(e => Math.round(e.getBoundingClientRect().right - cr.right)), sx: document.documentElement.scrollWidth - innerWidth }; }, sel);
    ok(o.out.every(v => v <= 0) && o.sx <= 0, `${url === BARE ? 'bare page' : 'demo'} ${w}px: a 50-letter word in the label, the title and the text stays inside the card`, o.out.join());
    await q.ctx.close();
  }
  await p.ctx.close();

  await b.close();
  process.exit(done() ? 1 : 0);
})();
