const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [1100, 1140, 1200, 1260, 1280, 1300, 1340, 1380, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const e = document.querySelector('.site-header .header-cta'); const rc = e.getBoundingClientRect(); return [Math.round(rc.width), Math.round(rc.height)]; });
    await p.evaluate(() => scrollTo(0, 600)); await p.waitForTimeout(500);
    const r2 = await p.evaluate(() => { const e = document.querySelector('.site-header .header-cta'); const rc = e.getBoundingClientRect(); return [Math.round(rc.width), Math.round(rc.height)]; });
    console.log(w, 'top', r.join('x'), 'scrolled', r2.join('x'));
    await ctx.close();
  }
  await b.close();
})();
