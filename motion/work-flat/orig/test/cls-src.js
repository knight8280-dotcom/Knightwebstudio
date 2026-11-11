const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 768, height: 1024 } });
  await ctx.addInitScript(() => { window.__s = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__s.push(e.value.toFixed(4) + '@' + Math.round(e.startTime) + ' ' + e.sources.map(s => s.node ? ((s.node.className && s.node.className.toString()) || s.node.nodeName) + JSON.stringify([s.previousRect.y, s.currentRect.y, s.currentRect.height]) : '?').join(' ; ')); }).observe({ type: 'layout-shift', buffered: true }); });
  const p = await ctx.newPage(); await p.goto(process.argv[2] || 'http://localhost:8730/kit/flat/demo.html#work', { waitUntil: 'load' }); await p.waitForTimeout(1200);
  console.log((await p.evaluate(() => window.__s)).join('\n'));
  await b.close();
})();
