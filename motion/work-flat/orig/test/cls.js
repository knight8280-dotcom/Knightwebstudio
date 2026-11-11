// Layout shift when the script upgrades the markup. The kit scripts are held back (700ms) so the "before" state is really painted;
// a second run never lets them load, which gives the shift the page has anyway (fonts, images).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) for (const at of ['#services', '#work']) {
    const out = {};
    for (const mode of ['never', 'late']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } });
      await ctx.route(/\/(arc|spotlight)\.js/, async r => { if (mode === 'never') return r.abort(); await new Promise(x => setTimeout(x, 700)); r.continue(); });
      await ctx.addInitScript(() => { window.__cls = 0; window.__shifts = []; window.__t = {};
        new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(e.value.toFixed(4) + '@' + Math.round(e.startTime) + ' ' + e.sources.map(s => s.node ? (s.node.className || s.node.nodeName) : '?').slice(0, 3).join(',')); } }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__t.fcp = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true });
        new MutationObserver(() => { if (!window.__t.live && document.querySelector('.is-live')) window.__t.live = Math.round(performance.now()); }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] }); });
      const p = await ctx.newPage();
      await p.goto('http://localhost:8730/kit/flat/demo.html' + at, { waitUntil: 'load' }); await p.waitForTimeout(1500);
      out[mode] = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts, t: window.__t }));
      await ctx.close();
    }
    const extra = out.late.cls - out.never.cls, painted = out.late.t.fcp < out.late.t.live;
    const ok = painted && extra < 0.002;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${w}x${h} at ${at}: first paint ${out.late.t.fcp}ms, upgrade ${out.late.t.live}ms; layout shift ${out.late.cls} with the upgrade, ${out.never.cls} without it`); if (!ok) { bad++; console.log('      late:', out.late.shifts.join(' | '), '\n      never:', out.never.shifts.join(' | ')); }
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
