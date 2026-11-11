// Alternative fix that adds no breakpoint: change .9 to .78 inside the existing <=379.98px rule.
const { chromium } = require('playwright');
const PROXY = process.env.HTTPS_PROXY;
const CSS = '@media (max-width:379.98px){[data-page="contact"] .h-captcha{transform:scale(.78);transform-origin:0 0}}';
(async () => {
  const browser = await chromium.launch({ proxy: { server: PROXY, bypass: 'localhost,127.0.0.1' } });
  for (const w of [320, 360, 375, 379, 380]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await page.goto('http://localhost:8720/contact/', { waitUntil: 'load' });
    await page.addStyleTag({ content: CSS });
    await page.evaluate(() => document.getElementById('hcaptcha-slot').scrollIntoView({ block: 'center' }));
    await page.waitForSelector('#hcaptcha-slot iframe', { timeout: 30000 });
    await page.waitForTimeout(2000);
    const m = await page.evaluate(() => { const i = document.querySelector('#hcaptcha-slot iframe').getBoundingClientRect(); const f = document.getElementById('contact-form'); const cs = getComputedStyle(f); const fr = f.getBoundingClientRect(); const b = document.getElementById('submit-btn').getBoundingClientRect(); return { ifrR: i.right, ifrW: i.width, ifrH: i.height, ifrBottom: i.bottom, innerR: fr.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth), cardR: fr.right, btnTop: b.top, sw: document.documentElement.scrollWidth - innerWidth }; });
    console.log(w, JSON.stringify(m), 'spare inside padding:', (m.innerR - m.ifrR).toFixed(1), 'gap widget->button:', (m.btnTop - m.ifrBottom).toFixed(1));
    if (w === 360 || w === 320) { const y = await page.evaluate(() => document.getElementById('hcaptcha-slot').getBoundingClientRect().top); await page.screenshot({ path: `shots/cap2__${w}-single78.png`, clip: { x: 0, y: Math.max(0, y - 150), width: w, height: 330 } }); }
    await ctx.close();
  }
  await browser.close();
})();
