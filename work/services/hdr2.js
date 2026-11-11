const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const bad = [];
  const ctx = await b.newContext({ viewport: { width: 1100, height: 800 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/'); await p.waitForTimeout(300);
  for (let w = 1100; w <= 1330; w += 2) { await p.setViewportSize({ width: w, height: 800 }); const h = await p.evaluate(() => Math.round(document.querySelector('.site-header .header-cta').getBoundingClientRect().height)); if (h > 46) bad.push(w); }
  console.log('widths where the header button wraps (pricing page):', bad.length ? bad[0] + '..' + bad[bad.length - 1] + ' (' + bad.join(',').slice(0, 200) + ')' : 'none');
  await b.close();
})();
