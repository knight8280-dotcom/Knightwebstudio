const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/work/', '/process/']) for (const [w, h] of [[390, 844], [1440, 900]]) for (const delay of [0, 1500]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    if (delay) { await ctx.route(/\.woff2/, async r => { await new Promise(s => setTimeout(s, delay)); r.continue(); }); await ctx.route(/work-.*\.jpg/, async r => { await new Promise(s => setTimeout(s, delay + 400)); r.continue(); }); }
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 3).map(s => s.node && s.node.nodeType === 1 ? s.node.tagName + '.' + s.node.className : (s.node ? '#text in ' + (s.node.parentElement && s.node.parentElement.className) : '?')) }); } } }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(2600);
    // scroll down through page to trigger lazy images and reveals
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 400) { await p.mouse.wheel(0, 400); await p.waitForTimeout(160); }
    await p.waitForTimeout(delay + 900);
    const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts.filter(s => s.v > 0.001).slice(0, 6) }));
    console.log(path, w, 'font/img delay', delay, 'CLS', r.cls, JSON.stringify(r.shifts));
    await ctx.close();
  }
  await b.close();
})();
