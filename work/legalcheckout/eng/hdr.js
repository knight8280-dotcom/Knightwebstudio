const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.route(/plausible/, r => r.abort());
  for (const path of ['/privacy/', '/pricing/']) for (const w of [1280, 1290, 1300, 1320, 1340]) { await p.setViewportSize({ width: w, height: 800 }); await p.goto('http://localhost:8720' + path); await p.waitForTimeout(300);
    const a = await p.evaluate(() => { const c = document.querySelector('.site-header .header-cta'); return Math.round(c.getBoundingClientRect().height); });
    await p.evaluate(() => scrollTo(0, 500)); await p.waitForTimeout(500);
    const bb = await p.evaluate(() => { const c = document.querySelector('.site-header .header-cta'); return Math.round(c.getBoundingClientRect().height); });
    console.log(path, w, 'header button height at top', a, 'scrolled', bb); }
  await b.close(); })();
