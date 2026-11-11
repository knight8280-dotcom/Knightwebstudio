const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 664 }, isMobile: true, hasTouch: true, colorScheme: 'light' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const page = await ctx.newPage();
  // first screens at the real Safari viewport height (664)
  for (const [p, n] of [['/start/', 'start'], ['/', 'home'], ['/pricing/', 'pricing'], ['/consulting/', 'consulting'], ['/about/', 'about'], ['/work/', 'work'], ['/contact/', 'contact']]) {
    await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/first664_${n}.png` });
  }
  await page.goto('http://localhost:8720/', { waitUntil: 'load' }); await page.waitForTimeout(500);
  await page.tap('#nav-toggle'); await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/menu_open_664.png` });
  const items = await page.evaluate(() => [...document.querySelectorAll('#nav a')].map(a => a.innerText.replace(/\s+/g, ' ').trim() + ' -> ' + a.getAttribute('href')));
  console.log(items.join('\n'));
  await b.close();
})();
