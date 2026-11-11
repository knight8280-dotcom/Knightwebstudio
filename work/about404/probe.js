const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const mobile of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, isMobile: mobile, hasTouch: mobile });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/about/'); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const c = document.querySelector('.bizcard'); const cs = getComputedStyle(c); return { rotate: cs.rotate, cls: c.className, w: Math.round(c.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height) }; });
    console.log(mobile, JSON.stringify(r));
    await p.screenshot({ path: `extra/probe-${mobile}.png`, clip: { x: 0, y: 560, width: 390, height: 340 } });
    await ctx.close();
  }
  await b.close();
})();
