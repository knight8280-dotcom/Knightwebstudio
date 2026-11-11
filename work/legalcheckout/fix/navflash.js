const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.route(/plausible|stripe|onrender/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/'); await p.waitForTimeout(500);
  await p.setViewportSize({ width: 1000, height: 900 });
  for (const t of [0, 60, 150, 320, 600]) { await p.waitForTimeout(t ? 60 : 0); console.log(t, await p.evaluate(() => { const n = document.getElementById('nav'); const cs = getComputedStyle(n); return cs.opacity + ' ' + cs.visibility + ' ' + cs.position; })); }
  await b.close(); })();
