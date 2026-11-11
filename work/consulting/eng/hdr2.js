const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  for (const scrolled of [false, true]) { let last = null; const runs = [];
    for (let w = 1100; w <= 1340; w += 5) { await p.setViewportSize({ width: w, height: 800 }); await p.evaluate(s => window.scrollTo(0, s ? 900 : 0), scrolled); await p.waitForTimeout(80); const h = await p.evaluate(() => { const a = [...document.querySelectorAll('.site-header a.btn')].find(x => x.getBoundingClientRect().height > 0 && !x.closest('.nav')); return a ? Math.round(a.getBoundingClientRect().height) + 'px "' + a.textContent.trim() + '"' : 'none'; }); if (h !== last) { runs.push(`${w}: ${h}`); last = h; } }
    console.log(scrolled ? 'scrolled:' : 'at top:', runs.join(' | ')); }
  await b.close();
})();
