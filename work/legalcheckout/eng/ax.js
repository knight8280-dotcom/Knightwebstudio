const { chromium, open, S } = require('./lib.js');
const base = 'http://localhost:8720';
(async () => {
  const browser = await chromium.launch();
  for (const [name, sel] of [['ok-paid', 'main'], ['co-care', 'main'], ['co-noplan', '.till-pay']]) {
    const { ctx, page } = await open(browser, S[name], 'm-light', { rm: 'reduce' });
    await page.goto(base + S[name].url); await page.waitForTimeout(900);
    const snap = await page.locator(sel).ariaSnapshot();
    console.log('== ' + name + '\n' + snap.split('\n').slice(0, 45).join('\n'));
    await ctx.close();
  }
  // no script: anything invisible or dead?
  for (const path of ['/privacy/', '/terms/', '/checkout/?plan=starter-deposit', '/checkout/success/?plan=starter-deposit&session_id=cs_test_a1b2c3d4e5f6g7h8']) for (const view of ['m-light', 'd-dark']) {
    const { ctx, page } = await open(browser, { url: path, nojs: true }, view);
    await page.goto(base + path); await page.waitForTimeout(400);
    // javascript is off, so evaluate is unavailable: use locators
    const count = async s => await page.locator(s).count();
    const visible = async s => (await count(s)) ? await page.locator(s).first().isVisible() : null;
    const r = { h1: await visible('h1'), prose: await visible('.prose'), toc: await visible('.toc'), status: await visible('#checkout-status'), noscriptMsg: await visible('.till-pay .status.error'), slip: await visible('.receipt'), steps: await visible('#success-steps-project'), book: await visible('#success-book'), retry: await visible('#success-retry'), successStatus: await visible('#success-status'), themeBtn: await visible('#theme-toggle'), burger: await visible('#nav-toggle'), navLinks: await visible('.nav-links a'), call: await visible('main a[href^="tel:"]') };
    console.log('nojs', path.slice(0, 26), view, JSON.stringify(r));
    await ctx.close();
  }
  await browser.close();
})();
