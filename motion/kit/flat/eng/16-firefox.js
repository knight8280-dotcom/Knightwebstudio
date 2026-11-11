const pw = require('/opt/node-tools/node_modules/playwright');
const { URL, state, settle, scrollToSel } = require('./lib');
const log = (ok, name, extra = '') => console.log(`${ok === true ? 'PASS' : ok === false ? 'FAIL' : 'INFO'}  ${name}  ${typeof extra === 'string' ? extra : JSON.stringify(extra)}`);
(async () => {
  for (const eng of ['firefox', 'webkit']) {
    let b; try { b = await pw[eng].launch(); } catch (e) { console.log(`INFO  ${eng}: cannot launch here (${e.message.split('\n')[0].slice(0, 120)})`); continue; }
    console.log(`== ${eng} ${b.version()} ==`);
    for (const [name, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['spot', '#work .kws-spot', '.kws-spot-frame']]) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
      await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500); await scrollToSel(p, sel); await p.waitForTimeout(150);
      // drag advances
      { const bx = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const cx = bx.x + bx.width / 2, cy = bx.y + bx.height / 2; const s0 = (await state(p, sel)).on; await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(cx - i * 25, cy); await p.waitForTimeout(16); } await p.mouse.up(); await settle(p, sel); const s1 = await state(p, sel); log(s1.on !== s0 && !s1.moving && p.url().endsWith('demo.html'), `${eng} ${name}: mouse drag turns it, no navigation`, { from: s0, to: s1.on, url: p.url().split('/').pop() }); }
      // click after drag on the link (start and end on the link)
      { await settle(p, sel); const lk = await p.locator(`${sel} li.is-on a`).boundingBox(); const lx = lk.x + lk.width / 2, ly = lk.y + lk.height / 2; const u0 = p.url(); await p.mouse.move(lx, ly); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(lx - i * 12, ly); await p.waitForTimeout(16); } for (let i = 8; i >= 0; i--) { await p.mouse.move(lx - i * 12, ly); await p.waitForTimeout(16); } await p.waitForTimeout(120); await p.mouse.up(); await p.waitForTimeout(600); log(p.url() === u0, `${eng} ${name}: drag out and back released on the link does not navigate`, p.url().split('/').slice(-2).join('/')); if (p.url() !== u0) { await p.goBack(); await p.waitForTimeout(500); await scrollToSel(p, sel); } }
      // plain click on link navigates
      // stale drag
      { await settle(p, sel); const lb = await p.locator(`${sel} ul`).boundingBox(); const ex = lb.x + lb.width / 2, ey = lb.y + lb.height - 3; const s0 = await state(p, sel);
        await p.mouse.move(ex, ey); await p.mouse.down(); await p.mouse.move(ex + 1, ey + 6); await p.mouse.up(); await p.mouse.move(ex - 220, ey + 6); for (let i = 0; i <= 20; i++) { await p.mouse.move(ex - 220 - i * 10, ey - 2 - i); await p.waitForTimeout(16); }
        const s1 = await state(p, sel); log(!s1.moving && s1.tf.join() === s0.tf.join(), `${eng} ${name}: STALE DRAG (button-less hover after an edge press) does not move the carousel`, { moving: s1.moving, changed: s1.tf.join() !== s0.tf.join() }); await p.mouse.click(lb.x + 30, lb.y + lb.height - 30); await p.waitForTimeout(700); }
      // keyboard: tab to second link centres
      { await p.locator(`${sel} li:nth-child(2) a`).focus(); await settle(p, sel); const s = await state(p, sel); log(s.on === 1, `${eng} ${name}: focusing item 2's link centres it`, s.on); await p.keyboard.press('ArrowRight'); await settle(p, sel); const s2 = await state(p, sel); const af = await p.evaluate(() => document.activeElement.getAttribute('aria-label')); log(s2.on === 2, `${eng} ${name}: ArrowRight moves on and focus follows`, { on: s2.on, focus: af }); }
      const us = await p.evaluate(s => getComputedStyle(document.querySelector(s + ' ul')).userSelect, sel); console.log(`INFO  ${eng} ${name}: computed user-select on the stage = ${us}`);
      log(errs.length === 0, `${eng} ${name}: no console errors`, errs.join(';').slice(0, 200)); await ctx.close();
    }
    await b.close();
  }
})();
