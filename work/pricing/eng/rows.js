const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 760, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  const bad = [];
  for (let w = 760; w < 1100; w += 10) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(60);
    const t = await p.evaluate(() => [...document.querySelectorAll('.spec-act .btn-block')].map(t => Math.round(t.getBoundingClientRect().top + scrollY)));
    const d1 = Math.abs(t[0] - t[1]), d2 = Math.abs(t[2] - t[3]); if (d1 > 1 || d2 > 1) bad.push(`${w}:${d1}/${d2}`); }
  console.log('widths (760-1090, step 10) where the two cards in a row have buttons at different heights (row1/row2 px):', bad.join(' ') || 'none', `(${bad.length} of 34)`);
  await b.close();
})();
