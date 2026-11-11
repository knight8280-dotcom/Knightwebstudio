// Mouse / pen / wheel / keys / rapid input, second pass (fixes to my own test: spot drag distance, stale-drag re-entry path)
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
const log = (ok, name, extra = '') => console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO'}  ${name}  ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`);
(async () => {
  const b = await chromium.launch();
  for (const [name, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['spot', '#work .kws-spot', '.kws-spot-frame']]) for (const W of [1280]) {
    const fresh = async () => { const ctx = await b.newContext({ viewport: { width: W, height: 800 } }); const p = await ctx.newPage(); p.errs = []; p.on('console', m => m.type() === 'error' && p.errs.push(m.text())); p.on('pageerror', e => p.errs.push('PAGEERR ' + e.message));
      await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(400); await scrollToSel(p, sel); await p.waitForTimeout(100); return [ctx, p]; };
    let [ctx, p] = await fresh();
    const centre = async () => { const box = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); return [box.x + box.width / 2, box.y + box.height / 2, box]; };
    // A: slow mouse drags of increasing length, released after a 150ms pause: how far before it advances?
    for (const dist of [30, 60, 100, 140, 180, 220, 260]) { const [cx, cy] = await centre(); const s0 = (await state(p, sel)).on;
      await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(cx - dist * i / 10, cy + 1); await p.waitForTimeout(16); } await p.waitForTimeout(150); await p.mouse.up(); await settle(p, sel); const s1 = (await state(p, sel)).on;
      console.log(`INFO  ${name} ${W}: slow drag of ${dist}px ${s1 === s0 ? 'snaps back' : 'advances ' + (s1 - s0)}`);
      if (s1 !== s0) break; }
    await ctx.close(); [ctx, p] = await fresh();
    // B: STALE DRAG. Press 3px inside the list's bottom edge, slip 6px down out of the list, release there (pointerup never reaches the list).
    //    Then come back into the list sideways with NO button held.
    { const lb = await p.locator(`${sel} ul`).boundingBox(); const ex = lb.x + lb.width / 2, ey = lb.y + lb.height - 3; const s0 = await state(p, sel);
      await p.mouse.move(ex, ey); await p.mouse.down(); await p.mouse.move(ex + 1, ey + 6); await p.mouse.up();
      await p.mouse.move(ex - 220, ey + 6); // travel outside the list
      for (let i = 0; i <= 20; i++) { await p.mouse.move(ex - 220 - i * 10, ey - 2 - i); await p.waitForTimeout(16); } // re-enter, moving sideways, no button
      const s1 = await state(p, sel); await p.screenshot({ path: `stale-drag-${name}.png` });
      for (let i = 0; i <= 20; i++) { await p.mouse.move(ex - 420 + i * 25, ey - 30); await p.waitForTimeout(16); }
      const s2 = await state(p, sel); await p.waitForTimeout(800); const s3 = await state(p, sel);
      const bug = s1.moving || s1.tf.join('|') !== s0.tf.join('|');
      log(!bug, `${name}: STALE DRAG - after a press whose release happened just outside the list, a button-less hover must not drag the carousel`, { movingDuringHover: s1.moving, transformsChanged: s1.tf.join('|') !== s0.tf.join('|'), stillMovingAfter800msIdle: s3.moving, onBefore: s0.on, onDuringHover: s2.on });
      await p.mouse.click(4, 300); await p.waitForTimeout(300); const s4 = await state(p, sel); console.log(`INFO  ${name}: after one more click elsewhere: moving=${s4.moving} on=${s4.on}`); }
    await ctx.close(); [ctx, p] = await fresh();
    // C: drag ends outside viewport
    { const [cx, cy] = await centre(); await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(cx + i * 60, cy - i * 60); await p.waitForTimeout(10); } await p.mouse.up(); const ok = await settle(p, sel); const s = await state(p, sel); log(ok && s.nOn === 1, `${name}: drag released outside the stage settles`, { on: s.on }); }
    // D: rapid
    { const s5 = (await state(p, sel)).on; const n = await p.locator(`${sel} li`).count();
      await p.evaluate(s => { const nx = document.querySelector(s + ' button[aria-label^="Next"]'); for (let i = 0; i < 25; i++) nx.click(); }, sel);
      await settle(p, sel, 8000); let s = await state(p, sel); log(s.on === (s5 + 25) % n && s.nOn === 1 && !s.moving, `${name}: 25 Next clicks in one task land right`, { start: s5, on: s.on, want: (s5 + 25) % n, said: s.said });
      await p.locator(`${sel} button[aria-label^="Next"]`).focus(); for (let i = 0; i < 25; i++) await p.keyboard.press('ArrowLeft'); await settle(p, sel, 8000); s = await state(p, sel); log(s.on === s5 && !s.moving, `${name}: 25 ArrowLeft return to start`, { on: s.on, want: s5 });
      // mixed: click dot 3 while dragging
      const [cx, cy] = await centre(); await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(cx - i * 20, cy); await p.waitForTimeout(16); }
      await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); for (let i = 6; i <= 9; i++) { await p.mouse.move(cx - i * 20, cy); await p.waitForTimeout(16); } await p.mouse.up(); const ok = await settle(p, sel, 5000); s = await state(p, sel); log(ok && s.nOn === 1, `${name}: arrow keys pressed mid-drag do not break state`, { on: s.on, moving: s.moving }); }
    // E: wheel
    { const [cx, cy] = await centre(); const s0 = (await state(p, sel)).on; const y0 = await p.evaluate(() => scrollY); await p.mouse.move(cx, cy); await p.mouse.wheel(0, 200); await p.waitForTimeout(300); const y1 = await p.evaluate(() => scrollY);
      await p.mouse.wheel(300, 0); await p.waitForTimeout(300); const s = await state(p, sel); log(y1 - y0 === 200 && s.on === s0 && !s.moving, `${name}: vertical wheel scrolls the page ${y1 - y0}px; horizontal wheel leaves the carousel alone`, { on: s.on });
      const wl = await p.evaluate(() => typeof getEventListeners); }
    // F: pen
    { await scrollToSel(p, sel); await p.waitForTimeout(100); const cdp = await ctx.newCDPSession(p); const [px, py] = await centre(); const s8 = (await state(p, sel)).on;
      const types = await p.evaluate(s => { window.__pt = []; document.querySelector(s + ' ul').addEventListener('pointerdown', e => window.__pt.push(e.pointerType), { passive: true }); }, sel);
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px, y: py, pointerType: 'pen' });
      await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: px, y: py, button: 'left', buttons: 1, clickCount: 1, pointerType: 'pen' });
      for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: px - i * 25, y: py, button: 'left', buttons: 1, pointerType: 'pen' }); await p.waitForTimeout(16); }
      await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: px - 300, y: py, button: 'left', buttons: 0, clickCount: 1, pointerType: 'pen' });
      await settle(p, sel); const s = await state(p, sel); log(s.on !== s8 && !s.moving, `${name}: pen drag turns it`, { from: s8, on: s.on, pointerTypes: await p.evaluate(() => window.__pt) }); }
    // G: click after drag
    { await scrollToSel(p, sel); await p.waitForTimeout(100); const lk = await p.locator(`${sel} li.is-on a`).boundingBox(); const lx = lk.x + lk.width / 2, ly = lk.y + lk.height / 2; const url0 = p.url();
      await p.mouse.move(lx, ly); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(lx - i * 12, ly); await p.waitForTimeout(16); } for (let i = 8; i >= 0; i--) { await p.mouse.move(lx - i * 12, ly); await p.waitForTimeout(16); } await p.waitForTimeout(150); await p.mouse.up(); await p.waitForTimeout(500);
      log(p.url() === url0, `${name}: drag out and back, released on the link it started on, does not navigate`, p.url()); await settle(p, sel);
      const lk2 = await p.locator(`${sel} li.is-on a`).boundingBox(); const l2x = lk2.x + lk2.width / 2, l2y = lk2.y + lk2.height / 2;
      await p.mouse.move(l2x, l2y); await p.mouse.down(); await p.mouse.move(l2x + 5, l2y); await p.mouse.move(l2x + 10, l2y); await p.mouse.up(); await p.waitForTimeout(500);
      console.log(`INFO  ${name}: a click on the link with a 10px sideways wobble ${p.url() === url0 ? 'is swallowed as a drag (the link does NOT open)' : 'opens the link'}`);
      if (p.url() !== url0) { await p.goBack(); await p.waitForTimeout(500); } }
    // H: ctrl/meta click on the centred picture: does it respect the modifier (new tab) or navigate this tab?
    { await scrollToSel(p, sel); await p.waitForTimeout(100); const [cx, cy] = await centre(); const url0 = p.url(); const pages0 = ctx.pages().length;
      await p.keyboard.down('Control'); await p.mouse.click(cx, cy); await p.keyboard.up('Control'); await p.waitForTimeout(600);
      console.log(`INFO  ${name}: Ctrl+click on the centred picture -> this tab ${p.url() === url0 ? 'stays' : 'NAVIGATES to ' + p.url()}, tabs ${pages0} -> ${ctx.pages().length}`);
      if (p.url() !== url0) { await p.goBack(); await p.waitForTimeout(500); } }
    log(p.errs.length === 0, `${name}: no console errors`, p.errs.join(' ; '));
    await ctx.close();
  }
  await b.close();
})();
