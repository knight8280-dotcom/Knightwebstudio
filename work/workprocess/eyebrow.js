const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 360, height: 740 } }); const p = await c.newPage();
  await p.goto('http://localhost:8720/work/'); await p.waitForTimeout(300);
  for (const w of [360, 375, 390, 414, 430, 600, 760, 820, 980, 1100]) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(50);
    console.log(w, JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.case .eyebrow')].map(e => { const r = document.createRange(); r.selectNodeContents(e); const lines = [...new Set([...r.getClientRects()].map(x => Math.round(x.top)))].length; return lines; })))); }
  await b.close(); })();
