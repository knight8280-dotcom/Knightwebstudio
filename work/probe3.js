const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/'); await p.waitForTimeout(600);
  console.log(await p.evaluate(() => {
    const q = s => { const e = document.querySelector(s); const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { s, l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), pos: cs.position, right: cs.right, transform: cs.transform.slice(0, 40) }; };
    return [q('.hero-art'), q('.hero-seal'), q('.hero-seal .seal'), q('.hero-phone'), { sw: document.documentElement.scrollWidth }];
  }));
  await b.close();
})();
