const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/pricing/', '/contact/', '/faq/']) for (const w of [1100, 1180, 1280, 1300, 1360]) {
    const p = await b.newPage({ viewport: { width: w, height: 800 } });
    await p.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender/, r => r.abort());
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const c = document.querySelector('.header-cta'); const r = c.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); });
    console.log(path, w, 'header button', r);
    await p.close();
  }
  await b.close();
})();
