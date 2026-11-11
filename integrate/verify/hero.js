// ROLLOUT must-fix 1 and 6, measured on the repository: the home price strip at 1280x800, and hero overlaps 980 to 1100.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/');
  await p.waitForTimeout(1200);
  console.log('home 1280x800:', JSON.stringify(await p.evaluate(() => {
    const s = document.querySelector('.hero .price-strip').getBoundingClientRect();
    return { stripTop: Math.round(s.top), stripBottom: Math.round(s.bottom), window: innerHeight };
  })));
  const bad = [];
  for (let w = 980; w <= 1100; w += 20) {
    await p.setViewportSize({ width: w, height: 800 });
    await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const ph = document.querySelector('.hero-phone').getBoundingClientRect();
      const hits = [...document.querySelectorAll('.hero .btn, .hero .price-strip, .hero h1, .hero .lede')].filter(e => {
        const r = e.getBoundingClientRect();
        return r.width && !(r.right <= ph.left || r.left >= ph.right || r.bottom <= ph.top || r.top >= ph.bottom);
      }).map(e => (e.textContent || '').trim().slice(0, 20));
      return hits;
    });
    if (r.length) bad.push([w, r]);
  }
  console.log('hero phone overlapping copy or buttons, 980 to 1100:', JSON.stringify(bad));
  await b.close();
})();
