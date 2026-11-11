const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true }); const p = await c.newPage();
  await p.goto('http://localhost:8720/process/'); await p.waitForTimeout(300);
  for (let w = 320; w <= 1920; w += 20) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(40);
    const r = await p.evaluate(() => [...document.querySelectorAll('.terms div')].filter(d => d.getBoundingClientRect().height > 32).map(d => d.textContent.trim().slice(0, 30)));
    if (r.length) console.log(w, 'wrapped rows:', r.join(' | ')); }
  console.log('done'); await b.close(); })();
