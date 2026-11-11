const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [scheme, w] of [['light', 390], ['dark', 390], ['light', 1280]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 600 }, colorScheme: scheme, deviceScaleFactor: 2 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.addStyleTag({ content: '@media (max-width: 1099.98px) { .nav-links [aria-current="page"] { text-decoration: underline; text-decoration-thickness: var(--bold); text-underline-offset: .25em; } }' });
    if (w < 1100) { await p.click('#nav-toggle'); await p.waitForTimeout(600); }
    const d = await p.evaluate(() => { const a = document.querySelector('#nav .nav-links [aria-current="page"]'); const cs = getComputedStyle(a); return cs.textDecorationLine + ' ' + cs.textDecorationThickness; });
    console.log(scheme, w, d);
    await p.screenshot({ path: `shots/v04fix_${scheme}_${w}.png`, clip: w < 1100 ? { x: 0, y: 250, width: w, height: 200 } : { x: 300, y: 40, width: 700, height: 80 } });
    await ctx.close();
  }
  await b.close();
})();
