const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
  await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' });
  await p.locator('a.tier').nth(1).click(); await p.waitForLoadState('load'); await p.waitForTimeout(1200);
  console.log(w, p.url(), await p.evaluate(() => { const r = document.getElementById('packages').getBoundingClientRect(); const hd = document.getElementById('site-header').getBoundingClientRect(); return `#packages top ${Math.round(r.top)}, header bottom ${Math.round(hd.bottom)}, text: ${document.getElementById('packages').innerText.slice(0, 50).replace(/\n/g, ' / ')}`; }));
  await p.screenshot({ path: `tap_${w}.png` }); await ctx.close(); }
  await b.close(); })();
