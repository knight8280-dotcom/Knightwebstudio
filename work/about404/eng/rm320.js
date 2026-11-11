const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const base of ['http://localhost:8720', 'http://localhost:8700']) for (const path of ['/about/', '/pricing/', '/work/', '/process/', '/contact/', '/404.html', '/']) {
    const ctx = await b.newContext({ viewport: { width: 320, height: 640 } }); await ctx.route(/plausible|calendly|hcaptcha|onrender/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.waitForTimeout(600);
    console.log(base.slice(-4), path, 'scrollWidth-innerWidth =', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth));
    await ctx.close(); }
  await b.close(); })();
