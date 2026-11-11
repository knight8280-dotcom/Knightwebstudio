const { chromium } = require('playwright');
(async () => {
  const PROXY = process.env.HTTPS_PROXY;
  const browser = await chromium.launch({ proxy: { server: PROXY, bypass: 'localhost,127.0.0.1' } });
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600 });
    const page = await ctx.newPage();
    await page.route(/onrender\.com/, r => r.abort('connectionrefused'));
    await page.goto('http://localhost:8700/checkout/?plan=starter-deposit', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('checkout-status').classList.contains('error'), null, { timeout: 60000 });
    await page.waitForTimeout(2500);
    console.log('baseline', w, JSON.stringify(await page.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.x), Math.round(b.y + scrollY), Math.round(b.width), Math.round(b.height)]; }; return { status: r(document.getElementById('checkout-status')), form: r(document.getElementById('checkout-form')) }; })));
    await page.screenshot({ path: `shots/base__down__${w}.png`, fullPage: true });
    await ctx.close();
  }
  await browser.close();
})();
