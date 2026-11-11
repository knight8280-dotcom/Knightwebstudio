// Mouse / pen / touch / wheel / keys / rapid input. Independent of the builder's tests.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const log = (ok, name, extra = '') => console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO'}  ${name}  ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`);
(async () => {
  const b = await chromium.launch();
  // ---------- desktop mouse ----------
  for (const [name, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['spot', '#work .kws-spot', '.kws-spot-frame']]) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const p = await ctx.newPage(); const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(400); await scrollToSel(p, sel);
    const box = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
    // 1 mouse drag left by 1 step
    await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(cx - i * 15, cy + 1); await p.waitForTimeout(16); } const mid = await state(p, sel); await p.waitForTimeout(150); await p.mouse.up(); await settle(p, sel); let s = await state(p, sel);
    log(s.on > 0 && s.nOn === 1 && !s.moving, `${name}: mouse drag left moves forward and settles on one item`, { midMoving: mid.moving, on: s.on, said: s.said });
    // 2 mouse drag that ends outside the window
    const before = s.on; await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(cx + i * 40, cy - i * 60); await p.waitForTimeout(10); } await p.mouse.up(); await settle(p, sel); s = await state(p, sel);
    log(!s.moving && s.nOn === 1, `${name}: drag released far outside the stage still settles`, { before, on: s.on });
    // 3 mostly vertical mouse drag is not taken
    const b3 = s.on; await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(cx + i * 3, cy + i * 12); await p.waitForTimeout(10); } await p.mouse.up(); await settle(p, sel); s = await state(p, sel);
    log(s.on === b3, `${name}: a mostly vertical mouse drag does not turn it`, { b3, on: s.on });
    // 4 STALE DRAG: press near the bottom edge of the list, leave the list by <8px, release outside, hover back sideways with NO button
    const lb = await p.locator(`${sel} ul`).boundingBox(); const ex = lb.x + lb.width / 2, ey = lb.y + lb.height - 3;
    const b4 = (await state(p, sel)).on; const tf0 = (await state(p, sel)).tf.join('|');
    await p.mouse.move(ex, ey); await p.mouse.down(); await p.mouse.move(ex + 1, ey + 6); await p.mouse.up();
    await p.mouse.move(ex, ey - 40); for (let i = 1; i <= 15; i++) { await p.mouse.move(ex - i * 14, ey - 40); await p.waitForTimeout(16); }
    const hov = await state(p, sel); await p.waitForTimeout(600); const hov2 = await state(p, sel);
    log(hov.tf.join('|') === tf0 && !hov.moving, `${name}: after press at the list edge + release just outside, hovering sideways with no button does NOT drag the carousel`, { movingWhileHover: hov.moving, changed: hov.tf.join('|') !== tf0, stillMoving600ms: hov2.moving, onBefore: b4, onNow: hov2.on });
    await p.mouse.click(5, 5); await p.waitForTimeout(500); await settle(p, sel);
    // 5 rapid next x 25 then prev x 25
    await scrollToSel(p, sel); const s5 = (await state(p, sel)).on; const n = await p.locator(`${sel} li`).count();
    for (let i = 0; i < 25; i++) await p.locator(`${sel} button[aria-label^="Next"]`).click({ delay: 0, noWaitAfter: true });
    await settle(p, sel, 6000); s = await state(p, sel); log(s.on === (s5 + 25) % n && s.nOn === 1 && !s.moving, `${name}: 25 rapid Next clicks land on the right item`, { start: s5, on: s.on, want: (s5 + 25) % n, said: s.said });
    for (let i = 0; i < 25; i++) await p.keyboard.press('ArrowLeft'); await settle(p, sel, 6000); s = await state(p, sel);
    log(s.on === s5 && !s.moving, `${name}: 25 rapid ArrowLeft return to start`, { on: s.on, want: s5 });
    // 6 key combos left alone; Home/End
    const u0 = p.url(); await p.locator(`${sel} button[aria-label^="Next"]`).focus(); await p.keyboard.press('Shift+ArrowRight'); await settle(p, sel); const sh = (await state(p, sel)).on;
    log(null, `${name}: Shift+ArrowRight moves the carousel (shift not excluded)`, { from: s.on, to: sh });
    // 7 wheel
    const y0 = await p.evaluate(() => scrollY); await p.mouse.move(cx, cy); await p.mouse.wheel(0, 200); await p.waitForTimeout(300); const y1 = await p.evaluate(() => scrollY); const sw = await state(p, sel);
    await p.mouse.wheel(300, 0); await p.waitForTimeout(300); const sw2 = await state(p, sel);
    log(y1 - y0 === 200 && sw.on === sh && sw2.on === sh, `${name}: vertical wheel scrolls page ${y1 - y0}px, horizontal wheel does not turn it`, { on: sw2.on });
    // 8 pen drag via CDP
    await scrollToSel(p, sel); await p.waitForTimeout(100); const cdp = await ctx.newCDPSession(p); const bb = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const px = bb.x + bb.width / 2, py = bb.y + bb.height / 2; const s8 = (await state(p, sel)).on;
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px, y: py, pointerType: 'pen' });
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: px, y: py, button: 'left', buttons: 1, clickCount: 1, pointerType: 'pen' });
    for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px - i * 15, y: py, button: 'left', buttons: 1, pointerType: 'pen' }); await p.waitForTimeout(16); }
    await p.waitForTimeout(120);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: px - 180, y: py, button: 'left', buttons: 0, clickCount: 1, pointerType: 'pen' });
    await settle(p, sel); s = await state(p, sel); log(s.on !== s8 && !s.moving, `${name}: pen drag turns it`, { from: s8, on: s.on });
    // 9 click-after-drag: drag starting on the centred item's link, release on it
    await scrollToSel(p, sel); await p.waitForTimeout(100);
    const lk = await p.locator(`${sel} li.is-on a`).boundingBox(); const lx = lk.x + lk.width / 2, ly = lk.y + lk.height / 2; const url0 = p.url();
    await p.mouse.move(lx, ly); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(lx - i * 12, ly); await p.waitForTimeout(16); } for (let i = 8; i >= 0; i--) { await p.mouse.move(lx - i * 12, ly); await p.waitForTimeout(16); } await p.waitForTimeout(150); await p.mouse.up(); await p.waitForTimeout(500);
    log(p.url() === url0, `${name}: drag out and back, released on the link it started on, does not navigate`, p.url());
    // 10 slow drag where release happens >60ms... tiny drag of 9px then release on link (below 24px) - should it navigate? record
    await settle(p, sel); const lk2 = await p.locator(`${sel} li.is-on a`).boundingBox(); const l2x = lk2.x + lk2.width / 2, l2y = lk2.y + lk2.height / 2;
    await p.mouse.move(l2x, l2y); await p.mouse.down(); await p.mouse.move(l2x + 5, l2y); await p.mouse.move(l2x + 10, l2y); await p.mouse.up(); await p.waitForTimeout(500);
    log(null, `${name}: a 10px wobble while clicking the link ${p.url() === url0 ? 'is swallowed as a drag (no navigation)' : 'navigates'}`, p.url());
    if (p.url() !== url0) { await p.goBack(); await p.waitForTimeout(400); }
    // 11 ctrl-click on the centred sign/card: opens in same tab? (programmatic click ignores modifiers)
    log(errs.length === 0, `${name}: no console errors during the above`, errs.join(' ; '));
    await ctx.close();
  }
  await b.close();
})();
