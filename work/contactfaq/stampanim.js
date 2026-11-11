const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' });
  await p.waitForTimeout(500);
  const before = await p.evaluate(() => getComputedStyle(document.querySelector('.stamp')).opacity);
  const y = await p.evaluate(() => { const r = document.querySelector('.stamp').getBoundingClientRect(); return r.top + scrollY - 500; });
  await p.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
  const t0 = Date.now(); const out = [];
  for (const [i, t] of [60, 330, 400, 470, 560, 900].entries()) {
    await p.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
    const st = await p.evaluate(() => { const e = document.querySelector('.stamp'); const cs = getComputedStyle(e); return cs.opacity + ' ' + cs.transform + ' ' + e.className; });
    out.push((Date.now() - t0) + 'ms ' + st);
    await p.screenshot({ path: `look/stamp-${i}.png`, clip: { x: 150, y: 380, width: 240, height: 200 } });
  }
  console.log('before scroll opacity', before); console.log(out.join('\n'));
  await b.close();
})();
