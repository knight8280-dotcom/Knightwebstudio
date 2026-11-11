// Natural load (no artificial script delay) on a throttled network, reduced motion vs not: is the un-held list painted before upgrade? CLS?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8730/kit/flat/demo.html';
(async () => {
  const b = await chromium.launch();
  for (const net of ['none', 'slow4g']) for (const rm of ['reduce', 'no-preference']) for (const at of ['', '#work']) {
    const res = [];
    for (let run = 0; run < 3; run++) {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: rm });
      await ctx.addInitScript(() => { window.__cls = 0; window.__shifts = []; window.__t = {};
        new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(e.value.toFixed(3) + '@' + Math.round(e.startTime)); } }).observe({ type: 'layout-shift', buffered: true });
        new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') { window.__t.fcp = Math.round(e.startTime); } }).observe({ type: 'paint', buffered: true });
        // doc height sampled every frame until live
        const hs = []; window.__hs = hs; const loop = () => { if (document.documentElement) { hs.push([Math.round(performance.now()), document.documentElement.scrollHeight, !!document.querySelector('.is-live')]); } if (hs.length < 600) requestAnimationFrame(loop); }; requestAnimationFrame(loop);
        new MutationObserver(() => { if (!window.__t.live && document.querySelector('.is-live')) window.__t.live = Math.round(performance.now()); }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] }); });
      const p = await ctx.newPage();
      if (net === 'slow4g') { const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8 }); }
      await p.goto(URL + at, { waitUntil: 'load' }); await p.waitForTimeout(1200);
      const r = await p.evaluate(() => { const pre = window.__hs.filter(x => !x[2]); return { cls: +window.__cls.toFixed(3), shifts: window.__shifts, fcp: window.__t.fcp, live: window.__t.live, preFrames: pre.length, preMaxH: Math.max(0, ...pre.map(x => x[1])), finalH: document.documentElement.scrollHeight, y: Math.round(scrollY), workTop: Math.round(document.querySelector('#work').getBoundingClientRect().top) }; });
      res.push(r); await ctx.close();
    }
    console.log(`net=${net} rm=${rm} at=${at || '(top)'}:`, res.map(r => `fcp ${r.fcp} live ${r.live} preFrames ${r.preFrames} preMaxH ${r.preMaxH} finalH ${r.finalH} CLS ${r.cls} [${r.shifts.join(',')}] scrollY ${r.y} #workTop ${r.workTop}`).join('\n      '));
  }
  await b.close();
})();
