const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/process/', '/work/']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com|main\.js/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(5600);
    console.log('main.js blocked', path, JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('main .reveal')].map(e => [e.className, getComputedStyle(e).opacity, getComputedStyle(e).transform]))));
    await ctx.close();
  }
  await b.close();
})();
