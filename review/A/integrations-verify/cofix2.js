// Refined fix: hide the dead skeleton only under a visible error; give the loading line room only while loading.
const { chromium } = require('playwright');
const PROXY = process.env.HTTPS_PROXY;
const CSS = `[data-page="checkout"] #checkout-status.error:not([hidden]) ~ #checkout-form { display: none; }
[data-page="checkout"] .till-pay .status:not([hidden], .error) { margin-bottom: var(--s-4); }`;
(async () => {
  const browser = await chromium.launch({ proxy: { server: PROXY, bypass: 'localhost,127.0.0.1' } });
  for (const [name, q, mode, w, h, theme] of [['down', '?plan=starter-deposit', 'down', 390, 844, 'light'], ['down', '?plan=starter-deposit', 'down', 1280, 800, 'dark'], ['slow', '?plan=starter-deposit', 'slow', 390, 844, 'light'], ['noplan', '', 'none', 390, 844, 'light'], ['badplan', '?plan=Not%20Valid!', 'none', 1280, 800, 'light']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600, colorScheme: theme });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(String(e).slice(0, 120)));
    if (mode === 'down') await page.route(/onrender\.com/, r => r.abort('connectionrefused'));
    if (mode === 'slow') await page.route(/onrender\.com/, async r => { await new Promise(s => setTimeout(s, 30000)); try { await r.abort(); } catch (e) {} });
    await page.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await page.goto('http://localhost:8720/checkout/' + q, { waitUntil: 'domcontentloaded' });
    await page.addStyleTag({ content: CSS });
    if (mode === 'slow') await page.waitForFunction(() => /Waking up/.test(document.getElementById('checkout-status').textContent), null, { timeout: 20000 });
    else await page.waitForFunction(() => document.getElementById('checkout-status').classList.contains('error'), null, { timeout: 60000 });
    await page.waitForTimeout(2000);
    const m = await page.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.top + scrollY), Math.round(b.bottom + scrollY), Math.round(b.height)]; }; const st = document.getElementById('checkout-status'), fm = document.getElementById('checkout-form'), card = fm.closest('.card'); const cs = getComputedStyle(card); return { status: r(st), mb: getComputedStyle(st).marginBottom, formDisplay: getComputedStyle(fm).display, form: r(fm), card: r(card), padB: cs.paddingBottom, padT: cs.paddingTop, spaceBelowStatus: Math.round(card.getBoundingClientRect().bottom - st.getBoundingClientRect().bottom), label: r(card.querySelector('.label')) }; });
    console.log(name, w, theme, JSON.stringify(m), errs.join(';'));
    await page.screenshot({ path: `shots/fix2__${name}-${w}-${theme}.png`, fullPage: false });
    await ctx.close();
  }
  await browser.close();
})();
