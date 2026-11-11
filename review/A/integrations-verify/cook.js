// The mounted state: is the real Stripe form painted, with and without the fix CSS? Viewport screenshots (not fullPage).
const { chromium } = require('playwright');
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
const FIX_MINE = `[data-page="checkout"] #checkout-status.error:not([hidden]) ~ #checkout-form { display: none; }
[data-page="checkout"] .till-pay .status:not([hidden]) { margin-bottom: var(--s-4); }`;
(async () => {
  const browser = await chromium.launch({ proxy: PROXY ? { server: PROXY, bypass: 'localhost,127.0.0.1' } : undefined });
  for (const [name, css, w, h] of [['ok-nofix-m390', null, 390, 844], ['ok-myfix-m390', FIX_MINE, 390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.goto('http://localhost:8720/checkout/?plan=starter-deposit', { waitUntil: 'domcontentloaded' });
    if (css) await page.addStyleTag({ content: css });
    await page.waitForFunction(() => document.getElementById('checkout-status').hidden || document.getElementById('checkout-status').classList.contains('error'), null, { timeout: 90000 });
    for (const t of [1000, 5000, 12000]) {
      await page.waitForTimeout(t === 1000 ? 1000 : t - (t === 5000 ? 1000 : 5000));
      const m = await page.evaluate(() => { const fm = document.getElementById('checkout-form'); const st = document.getElementById('checkout-status'); const b = fm.getBoundingClientRect(); return { hidden: st.hidden, cls: st.className, formH: b.height, formY: b.y + scrollY, iframes: [...fm.querySelectorAll('iframe')].map(i => { const r = i.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), getComputedStyle(i).opacity, getComputedStyle(i).visibility, getComputedStyle(i).display]; }) }; });
      console.log(name, 't+' + t, JSON.stringify(m));
    }
    await page.evaluate(() => document.getElementById('checkout').scrollIntoView());
    await page.waitForTimeout(800);
    await page.screenshot({ path: `shots/${name}__viewport.png` });
    await ctx.close();
  }
  await browser.close();
})();
