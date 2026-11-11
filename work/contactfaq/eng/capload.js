const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const base of ['http://localhost:8720', 'http://localhost:8700']) for (const [w, h] of [[390, 844], [390, 664], [1440, 900], [1280, 720]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); let t0 = 0, when = null;
    await ctx.route(/plausible\.io|calendly\.com|onrender\.com/, r => r.abort());
    await ctx.route(/hcaptcha\.com/, r => { if (when === null) when = Date.now() - t0; r.abort(); });
    const p = await ctx.newPage(); t0 = Date.now(); await p.goto(base + '/contact/', { waitUntil: 'load' }); const loadT = Date.now() - t0; await p.waitForTimeout(1500);
    const slot = await p.evaluate(() => Math.round(document.getElementById('hcaptcha-slot').getBoundingClientRect().top + scrollY));
    console.log(base.slice(-4), w + 'x' + h, 'slot at y', slot, '| hcaptcha requested', when === null ? 'not within 1.5s of load (waits for scroll, focus or the 4s backstop)' : 'at ' + when + 'ms (page load event at ' + loadT + 'ms): with the page');
    await ctx.close(); }
  await b.close();
})();
