// Mouse behaviour that review found wanting: a press whose release is lost must not leave the carousel following the mouse;
// a slightly wobbly click on a link is still a click; Ctrl+click on the centred sign or card opens a new tab; the cursors and
// the hover and pressed states say what will happen. (WebKit reports a link's own cursor as "auto"; it still shows a hand.)
const { chromium, say, done, open, on, bring, A, S } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const [name, sel, part, link] of [['wheel', A, '.kws-arc-tile', '.kws-arc-link'], ['spotlight', S, '.kws-spot-frame', '.kws-spot-link']]) {
    // 1. A sloppy click: press in the bottom of the stage, let go on the Next arrow below it, then move back over the stage
    { const { ctx, p, errs } = await open(b); await bring(p, sel);
      const stage = await p.locator(sel + ' > ul').boundingBox(), next = await p.locator(`${sel} [aria-label^="Next"]`).boundingBox();
      const nx = next.x + next.width / 2, ny = next.y + next.height / 2;
      await p.mouse.move(nx, next.y - 6); await p.mouse.down(); await p.mouse.move(nx, ny, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(900);
      const i0 = await on(p, sel);
      for (let i = 0; i <= 12; i++) { await p.mouse.move(stage.x + stage.width / 2 - i * 25, stage.y + 70); await p.waitForTimeout(16); }
      await p.waitForTimeout(700);
      const i1 = await on(p, sel), moving = await p.evaluate(s => document.querySelector(s).classList.contains('is-moving'), sel);
      await p.mouse.click(nx, ny); await p.waitForTimeout(900); const i2 = await on(p, sel);
      say(`${name}: after a press released outside the stage, moving the mouse over it turns nothing, and Next still works`, i1 === i0 && !moving && i2 === (i0 + 1) % (name === 'wheel' ? 9 : 3), `item ${i0 + 1}, after hovering ${i1 + 1}, after Next ${i2 + 1}`);
      // the same with the release lost altogether (the button comes up in another window)
      await p.evaluate(s => document.querySelector(s + ' [class$="-dot"]').click(), sel); await p.waitForTimeout(900);
      await p.mouse.move(stage.x + stage.width / 2, stage.y + 70);
      await p.evaluate(([s, x, y]) => document.querySelector(s + ' > ul').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1, isPrimary: true, button: 0, buttons: 1, clientX: x, clientY: y, pointerType: 'mouse' })), [sel, stage.x + stage.width / 2, stage.y + 70]);
      for (let i = 0; i <= 12; i++) { await p.mouse.move(stage.x + stage.width / 2 - i * 25, stage.y + 70); await p.waitForTimeout(16); }
      await p.waitForTimeout(700);
      say(`${name}: a press whose release never arrives does not leave it following the mouse`, await on(p, sel) === 0, `item ${await on(p, sel) + 1}`);
      say(`${name}: no console errors`, errs.length === 0, errs.join('|')); await ctx.close(); }
    // 2. A click on the caption link with 10px of sideways wobble still opens it; a real drag from the link does not
    { const { ctx, p } = await open(b); await bring(p, sel);
      const lb = await p.locator(`${sel} li.is-on ${link}`).boundingBox(); const x = lb.x + lb.width / 2, y = lb.y + lb.height / 2;
      await p.mouse.move(x - 5, y); await p.mouse.down(); await p.mouse.move(x, y + 1); await p.mouse.move(x + 5, y + 2); await p.mouse.up(); await p.waitForTimeout(700);
      say(`${name}: a click on the link with 10px of wobble still follows it`, !/demo\.html$/.test(p.url()), p.url().replace(/^.*8730/, ''));
      await ctx.close(); }
    // 3. Ctrl+click on the centred sign or card opens its link in a new tab and never moves this page; a plain click follows it here.
    //    Headless Chromium drops some Ctrl+clicks even on a real link (about one in three here), so this tries up to five times and
    //    compares with the caption link itself: what must never happen is the page itself going to the link.
    { let opened = 0, went = 0, tries = 0, linkOpened = 0;
      for (; tries < 5 && !opened; tries++) for (const target of [part, link]) {
        const { ctx, p } = await open(b); await bring(p, sel);
        const m = await p.locator(`${sel} li.is-on ${target}`).boundingBox();
        await p.keyboard.down('Control');
        const [popup] = await Promise.all([ctx.waitForEvent('page', { timeout: 4000 }).catch(() => null), p.mouse.click(m.x + m.width / 2, m.y + m.height / 2)]);
        await p.keyboard.up('Control'); await p.waitForTimeout(300);
        if (target === part) { if (popup) opened++; if (!/demo\.html$/.test(p.url())) went++; } else if (popup) linkOpened++;
        await ctx.close();
      }
      say(`${name}: Ctrl+click on the centred one opens a new tab and never moves this page`, opened > 0 && went === 0, `new tab on try ${tries} of 5; this page left 0 times; the caption link itself opened a tab in ${linkOpened} of ${tries} tries`); }
    // 4. Cursors, hover and pressed states
    { const { ctx, p } = await open(b); await bring(p, sel);
      const cur = s => p.evaluate(q => getComputedStyle(document.querySelector(q)).cursor, s);
      const lift = s => p.evaluate(q => getComputedStyle(document.querySelector(q)).translate, s);
      const m = await p.locator(`${sel} li.is-on ${part}`).boundingBox(), stage = await p.locator(sel + ' > ul').boundingBox();
      const c = { part: await cur(`${sel} li.is-on ${part}`), stage: await cur(sel + ' > ul'), link: await cur(`${sel} li.is-on ${link}`), arrow: await cur(`${sel} [aria-label^="Next"]`) };
      await p.mouse.move(m.x + m.width / 2, m.y + m.height / 2); await p.waitForTimeout(100); const hover = await lift(`${sel} li.is-on ${part}`);
      await p.mouse.down(); await p.waitForTimeout(60); const pressed = await lift(`${sel} li.is-on ${part}`);
      for (let i = 1; i <= 8; i++) { await p.mouse.move(m.x + m.width / 2 - i * 10, m.y + m.height / 2); await p.waitForTimeout(16); }
      const dragging = { part: await cur(`${sel} li.is-on ${part}`), stage: await cur(sel + ' > ul') };
      await p.mouse.move(m.x + m.width / 2, m.y + m.height / 2, { steps: 6 }); await p.waitForTimeout(150); await p.mouse.up(); await p.waitForTimeout(900);
      const after = await cur(`${sel} li.is-on ${part}`);
      say(`${name}: the cursor is a pointer on a sign or card, link and arrows, a grab hand on the rest of the stage, and a closed hand while dragging`,
        c.part === 'pointer' && c.stage === 'grab' && /pointer|auto/.test(c.link) && c.arrow === 'pointer' && dragging.part === 'grabbing' && dragging.stage === 'grabbing' && after === 'pointer', JSON.stringify({ c, dragging, after }));
      say(`${name}: a sign or card lifts on hover and sinks when pressed`, /-2px/.test(hover) && /0px 1px/.test(pressed), `hover ${hover}; pressed ${pressed}`);
      const ab = await p.locator(`${sel} [aria-label^="Next"]`).boundingBox(); await p.mouse.move(ab.x + 22, ab.y + 22); await p.waitForTimeout(80);
      const ah = await lift(`${sel} [aria-label^="Next"]`); await p.mouse.down(); const ap = await lift(`${sel} [aria-label^="Next"]`); await p.mouse.up(); await p.waitForTimeout(1000);
      const lb = await p.locator(`${sel} li.is-on ${link}`).boundingBox(); await p.mouse.move(lb.x + 20, lb.y + 20); await p.waitForTimeout(80); const lh = await lift(`${sel} li.is-on ${link}`);
      say(`${name}: arrows and the caption link do the same`, /-2px/.test(ah) && /0px 1px/.test(ap) && /-2px/.test(lh), `arrow hover ${ah}, pressed ${ap}; link hover ${lh}`);
      await ctx.close(); }
  }
  await done(b);
})();
