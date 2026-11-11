// node cls.js : layout shift on each page at 390 and 1280, with main.js delayed by 600ms (a slow connection)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 800 }, isMobile: w < 700 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    await ctx.route(/main\.js/, async r => { await new Promise(s => setTimeout(s, 600)); r.continue(); });
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(e.value.toFixed(4) + ' ' + (e.sources || []).map(s => (s.node && (s.node.className || s.node.nodeName)) || '?').slice(0, 3).join('|')); } }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    console.log(path, w, 'CLS', (await p.evaluate(() => window.__cls)).toFixed(4), JSON.stringify(await p.evaluate(() => window.__shifts)));
    await ctx.close();
  }
  await b.close();
})();
