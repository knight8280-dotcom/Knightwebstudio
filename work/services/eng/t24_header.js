const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.evaluate(() => document.fonts.ready);
  const wraps = [];
  for (let w = 1100; w <= 1340; w += 4) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(30); for (const y of [0, 600]) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(350); const h = await p.evaluate(() => Math.round(document.querySelector('.header-cta').getBoundingClientRect().height)); if (h > 46) wraps.push(`${w}${y ? 's' : ''}:${h}`); } }
  console.log('header button taller than 44px (wrapped) at [width, s = scrolled]:', wraps.join(' '));
  await b.close();
})();
