// Layout shift while the page loads and the scripts upgrade the markup. The kit scripts are held back 1.2s on purpose,
// so the browser paints the page before the upgrade and any jump would be counted. Lists the nodes that moved.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const w of (process.argv[2] || '390,820,1440').split(',').map(Number)) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.route(/kit\/depth\/(cylinder|ring)\.js/, async r => { await new Promise(d => setTimeout(d, 1200)); r.continue(); });
    const p = await ctx.newPage(); await p.goto(process.argv[3] || 'http://localhost:8730/kit/depth/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(700);
    const r = await p.evaluate(() => new Promise(done => { const out = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) out.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: e.sources.map(s => (s.node && (s.node.className || s.node.nodeName)) + ' ' + Math.round(s.previousRect.y) + '>' + Math.round(s.currentRect.y)).slice(0, 4) }); }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => done(out), 300); }));
    const total = r.reduce((a, c) => a + c.v, 0), live = await p.evaluate(() => document.querySelectorAll('.is-live').length);
    if (total > .005 || live !== 4) bad++;
    console.log(`${total > .005 || live !== 4 ? 'FAIL' : 'PASS'}  ${w}px: layout shift ${total.toFixed(4)} with the scripts arriving 1.2s late (${live} mounted)${r.length ? '  ' + JSON.stringify(r).slice(0, 500) : ''}`);
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
