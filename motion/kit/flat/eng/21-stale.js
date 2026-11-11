// Stale drag, natural variant: a sloppy click that starts in the bottom few px of the stage and ends on the control row beneath it.
const { chromium, URL, state, settle, scrollToSel } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const [name, sel] of [['arc', '#services .kws-arc'], ['spot', '#work .kws-spot']]) {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(500); await scrollToSel(p, sel, 140); await p.waitForTimeout(200);
    const lb = await p.locator(`${sel} ul`).boundingBox(); const nb = await p.locator(`${sel} button[aria-label^="Next"]`).boundingBox();
    const gap = Math.round(nb.y - (lb.y + lb.height));
    const s0 = await state(p, sel);
    // press 4px above the stage's bottom edge, directly above the Next arrow; release on the Next arrow (a sloppy click)
    const x = nb.x + nb.width / 2; await p.mouse.move(x, lb.y + lb.height - 4); await p.mouse.down(); await p.mouse.move(x, lb.y + lb.height + 2, { steps: 2 }); await p.mouse.move(x, nb.y + 10, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(700);
    const s1 = await state(p, sel);
    // now simply move the mouse up across the stage and sideways (no button)
    await p.mouse.move(x - 40, lb.y + lb.height - 20, { steps: 4 }); for (let i = 0; i < 25; i++) { await p.mouse.move(x - 40 - i * 12, lb.y + lb.height - 60 - i * 2); await p.waitForTimeout(16); }
    const s2 = await state(p, sel); await p.screenshot({ path: `stale-natural-${name}.png` });
    await p.waitForTimeout(1000); const s3 = await state(p, sel);
    // try the Next arrow: is the first click swallowed?
    await p.mouse.click(nb.x + nb.width / 2, nb.y + nb.height / 2); await p.waitForTimeout(900); const s4 = await state(p, sel);
    await p.mouse.click(nb.x + nb.width / 2, nb.y + nb.height / 2); await p.waitForTimeout(900); const s5 = await state(p, sel);
    // recover by clicking inside the stage (caption blank area)
    await p.mouse.click(lb.x + 20, lb.y + lb.height - 40); await p.waitForTimeout(900); const s6 = await state(p, sel);
    console.log(`${name}: gap stage->controls ${gap}px. after sloppy click: on ${s0.on}->${s1.on} moving ${s1.moving}. hover across stage (no button): moving=${s2.moving}, transforms changed=${s2.tf.join() !== s1.tf.join()}, item under focus now ${s2.on}; 1s later still is-moving=${s3.moving}. Next arrow clicked: on ${s3.on}->${s4.on} moving=${s4.moving}; clicked again: on ->${s5.on} moving=${s5.moving}; click inside stage: moving=${s6.moving} on=${s6.on}; will-change=${await p.evaluate(s => getComputedStyle(document.querySelector(s + ' .kws-arc-tile,' + s + ' .kws-spot-frame')).willChange, sel)}`);
    await ctx.close();
  }
  await b.close();
})();
