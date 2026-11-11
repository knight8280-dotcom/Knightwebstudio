const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1280, height: 800 } }); const p = await c.newPage();
  for (const u of ['/pricing/', '/work/', '/process/']) { await p.goto('http://localhost:8720' + u); await p.waitForTimeout(300);
    for (const w of [1280, 1300, 1320, 1340, 1360]) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(50);
      console.log(u, w, await p.evaluate(() => { const e = document.querySelector('.site-header .header-cta'); return e ? Math.round(e.getBoundingClientRect().height) : null; })); } }
  await b.close(); })();
