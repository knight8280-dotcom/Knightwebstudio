const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const rm of ['no-preference', 'reduce']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: rm });
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/web-design-gonzales/', { waitUntil: 'domcontentloaded' });
    const frames = [];
    for (const ms of [0, 150, 300, 450, 600, 900, 1500]) {
      await p.waitForTimeout(ms === 0 ? 0 : 150);
      frames.push(await p.evaluate(() => { const m = document.querySelector('.city-name .mark'); const cs = getComputedStyle(m, '::after'); return cs.animationName + ' ' + cs.transform + ' iter ' + cs.animationIterationCount; }));
    }
    console.log(rm, frames);
    if (rm === 'no-preference') { await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(420); await p.screenshot({ path: 'r4/brush-mid.png', clip: { x: 0, y: 100, width: 390, height: 260 } }); }
    await ctx.close();
  }
  await b.close();
})();
