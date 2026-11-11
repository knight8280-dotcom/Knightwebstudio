const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/pricing/', '/services/']) for (const w of [1100, 1180, 1279, 1280, 1300, 1340, 1380, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const el = document.querySelector('.site-header .header-cta'); if (!el) return null; const rc = el.getBoundingClientRect(); return Math.round(rc.height); });
    console.log(path, w, 'header button height', r);
    await ctx.close();
  }
  await b.close();
})();
