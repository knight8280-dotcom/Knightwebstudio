const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) for (const delay of [0, 1200]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    if (delay) await ctx.route(/\.woff2/, async r => { await new Promise(s => setTimeout(s, delay)); r.continue(); });
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 3).map(s => s.node && s.node.nodeType === 1 ? s.node.tagName.toLowerCase() + '.' + (s.node.className || '').toString().split(' ')[0] : (s.node ? s.node.nodeName : '?')) }); } } }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(2500);
    const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts.slice(0, 8), fonts: [...document.fonts].map(f => f.family + ' ' + f.status + ' ' + f.display) }));
    console.log(w, 'font delay', delay, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
