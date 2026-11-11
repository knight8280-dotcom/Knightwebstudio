const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1100, height: 800 } });
  await p.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
  for (const path of ['/contact/', '/pricing/']) {
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
    const bad = [];
    for (let w = 1100; w <= 1440; w += 10) {
      await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(60);
      const h = await p.evaluate(() => { const e = document.querySelector('.site-header .header-cta'); return e ? Math.round(e.getBoundingClientRect().height) : -1; });
      if (h > 46) bad.push(w + ':' + h);
    }
    console.log(path, 'header button taller than one line at:', bad.join(' ') || 'never');
  }
  await b.close();
})();
