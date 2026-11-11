const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const reduced of ['no-preference', 'reduce']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: reduced });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/'); await p.waitForTimeout(400);
    const before = await p.evaluate(() => [...document.querySelectorAll('.seq')].map(e => getComputedStyle(e).opacity).join(','));
    await p.evaluate(() => document.querySelector('.ticket').scrollIntoView({ block: 'center' })); await p.waitForTimeout(1200);
    const after = await p.evaluate(() => [...document.querySelectorAll('.seq')].map(e => getComputedStyle(e).opacity).join(','));
    console.log(reduced, 'before scroll:', before, '| after:', after);
    await ctx.close();
  }
  await b.close();
})();
