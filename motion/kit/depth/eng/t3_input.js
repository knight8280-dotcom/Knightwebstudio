// 3. Input: interruptions, rapid input, touch scroll during a turn, taps on side-card links, pen, multi-touch, resize.
const { chromium, DEMO, BARE, log, ok, open, jump, cur, settle } = require('./lib');
const CYL = '#how .kws-cyl', RING = '#included .kws-ring';
const state = (p, sel = CYL) => p.evaluate(s => { const el = document.querySelector(s), cards = [...el.querySelectorAll('.kws-cyl-card')]; const on = cards.findIndex(c => c.classList.contains('is-on'));
  return { on, moving: el.classList.contains('is-moving'), held: el.classList.contains('is-held'), tOn: cards[on] && cards[on].style.transform, opOn: cards[on] && cards[on].style.opacity, wc: getComputedStyle(cards[0]).willChange, t: cards.map(c => c.style.transform.replace(/perspective\(\d+px\) translateZ\(-?\d+px\) /, '').replace(/ translateZ\(\d+px\)/, '')).join(' | '), dot: [...el.querySelectorAll('.kws-cyl-dot')].findIndex(d => d.getAttribute('aria-current')), said: el.querySelector('.kws-cyl-sr').textContent }; }, sel);
(async () => {
  const b = await chromium.launch();
  // ---------- A. mouse: press on the track while the drum is turning, release without moving
  let p = await open(b, DEMO, { w: 1280, h: 900 });
  await jump(p, CYL); await p.waitForTimeout(300);
  let box = await p.locator(CYL + ' .kws-cyl-track').boundingBox(); const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await p.click(CYL + ' .kws-cyl-nav:last-child'); await p.waitForTimeout(120);
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.waitForTimeout(60); await p.mouse.up();
  await p.waitForTimeout(2500);
  let s = await state(p);
  ok(!s.moving && s.tOn === 'none', 'A. mouse: Next, then a plain click on the middle of the drum 120ms later: the drum finishes its turn', JSON.stringify(s));
  await p.screenshot({ path: 'shots/A-stuck-mouse-1280.png', clip: { x: 0, y: box.y - 20, width: 1280, height: box.height + 110 } });
  await p.ctx.close();

  // ---------- B. touch: swipe the drum, then at once put a finger down on it and scroll the page
  p = await open(b, DEMO, { w: 390, h: 844, touch: true });
  const cdp = await p.ctx.newCDPSession(p);
  await jump(p, CYL, -60); await p.waitForTimeout(300);
  box = await p.locator(CYL + ' .kws-cyl-track').boundingBox(); let x = box.x + box.width / 2, y = box.y + 300;
  const touch = async (pts, gap = 16) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pts[0][0], y: pts[0][1], id: 1 }] }); for (const q of pts.slice(1)) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: q[0], y: q[1], id: 1 }] }); await p.waitForTimeout(gap); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
  const line = (x0, y0, x1, y1, n) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
  await touch(line(x + 60, y, x - 120, y + 3, 8));           // swipe left: go to step 2
  await p.waitForTimeout(100);                               // drum is still settling
  const sy0 = await p.evaluate(() => scrollY);
  await touch(line(x, y + 100, x, y - 150, 10));             // now scroll the page with a finger on the drum
  await p.waitForTimeout(2500);
  s = await state(p); const sy1 = await p.evaluate(() => scrollY);
  ok(!s.moving && s.tOn === 'none', 'B. touch: swipe the drum, then 100ms later scroll the page with a finger on it: the drum finishes its turn', `page scrolled ${sy1 - sy0}px; ${JSON.stringify(s)}`);
  await jump(p, CYL, -60); await p.waitForTimeout(200);
  await p.screenshot({ path: 'shots/B-stuck-touch-390.png' });
  // does it recover on the next action?
  await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), CYL); await p.waitForTimeout(1500);
  const s2 = await state(p);
  log('   after pressing Next once more: ' + JSON.stringify({ on: s2.on, moving: s2.moving, tOn: s2.tOn }));

  // ---------- C. touch: tap a link on a side card (the click arrives in a later task than pointerup)
  await p.evaluate(s => { const c = document.querySelectorAll(s + ' .kws-cyl-card'); c.forEach((li, i) => { const a = document.createElement('a'); a.href = '#step-' + (i + 1); a.textContent = 'Read about step ' + (i + 1); a.className = 'x-link'; a.style.cssText = 'display:block;padding:14px 0'; li.append(a); }); history.replaceState(null, '', location.pathname); }, CYL);
  await p.waitForTimeout(300);
  let on0 = await cur(p, CYL);
  // find a visible bit of the next card's link
  const tapSide = async () => { const r = await p.evaluate(([s, i]) => { const cards = document.querySelectorAll(s + ' .kws-cyl-card'); const a = cards[(i + 1) % cards.length].querySelector('.x-link'); const r = a.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom }; }, [CYL, on0]); const tx = Math.min(388, Math.max(r.l + 4, 372)), ty = (r.t + r.b) / 2; const hit = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && (e.className || e.tagName); }, [tx, ty]); return { tx, ty, hit, r }; };
  let t = await tapSide();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: t.tx, y: t.ty, id: 1 }] }); await p.waitForTimeout(40); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(1500);
  let hash = await p.evaluate(() => location.hash), on1 = await cur(p, CYL);
  ok(hash === '' && on1 === (on0 + 1) % 5, 'C. touch: a tap on a link on the side card brings it round and does not follow the link', `hit ${t.hit} at ${Math.round(t.tx)},${Math.round(t.ty)}; step ${on0} > ${on1}; hash "${hash}"`);
  await p.ctx.close();

  // ---------- D. rapid input
  p = await open(b, DEMO, { w: 1280, h: 900 });
  await jump(p, CYL); await p.waitForTimeout(200);
  for (let i = 0; i < 23; i++) { await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), CYL); await p.waitForTimeout(15); }
  let r = await settle(p, CYL); s = await state(p);
  ok(r !== 'TIMEOUT' && s.on === 23 % 5 && s.dot === s.on && s.tOn === 'none', 'D. 23 quick presses of Next land on the right card, dot agrees', JSON.stringify({ on: s.on, dot: s.dot, tOn: s.tOn, said: s.said }));
  for (let i = 0; i < 12; i++) { await p.evaluate(([s, i]) => document.querySelectorAll(s + ' .kws-cyl-dot')[i % 5].click(), [CYL, i * 3]); await p.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight').catch(() => {}); await p.waitForTimeout(10); }
  r = await settle(p, CYL); s = await state(p);
  ok(r !== 'TIMEOUT' && s.dot === s.on && s.tOn === 'none' && s.wc === 'auto', 'D. mixed dots and keys in a burst: settles, dot agrees, will-change released', JSON.stringify({ on: s.on, dot: s.dot, wc: s.wc }));
  // drag wildly past many cards
  box = await p.locator(CYL + ' .kws-cyl-track').boundingBox();
  await p.mouse.move(box.x + 900, box.y + 200); await p.mouse.down(); for (let i = 0; i < 30; i++) await p.mouse.move(box.x + 900 - i * 60, box.y + 200 + (i % 3)); await p.mouse.up();
  r = await settle(p, CYL); s = await state(p);
  ok(r !== 'TIMEOUT' && s.tOn === 'none' && !s.held, 'D. a long fast mouse drag (1,700px) settles flat on a card', JSON.stringify({ on: s.on, held: s.held }));
  // drag, leave the window, release outside
  await p.mouse.move(box.x + 640, box.y + 200); await p.mouse.down(); await p.mouse.move(box.x + 500, box.y + 200, { steps: 4 }); await p.mouse.move(-50, -50, { steps: 3 }); await p.mouse.up();
  r = await settle(p, CYL); s = await state(p);
  ok(r !== 'TIMEOUT' && s.tOn === 'none' && !s.held, 'D. drag, leave the window, release outside: settles, not left held', JSON.stringify({ on: s.on, held: s.held, moving: s.moving }));
  // right button and middle button do nothing
  const onB = s.on; await p.mouse.move(box.x + 640, box.y + 200); await p.mouse.down({ button: 'right' }); await p.mouse.move(box.x + 400, box.y + 200, { steps: 4 }); await p.mouse.up({ button: 'right' }); await p.waitForTimeout(600); s = await state(p);
  ok(s.on === onB && !s.moving, 'D. a right-button drag does nothing');
  // wheel is not hijacked: wheel over the drum scrolls the page; horizontal wheel does nothing odd
  const y0 = await p.evaluate(() => scrollY); await p.mouse.move(box.x + 640, box.y + 200); await p.mouse.wheel(0, 300); await p.waitForTimeout(400); const y1 = await p.evaluate(() => scrollY);
  const on2 = (await state(p)).on; await p.mouse.wheel(300, 0); await p.waitForTimeout(400); s = await state(p);
  ok(y1 - y0 === 300 && s.on === on2, 'D. wheel over the drum scrolls the page 300px and does not turn it; sideways wheel does not turn it either', `scrolled ${y1 - y0}`);
  await p.ctx.close();

  // ---------- E. pen (CDP mouse event with pointerType pen)
  p = await open(b, DEMO, { w: 1280, h: 900 });
  const c2 = await p.ctx.newCDPSession(p);
  await jump(p, CYL); await p.waitForTimeout(200);
  box = await p.locator(CYL + ' .kws-cyl-track').boundingBox();
  await p.evaluate(() => { window.__pt = []; document.querySelector('.kws-cyl-track').addEventListener('pointerdown', e => window.__pt.push(e.pointerType)); });
  const pen = (type, x, y, buttons) => c2.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: 1, pointerType: 'pen' });
  await pen('mousePressed', box.x + 700, box.y + 200, 1); for (let i = 1; i <= 10; i++) { await pen('mouseMoved', box.x + 700 - i * 30, box.y + 200, 1); await p.waitForTimeout(16); } await pen('mouseReleased', box.x + 400, box.y + 200, 0);
  r = await settle(p, CYL); s = await state(p);
  ok(s.on === 1 && s.tOn === 'none', 'E. pen drag turns the drum one step', `pointerType seen: ${await p.evaluate(() => window.__pt.join())}; step ${s.on}`);
  await p.ctx.close();

  // ---------- F. two fingers on the drum (pinch): state afterwards
  p = await open(b, DEMO, { w: 390, h: 844, touch: true });
  const c3 = await p.ctx.newCDPSession(p);
  await jump(p, CYL, -60); await p.waitForTimeout(300);
  box = await p.locator(CYL + ' .kws-cyl-track').boundingBox(); x = box.x + box.width / 2; y = box.y + 300;
  await c3.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x + 40, y, id: 1 }] });
  for (let i = 1; i <= 5; i++) { await c3.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40 - i * 12, y, id: 1 }] }); await p.waitForTimeout(16); }
  await c3.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 20, y, id: 1 }, { x: x - 80, y: y + 60, id: 2 }] });
  await p.waitForTimeout(30);
  await c3.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [{ x: x - 80, y: y + 60, id: 2 }] });   // first finger lifts
  await p.waitForTimeout(30);
  await c3.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(2000); s = await state(p);
  ok(!s.moving && !s.held && s.tOn === 'none', 'F. a second finger lands mid-drag, then both lift: the drum settles and is not left held', JSON.stringify({ on: s.on, moving: s.moving, held: s.held, tOn: s.tOn, t: s.t }));
  const ta = await p.evaluate(() => [getComputedStyle(document.querySelector('.kws-cyl-track')).touchAction, getComputedStyle(document.querySelector('.kws-ring-stage')).touchAction]);
  log('   touch-action: track "' + ta[0] + '", ring stage "' + ta[1] + '" (pinch-zoom is ' + (/pinch-zoom/.test(ta[0]) ? 'allowed' : 'NOT allowed') + ' when it starts on them)');
  await p.ctx.close();

  // ---------- G. resize and orientation change
  p = await open(b, DEMO, { w: 390, h: 844, touch: true });
  await jump(p, CYL, -60); await p.evaluate(s => document.querySelector(s + ' .kws-cyl-nav:last-child').click(), CYL); await settle(p, CYL);
  const sizes = [[844, 390], [360, 740], [390, 844], [1280, 800], [379, 700], [381, 700]];
  for (const [w, h] of sizes) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(350);
    const g = await p.evaluate(([s, rs]) => { const el = document.querySelector(s), cards = [...el.querySelectorAll('.kws-cyl-card')], on = cards.find(c => c.classList.contains('is-on')), r = on.getBoundingClientRect(), nb = cards[2].style.transform, tr = el.querySelector('.kws-cyl-track').getBoundingClientRect(); const st = document.querySelector(rs + ' .kws-ring-stage'), hub = st.querySelector('.kws-ring-hub'); return { on: cards.indexOf(on), centred: Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 1.5, flat: !/rotateY/.test(nb), nb, sw: document.documentElement.scrollWidth - innerWidth, ring: getComputedStyle(st).display, R: st.style.getPropertyValue('--R'), stW: Math.round(st.clientWidth) }; }, [CYL, RING]);
    ok(g.on === 1 && g.centred && g.sw <= 0 && (w < 380 ? g.flat && g.ring === 'none' : !g.flat && g.ring === 'block') && (w < 380 || Math.abs(parseFloat(g.R) - Math.min(g.stW / 2, 420)) < 1), `G. resize to ${w}x${h}: step kept, centred, right mode, ring radius follows`, JSON.stringify(g));
  }
  ok(p.errs.length === 0, 'G. no console errors', p.errs.join('|'));
  await p.ctx.close();
  await b.close();
})();
