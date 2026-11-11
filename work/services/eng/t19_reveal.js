const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    for (const hash of ['#seo', '#google-reviews', '#care', '#automation']) {
      await p.goto('http://localhost:8720/services/' + hash); const t0 = Date.now(); let vis = null;
      for (let i = 0; i < 40; i++) { await p.waitForTimeout(100); const o = await p.evaluate(hh => { const t = document.querySelector(hh); const r = t.closest('.reveal') || t.querySelector('.reveal') || t; return +getComputedStyle(r).opacity; }, hash); if (o > 0.98) { vis = Date.now() - t0; break; } }
      console.log(w, 'deep link', hash, 'fully visible after', vis, 'ms');
    }
    await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(500);
    await p.keyboard.press('End'); const t0 = Date.now(); let v = null; for (let i = 0; i < 50; i++) { await p.waitForTimeout(100); const o = await p.evaluate(() => +getComputedStyle(document.querySelector('.cta-inner')).opacity); if (o > 0.98) { v = Date.now() - t0; break; } }
    console.log(w, 'End key: closing band fully visible after', v, 'ms; any reveal still hidden on the way back up?');
    await p.keyboard.press('Home'); await p.waitForTimeout(1500);
    const hidden = await p.evaluate(() => [...document.querySelectorAll('.reveal')].filter(e => getComputedStyle(e).display !== 'none' && !e.closest('.fig-col') ).map(e => [e.className, e.classList.contains('visible')]));
    console.log('   reveal states after End→Home:', JSON.stringify(hidden));
    await ctx.close();
  }
  await b.close();
})();
