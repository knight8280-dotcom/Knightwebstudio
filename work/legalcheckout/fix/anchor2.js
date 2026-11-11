const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const pg of ['privacy', 'terms']) for (const [w, h] of [[1440, 900], [1093, 520], [820, 1100], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible/, r => r.abort()); const p = await ctx.newPage(); await p.goto(`http://localhost:8720/${pg}/`);
    const ids = await p.$$eval('.toc a', as => as.map(a => a.getAttribute('href'))); const res = [];
    const missing = await p.evaluate(ids => ids.filter(h => !document.querySelector(h)), ids);
    for (const hf of [ids[0], ids[Math.floor(ids.length / 2)], ids[ids.length - 2]]) { await p.click(`.toc a[href="${hf}"]`); await p.waitForTimeout(250);
      res.push(await p.evaluate(hf => { const t = document.querySelector(hf).getBoundingClientRect(), hd = document.getElementById('site-header').getBoundingClientRect(); return hf + ' heading top ' + Math.round(t.top) + ' (header ends ' + Math.round(hd.bottom) + ')' + (t.top >= hd.bottom && t.top < innerHeight ? ' ok' : ' BAD'); }, hf)); await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(80); }
    console.log(pg, w + 'x' + h, ids.length + ' links, missing targets: ' + missing.length, '|', res.join(' | ')); await ctx.close(); }
  await b.close(); })();
