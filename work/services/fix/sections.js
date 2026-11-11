// Heights of the page's blocks at a width
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of (process.argv[2] || '390').split(',').map(Number)) {
    const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: w < 700, hasTouch: w < 700, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(process.env.URL || 'http://localhost:8720/services/'); await p.waitForTimeout(350);
    console.log(w, JSON.stringify(await p.evaluate(() => {
      const o = {}; const R = e => e.getBoundingClientRect();
      for (const s of ['.topbar', '.site-header', '.page-head', '#services', '.menu', '#build', '#website-design', '#build .faq', '#keep', '#win', '#automation', '.fig', '.phone-frame', '#win .faq', '.cta-band', '.site-footer']) { const e = document.querySelector(s); o[s] = e ? Math.round(R(e).height) : null; }
      o.total = document.documentElement.scrollHeight; return o;
    })));
    await ctx.close();
  }
  await b.close();
})();
