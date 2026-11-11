const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.addInitScript(() => { addEventListener('DOMContentLoaded', () => { function openTarget() { var t = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1))); var d = t && t.closest('details'); if (d) d.open = true; } openTarget(); addEventListener('hashchange', openTarget); }); });
  await p.goto('http://localhost:8720/services/#brand'); await p.waitForTimeout(900);
  console.log('deep link #brand open:', await p.evaluate(() => [document.getElementById('brand').open, Math.round(document.getElementById('brand').getBoundingClientRect().top)]));
  await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.evaluate(() => document.querySelector('.menu a[href="#seo"]').click()); await p.waitForTimeout(1200);
  console.log('menu tap #seo open:', await p.evaluate(() => [document.getElementById('seo').open, Math.round(document.getElementById('seo').getBoundingClientRect().top), document.documentElement.scrollHeight]));
  await b.close();
})();
