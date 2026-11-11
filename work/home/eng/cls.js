// Layout shift while fonts arrive late. node cls.js
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800]]) for (const delay of [0, 1500]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    if (delay) await ctx.route(/\.woff2/, async r => { await new Promise(s => setTimeout(s, delay)); r.continue(); });
    await ctx.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 3).map(s => s.node && s.node.nodeType === 1 ? s.node.tagName.toLowerCase() + '.' + (s.node.getAttribute('class') || '').split(' ')[0] + ` ${Math.round(s.previousRect.y)}->${Math.round(s.currentRect.y)} h${Math.round(s.previousRect.height)}->${Math.round(s.currentRect.height)}` : '#text') }); } } }).observe({ type: 'layout-shift', buffered: true });
      window.__lcp = null; new PerformanceObserver(l => { const e = l.getEntries().pop(); window.__lcp = { t: Math.round(e.startTime), el: e.element && (e.element.tagName + '.' + e.element.className), size: e.size }; }).observe({ type: 'largest-contentful-paint', buffered: true }); });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/', { waitUntil: 'load' }); await p.waitForTimeout(delay + 3000);
    const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts, lcp: window.__lcp, h1: document.querySelector('h1').getBoundingClientRect().height, fam: getComputedStyle(document.querySelector('h1')).fontFamily }));
    console.log(`${w} font delay ${delay}ms: CLS ${r.cls} LCP ${JSON.stringify(r.lcp)} h1h ${r.h1}`); r.shifts.forEach(s => console.log('    ', JSON.stringify(s)));
    await ctx.close();
  }
  await b.close();
})();
