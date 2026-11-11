const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/work/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  const out = [];
  for (let w = 1100; w <= 1400; w += 10) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(60); for (const y of [0, 600]) { await p.evaluate(yy => scrollTo(0, yy), y); await p.waitForTimeout(350); const h = await p.evaluate(() => Math.round(document.querySelector('.header-cta').getBoundingClientRect().height)); if (h > 46) out.push(`${w}px@y${y}: button ${h}px tall`); } }
  console.log('header button wraps at:', out.join('; ') || 'never');
  const em = [];
  for (let w = 360; w <= 1400; w += 20) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(50); const r = await p.evaluate(() => { const a = document.querySelector('.site-footer a[href^="mailto:"]'); const rg = document.createRange(); rg.selectNodeContents(a); return rg.getClientRects().length; }); if (r > 1) em.push(w); }
  console.log('footer email breaks onto 2 lines at widths:', em.join(','));
  await b.close();
})();
