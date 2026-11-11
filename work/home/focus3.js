const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/', { waitUntil: 'load' });
  await p.waitForTimeout(600);
  const want = ['WEBSITES', 'Estimate what', 'Risen Health', 'STARTER', '(225) 255-0837', 'Send an enquiry'];
  let n = 0;
  for (let i = 0; i < 70 && want.length; i++) {
    await p.keyboard.press('Tab');
    const t = await p.evaluate(() => (document.activeElement.innerText || '').trim().replace(/\s+/g, ' '));
    if (want.length && t.startsWith(want[0]) && await p.evaluate(() => !!document.activeElement.closest('main'))) {
      want.shift();
      await p.waitForTimeout(1500);
      const r = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
      const pad = 40;
      await p.screenshot({ path: `c3/fr-${++n}.png`, clip: { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: Math.min(1280, r.w + 2 * pad), height: Math.min(800 - Math.max(0, r.y - pad), r.h + 2 * pad) } });
    }
  }
  await b.close();
})();
