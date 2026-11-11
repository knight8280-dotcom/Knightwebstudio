const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/faq/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = false));
  const m = () => p.evaluate(() => ({ groups: [...document.querySelectorAll('.faq-group')].map(g => Math.round(g.getBoundingClientRect().height)), sums: [...document.querySelectorAll('summary')].map(s => Math.round(s.getBoundingClientRect().height)), total: document.documentElement.scrollHeight, gap: getComputedStyle(document.querySelector('.faq-group.space-above')).marginTop }));
  console.log('now', JSON.stringify(await m()));
  await p.addStyleTag({ content: '[data-page="faq"] .faq-item summary{text-wrap:wrap}' });
  console.log('no balance', JSON.stringify(await m()));
  await b.close();
})();
