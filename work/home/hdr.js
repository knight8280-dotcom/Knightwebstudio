const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [1100, 1180, 1280, 1300, 1320, 1340, 1360, 1400]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto((process.argv[2] || 'http://localhost:8720/'), { waitUntil: 'load' });
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const q = s => document.querySelector(s); const bw = s => q(s) ? Math.round(q(s).getBoundingClientRect().width) : 0;
      const c = q('.header-cta'); const cs = getComputedStyle(c);
      return { inner: bw('.header-inner'), brand: bw('.brand'), nav: bw('.nav'), links: bw('.nav-links'), tel: bw('.header-tel'), cta: bw('.header-cta'), ctaH: Math.round(c.getBoundingClientRect().height), lines: Math.round(c.getBoundingClientRect().height) > 46 ? 'WRAPS' : 'ok' };
    });
    console.log(w, JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
