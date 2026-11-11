const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const jobs = JSON.parse(process.argv[2]);
  for (const j of jobs) { const ctx = await b.newContext({ viewport: { width: j.w, height: j.h }, colorScheme: j.scheme || 'light', reducedMotion: 'reduce', deviceScaleFactor: j.dpr || 1 }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + j.path, { waitUntil: 'load' }); await p.waitForTimeout(300); if (j.js) await p.evaluate(j.js); if (j.y) await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), j.y); await p.waitForTimeout(350);
    if (j.sel) await p.locator(j.sel).first().screenshot({ path: `${__dirname}/misc/${j.name}.png` }); else await p.screenshot({ path: `${__dirname}/misc/${j.name}.png`, fullPage: !!j.full }); await ctx.close(); }
  await b.close();
})();
