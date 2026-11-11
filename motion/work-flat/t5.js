const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const rm of ['no-preference', 'reduce']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm });
    await ctx.route(/\/(arc|spotlight)\.js/, async r => { await new Promise(x => setTimeout(x, 700)); r.continue(); });
    await ctx.addInitScript(() => { window.__s = []; new PerformanceObserver(l => { for (const e of l.getEntries()) window.__s.push(e.value.toFixed(4) + '@' + Math.round(e.startTime) + ' ' + e.sources.map(s => s.node ? ((s.node.className && s.node.className.toString()) || s.node.nodeName) + JSON.stringify([s.previousRect.x, s.previousRect.y, s.previousRect.width, s.previousRect.height, '->', s.currentRect.x, s.currentRect.y, s.currentRect.width, s.currentRect.height]) : '?').join(' ; ')); }).observe({ type: 'layout-shift', buffered: true }); });
    const p = await ctx.newPage(); await p.goto('http://localhost:8730/kit/flat/demo.html#work', { waitUntil: 'load' }); await p.waitForTimeout(1500);
    console.log(rm, (await p.evaluate(() => window.__s)).join('\n') || 'no shifts', await p.evaluate(() => scrollY));
    await ctx.close();
  }
  await b.close();
})();
