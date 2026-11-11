const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8721/'); await p.waitForTimeout(800);
  console.log(await p.evaluate(() => { const a = document.querySelector('.nav-links [aria-current]'); const cs = getComputedStyle(a, '::after'); return { transform: cs.transform, w: cs.width, h: cs.height, inset: cs.inset, bw: cs.borderWidth, pos: cs.position, bg: cs.backgroundColor }; }));
  await p.screenshot({ path: 'work/nav.png', clip: { x: 340, y: 44, width: 700, height: 80 } });
  await b.close();
})();
