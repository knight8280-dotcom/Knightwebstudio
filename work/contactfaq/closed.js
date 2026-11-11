const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 390, 430]) {
    const p = await b.newPage({ viewport: { width: w, height: 844 }, isMobile: true });
    await p.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    await p.goto('http://localhost:8720/faq/', { waitUntil: 'load' }); await p.waitForTimeout(300);
    const open = await p.evaluate(() => document.documentElement.scrollHeight);
    await p.evaluate(() => document.querySelectorAll('details[open]').forEach(d => d.open = false));
    const closed = await p.evaluate(() => document.documentElement.scrollHeight);
    console.log('faq', w, 'default', open, 'all closed', closed);
    await p.close();
  }
  await b.close();
})();
