// Touch at 390: vertical scroll never blocked, horizontal taken, diagonals, slow-swipe threshold, tap behaviour, orientation change.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const log = (ok, name, extra = '') => console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO'}  ${name}  ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`);
(async () => {
  const b = await chromium.launch();
  for (const [name, sel, part, cap] of [['arc', '#services .kws-arc', '.kws-arc-tile', '.kws-arc-cap'], ['spot', '#work .kws-spot', '.kws-spot-frame', '.kws-spot-cap']]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const p = await ctx.newPage(); const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(400); const cdp = await ctx.newCDPSession(p);
    const swipe = async (x0, y0, dx, dy, steps = 12, hold = 0, stepMs = 16) => { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
      for (let i = 1; i <= steps; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + dx * i / steps, y: y0 + dy * i / steps, id: 1 }] }); await p.waitForTimeout(stepMs); }
      if (hold) await p.waitForTimeout(hold); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
    const reset = async () => { await scrollToSel(p, sel, 200); await p.waitForTimeout(250); };
    const pt = async q => { const bx = await p.locator(`${sel} li.is-on ${q}`).first().boundingBox(); return [bx.x + bx.width / 2, bx.y + bx.height / 2]; };
    console.log(`INFO  ${name}: touch-action on list = ${await p.evaluate(s => getComputedStyle(document.querySelector(s + ' ul')).touchAction, sel)}; on control row = ${await p.evaluate(s => getComputedStyle(document.querySelector(s + ' [role=group]')).touchAction, sel)}`);
    // vertical swipes from several start points
    for (const [what, q] of [['picture', part], ['caption', cap], ['link', 'a']]) for (const [dx, dy, label] of [[0, -220, 'straight up'], [0, 220, 'straight down'], [-90, -220, 'slanted up-left (22deg)'], [150, -220, 'slanted up-right (34deg)']]) {
      await reset(); const [x, y] = await pt(q); const s0 = await state(p, sel); await swipe(x, y, dx, dy); await p.waitForTimeout(700); const s1 = await state(p, sel);
      const moved = s1.y - s0.y; const ok = Math.abs(moved) > 120 && Math.sign(moved) === -Math.sign(dy) && s1.on === s0.on && !s1.moving;
      log(ok, `${name}: ${label} swipe starting on the ${what} scrolls the page`, { pageMoved: moved, onBefore: s0.on, onAfter: s1.on }); }
    // 45-degree diagonal: what wins?
    await reset(); { const [x, y] = await pt(part); const s0 = await state(p, sel); await swipe(x, y, -160, -160); await p.waitForTimeout(700); const s1 = await state(p, sel); console.log(`INFO  ${name}: 45deg swipe -> page moved ${s1.y - s0.y}px, item ${s0.on} -> ${s1.on}, moving ${s1.moving}`); }
    // 30deg from horizontal (dx 160, dy 92): ratio 1.74 -> taken by the carousel? page must not scroll AND carousel should move
    await reset(); { const [x, y] = await pt(part); const s0 = await state(p, sel); await swipe(x, y, -160, -92); await settle(p, sel); await p.waitForTimeout(300); const s1 = await state(p, sel); console.log(`INFO  ${name}: 30deg-from-horizontal swipe -> page moved ${s1.y - s0.y}px, item ${s0.on} -> ${s1.on}`); }
    // horizontal flick and slow swipes
    await reset(); { const [x, y] = await pt(part); const s0 = await state(p, sel); await swipe(x, y, -120, 2, 6, 0, 12); await settle(p, sel); const s1 = await state(p, sel); log(s1.on !== s0.on && s1.y === s0.y, `${name}: quick 120px sideways flick turns it; page does not scroll`, { from: s0.on, to: s1.on, pageMoved: s1.y - s0.y, said: s1.said }); }
    for (const dist of [40, 70, 100, 130, 160]) { await reset(); const [x, y] = await pt(part); const s0 = await state(p, sel); await swipe(x, y, -dist, 0, 14, 160, 22); await settle(p, sel); const s1 = await state(p, sel); console.log(`INFO  ${name} 390: slow ${dist}px swipe (released after a pause) ${s1.on === s0.on ? 'SNAPS BACK' : 'advances ' + ((s1.on - s0.on + 9) % 9)}`); if (s1.on !== s0.on) break; }
    // tap on a side item centres it; tap on the centred picture opens the link; tap after swipe does not navigate
    await reset(); { const s0 = await state(p, sel); const side = await p.evaluate(([s, q]) => { const el = document.querySelector(s); const lis = [...el.querySelectorAll('li')]; const on = lis.findIndex(li => li.classList.contains('is-on')); const nx = lis[(on + 1) % lis.length].querySelector(q); const r = nx.getBoundingClientRect(); // find a visible point of the neighbour
        for (let x = r.right - 4; x > r.left; x -= 4) { const t = document.elementFromPoint(x, r.top + r.height / 2); if (t && nx.contains(t)) return [x, r.top + r.height / 2]; } return null; }, [sel, part]);
      if (side) { await p.touchscreen.tap(side[0], side[1]); await settle(p, sel); await p.waitForTimeout(100); const s1 = await state(p, sel); log(s1.on === (s0.on + 1) % s0.tf.length && p.url().endsWith('demo.html'), `${name}: tap on the next item (side) centres it`, { from: s0.on, to: s1.on, url: p.url().split('/').pop() }); } else console.log(`INFO ${name}: no tappable point on the neighbour`); }
    // multi-touch: second finger down during a drag
    await reset(); { const [x, y] = await pt(part); const s0 = await state(p, sel);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 12, y, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 72, y, id: 1 }, { x: x + 60, y: y + 40, id: 2 }] });
      for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 72 - i * 8, y, id: 1 }, { x: x + 60 + i * 8, y: y + 40, id: 2 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); const ok = await settle(p, sel, 3000); const s1 = await state(p, sel); log(ok && s1.nOn === 1, `${name}: a second finger landing mid-drag leaves a clean state`, { on: s1.on, moving: s1.moving }); }
    // touchcancel mid-drag
    await reset(); { const [x, y] = await pt(part);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 12, y, id: 1 }] }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }); const ok = await settle(p, sel, 3000); const s1 = await state(p, sel); log(ok && s1.nOn === 1, `${name}: touchcancel mid-drag settles`, { on: s1.on, moving: s1.moving }); }
    // orientation change while mid-animation
    await reset(); { await p.evaluate(s => document.querySelector(s + ' button[aria-label^="Next"]').click(), sel); await p.waitForTimeout(60); await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(700); await settle(p, sel);
      const g = await p.evaluate(([s, q]) => { const el = document.querySelector(s); const list = el.querySelector('ul').getBoundingClientRect(); const out = [...el.querySelectorAll(q)].filter(e => getComputedStyle(e).visibility !== 'hidden').map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; });
        return { sx: document.documentElement.scrollWidth - innerWidth, list: [Math.round(list.left), Math.round(list.right)], parts: out, onCentre: (() => { const r = el.querySelector('li.is-on ' + q).getBoundingClientRect(); return Math.round(r.left + r.width / 2 - (list.left + list.width / 2)); })() }; }, [sel, part]);
      await scrollToSel(p, sel, 20); await p.waitForTimeout(150); await p.screenshot({ path: `orient-${name}-844x390.png` });
      log(g.sx <= 0 && Math.abs(g.onCentre) <= 1 && g.parts.every(([l, r]) => l >= -1 && r <= 845), `${name}: rotate to 844x390 mid-move: re-measured, centred, nothing outside the window`, g);
      await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
      const g2 = await p.evaluate(([s, q]) => { const el = document.querySelector(s); const list = el.querySelector('ul').getBoundingClientRect(); const r = el.querySelector('li.is-on ' + q).getBoundingClientRect(); return { sx: document.documentElement.scrollWidth - innerWidth, off: Math.round(r.left + r.width / 2 - (list.left + list.width / 2)), parts: [...el.querySelectorAll(q)].filter(e => getComputedStyle(e).visibility !== 'hidden').map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; }) }; }, [sel, part]);
      log(g2.sx <= 0 && Math.abs(g2.off) <= 1 && g2.parts.every(([l, r]) => l >= -1 && r <= 391), `${name}: back to 390x844`, g2); }
    log(errs.length === 0, `${name}: no console errors`, errs.join(';'));
    await ctx.close();
  }
  await b.close();
})();
