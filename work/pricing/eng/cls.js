const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h, mobile] of [[390, 844, true], [1440, 900, false]]) {
    for (const mode of ['delay-fonts', 'no-fonts']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mobile });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      await ctx.route(/\.woff2/, async r => { if (mode === 'no-fonts') return r.abort(); await new Promise(z => setTimeout(z, 1500)); r.continue(); });
      const p = await ctx.newPage();
      await p.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 3).map(s => s.node && (s.node.className || s.node.nodeName).toString().slice(0, 30)) }); } } }).observe({ type: 'layout-shift', buffered: true }); });
      await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
      const h0 = await p.evaluate(() => document.documentElement.scrollHeight);
      await p.waitForTimeout(3000);
      const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts.slice(0, 6), H: document.documentElement.scrollHeight, fonts: [...document.fonts].map(f => f.family + ':' + f.status) }));
      console.log(w, mode, 'CLS', r.cls, 'height before/after', h0, r.H, JSON.stringify(r.shifts), r.fonts.join(','));
      await ctx.close();
    }
  }
  await b.close();
})();
