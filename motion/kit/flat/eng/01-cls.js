// CLS on upgrade: normal, reduced motion, data-motion=off preset; script late (700ms) vs never; and natural (no delay)
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8730/kit/flat/demo.html';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) for (const at of ['#services', '#work']) for (const rm of ['no-preference', 'reduce']) {
    const out = {};
    for (const mode of ['never', 'late', 'natural']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: rm });
      if (mode !== 'natural') await ctx.route(/\/(arc|spotlight)\.js/, async r => { if (mode === 'never') return r.abort(); await new Promise(x => setTimeout(x, 700)); r.continue(); });
      await ctx.addInitScript(() => { window.__cls = 0; window.__shifts = []; window.__t = {};
        new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(e.value.toFixed(4) + '@' + Math.round(e.startTime) + ' ' + e.sources.map(s => s.node ? (s.node.className || s.node.nodeName) : '?').slice(0, 3).join(',')); } }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__t.fcp = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true });
        new MutationObserver(() => { if (!window.__t.live && document.querySelector('.is-live')) window.__t.live = Math.round(performance.now()); }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] }); });
      const p = await ctx.newPage();
      await p.goto(URL + at, { waitUntil: 'load' }); await p.waitForTimeout(1500);
      out[mode] = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts, t: window.__t }));
      await ctx.close();
    }
    console.log(`${w} ${at} rm=${rm}: never=${out.never.cls} late=${out.late.cls} (fcp ${out.late.t.fcp} live ${out.late.t.live}) natural=${out.natural.cls} (fcp ${out.natural.t.fcp} live ${out.natural.t.live})`);
    if (out.late.cls > 0.002) console.log('     late shifts:', out.late.shifts.join(' | '));
    if (out.natural.cls > 0.002) console.log('     natural shifts:', out.natural.shifts.join(' | '));
  }
  await b.close();
})();
