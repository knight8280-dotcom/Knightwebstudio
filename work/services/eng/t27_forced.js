const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, forcedColors: 'active', reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300);
  console.log('forced-colors matches:', await p.evaluate(() => matchMedia('(forced-colors: active)').matches), 'summary ::after background-image:', await p.evaluate(() => getComputedStyle(document.querySelector('#ecommerce summary'), '::after').backgroundImage.slice(0, 60)));
  await p.locator('#ecommerce').scrollIntoViewIfNeeded(); await p.evaluate(() => scrollBy(0, -200)); await p.screenshot({ path: 'forced-390-rows.png' });
  await p.evaluate(() => scrollTo(0, 600)); await p.screenshot({ path: 'forced-390-menu.png' });
  await b.close();
})();
