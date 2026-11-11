const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const u of process.argv.slice(2)) { const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const p = await c.newPage(); await p.goto(u, { waitUntil: 'load' }); await p.waitForTimeout(400);
    console.log(u, await p.evaluate(() => document.documentElement.scrollHeight)); await c.close(); }
  await b.close(); })();
