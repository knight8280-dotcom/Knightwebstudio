const { chromium } = require('playwright');
const PROXY = process.env.HTTPS_PROXY;
(async () => {
  const browser = await chromium.launch({ proxy: { server: PROXY, bypass: 'localhost,127.0.0.1' } });
  // 1. baseline at 320: does the live site's captcha stay inside its form?
  {
    const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto('http://localhost:8700/contact/', { waitUntil: 'load' });
    await page.evaluate(() => document.getElementById('hcaptcha-slot').scrollIntoView({ block: 'center' }));
    try { await page.waitForSelector('#hcaptcha-slot iframe', { timeout: 30000 }); } catch (e) { console.log('baseline: no iframe'); }
    await page.waitForTimeout(2500);
    console.log('baseline 320', JSON.stringify(await page.evaluate(() => { const i = document.querySelector('#hcaptcha-slot iframe'); const f = document.getElementById('contact-form'); let card = f; for (let e = f; e; e = e.parentElement) { const cs = getComputedStyle(e); if (parseFloat(cs.borderRightWidth) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && e.tagName !== 'BODY' && e.tagName !== 'HTML')) { card = e; break; } } const ir = i && i.getBoundingClientRect(), cr = card.getBoundingClientRect(); return { card: card.tagName + '.' + card.className, ifr: ir && [ir.left, ir.right, ir.width], cardR: cr.right, cardL: cr.left, transform: getComputedStyle(document.getElementById('hcaptcha-slot')).transform, sw: document.documentElement.scrollWidth }; })));
    const y = await page.evaluate(() => document.getElementById('hcaptcha-slot').getBoundingClientRect().top);
    await page.screenshot({ path: 'shots/cap__base-320.png', clip: { x: 0, y: Math.max(0, y - 150), width: 320, height: 330 } });
    await ctx.close();
  }
  // 2. context: does anything else on the new site break out at 320? (third parties blocked, speed)
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.route(u => !/^http:\/\/localhost/.test(u.toString()), r => r.abort());
  for (const p of ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html']) {
    await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    console.log('new 320', p, 'overflow', r.sw - r.iw);
  }
  await browser.close();
})();
