// Try the two proposed CSS fixes by injecting them into the loaded page (the repository is not touched).
const { launch } = require('./lib');
(async () => {
  const b = await launch();
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.route(/onrender\.com/, r => r.abort());
    const page = await ctx.newPage(); await page.goto('http://localhost:8720/checkout/?plan=starter-deposit', { waitUntil: 'load' }); await page.waitForTimeout(6000);
    const m = () => page.evaluate(() => { const c = document.querySelector('.till-pay').getBoundingClientRect(), f = document.getElementById('checkout-form').getBoundingClientRect(); return { cardH: Math.round(c.height), formH: Math.round(f.height), pageH: document.documentElement.scrollHeight }; });
    console.log('server down, before fix', JSON.stringify(await m()));
    await page.addStyleTag({ content: '[data-page="checkout"] #checkout-status.error ~ #checkout-form { display: none; } [data-page="checkout"] .till-pay .status:not([hidden]) { margin-bottom: var(--s-4); }' });
    await page.waitForTimeout(300); console.log('server down, after fix ', JSON.stringify(await m()));
    await page.evaluate(() => scrollTo(0, 380)); await page.screenshot({ path: 'shots/states/fixtest__co-serverdown__m390.png' }); await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); await page.goto('http://localhost:8720/contact/', { waitUntil: 'load' });
    await page.locator('#submit-btn').scrollIntoViewIfNeeded(); await page.waitForFunction(() => { const f = document.querySelector('#hcaptcha-slot iframe'); return f && f.getBoundingClientRect().height > 20; }, null, { timeout: 30000 });
    const m = () => page.evaluate(() => { const f = document.querySelector('#hcaptcha-slot iframe').getBoundingClientRect(), t = document.getElementById('contact-form').getBoundingClientRect(), cs = getComputedStyle(document.getElementById('contact-form')); return { iframeRight: +f.right.toFixed(1), iframeH: +f.height.toFixed(1), cardRight: t.right, cardInnerRight: t.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth) }; });
    console.log('320 captcha, before fix', JSON.stringify(await m()));
    await page.addStyleTag({ content: '@media (max-width:339.98px){[data-page="contact"] .h-captcha{transform:scale(.78)}}' });
    await page.waitForTimeout(300); console.log('320 captcha, after fix ', JSON.stringify(await m()));
    await page.evaluate(() => document.getElementById('hcaptcha-slot').scrollIntoView({ block: 'center' })); await page.screenshot({ path: 'shots/contact/fixtest__captcha-320.png' }); await ctx.close(); }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
