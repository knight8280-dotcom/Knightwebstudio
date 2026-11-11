// Reduced motion: how often, and how big, is the shift in ordinary loads? 10 runs each. "natural" = no artificial delay. "+300ms" = kit scripts arrive 300ms after the rest.
const { chromium, URL } = require('./lib');
(async () => {
  const b = await chromium.launch();
  for (const rm of ['reduce', 'no-preference']) for (const [W, H, at] of [[390, 844, '#work'], [1440, 900, '#services'], [1440, 900, '#work']]) for (const delay of [0, 300]) {
    const cls = [], pre = [], jump = [];
    for (let i = 0; i < 10; i++) {
      const ctx = await b.newContext({ viewport: { width: W, height: H }, reducedMotion: rm });
      if (delay) await ctx.route(/\/(arc|spotlight)\.js/, async r => { await new Promise(x => setTimeout(x, delay)); r.continue(); });
      await ctx.addInitScript(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
        window.__pre = 0; window.__maxH = 0; window.__ys = []; const loop = () => { if (document.documentElement && document.body) { const live = !!document.querySelector('.is-live'); if (!live) { window.__pre++; window.__maxH = Math.max(window.__maxH, document.documentElement.scrollHeight); } window.__ys.push(Math.round(scrollY)); } if (performance.now() < 2500) requestAnimationFrame(loop); }; requestAnimationFrame(loop); });
      const p = await ctx.newPage(); await p.goto(URL + at, { waitUntil: 'load' }); await p.waitForTimeout(900);
      const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(3), pre: window.__pre, maxH: window.__maxH, ys: [...new Set(window.__ys)] }));
      cls.push(r.cls); pre.push(r.pre); jump.push(r.ys.length > 1 ? Math.max(...r.ys) - r.ys[r.ys.length - 1] : 0); await ctx.close();
    }
    console.log(`${rm.padEnd(13)} ${W}px ${at.padEnd(9)} scripts ${delay ? '+' + delay + 'ms' : 'natural'}: frames rendered before upgrade (per run) [${pre.join(',')}]  CLS per run [${cls.join(', ')}]  scroll position jumped by (px) [${jump.join(',')}]`);
  }
  await b.close();
})();
