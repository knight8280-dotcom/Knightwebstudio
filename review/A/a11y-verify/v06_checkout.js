const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/', { waitUntil: 'load' });
  const cards = await p.evaluate(() => [...document.querySelectorAll('.board-tiers a.tier')].map(a => ({ href: a.getAttribute('href'), text: a.innerText.replace(/\s+/g, ' ').slice(0, 70), after: getComputedStyle(a, '::after').content, before: getComputedStyle(a, '::before').content, aria: a.getAttribute('aria-label') })));
  console.log(JSON.stringify(cards, null, 1));
  await p.locator('.board-tiers').scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  await p.evaluate(() => { const r = document.querySelector('.board-tiers').getBoundingClientRect(); window.scrollBy(0, r.top - 80); }); await p.waitForTimeout(500);
  await p.screenshot({ path: 'shots/v06_home_board_390.png' });
  await p.goto('http://localhost:8720/checkout/?plan=starter-deposit', { waitUntil: 'load' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'shots/v06_checkout_390.png' });
  console.log((await p.evaluate(() => document.querySelector('main').innerText)).slice(0, 900));
  await b.close();
})();
