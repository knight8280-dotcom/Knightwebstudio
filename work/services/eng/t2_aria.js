const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +process.argv[2] || 1440, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400);
  const snap = await p.locator('main').ariaSnapshot();
  console.log(snap);
  await b.close();
})();
