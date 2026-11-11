// Does the skeleton stay for good? Does the proposed CSS fix behave in error, loading and mounted states?
const { chromium } = require('playwright');
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
const BASE = 'http://localhost:8720';
const FIX_REVIEWER = `[data-page="checkout"] #checkout-status.error ~ #checkout-form { display: none; }
[data-page="checkout"] .till-pay .status:not([hidden]) { margin-bottom: var(--s-4); }`;
const FIX_MINE = `[data-page="checkout"] #checkout-status.error:not([hidden]) ~ #checkout-form { display: none; }
[data-page="checkout"] .till-pay .status:not([hidden]) { margin-bottom: var(--s-4); }`;
const measure = () => {
  const r = el => { const b = el.getBoundingClientRect(); return { y: +(b.y + scrollY).toFixed(1), h: +b.height.toFixed(1), bottom: +(b.bottom + scrollY).toFixed(1), w: +b.width.toFixed(1) }; };
  const st = document.getElementById('checkout-status'), fm = document.getElementById('checkout-form'), card = fm.closest('.card');
  const ifr = fm.querySelector('iframe');
  return { text: st.textContent.slice(0, 60), hidden: st.hidden, cls: st.className, status: r(st), form: r(fm), formDisplay: getComputedStyle(fm).display, card: r(card), cardMinH: getComputedStyle(card).minHeight, docH: document.documentElement.scrollHeight, iframe: ifr ? r(ifr) : null, nIframes: fm.querySelectorAll('iframe').length };
};
(async () => {
  const browser = await chromium.launch({ proxy: PROXY ? { server: PROXY, bypass: 'localhost,127.0.0.1' } : undefined });
  const res = {};
  async function run(name, { plan, mode, css, w = 390, h = 844, settle = 2500, theme = 'light' }) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 600, hasTouch: w < 600, colorScheme: theme });
    const page = await ctx.newPage();
    const log = [];
    page.on('console', m => { if (m.type() === 'error') log.push('console: ' + m.text().slice(0, 160)); });
    page.on('pageerror', e => log.push('pageerror: ' + String(e).slice(0, 200)));
    page.on('response', r => { if (r.status() >= 400) log.push(r.status() + ' ' + r.url().slice(0, 90)); });
    if (mode === 'down') await page.route(/onrender\.com/, r => r.abort('connectionrefused'));
    if (mode === 'slow') await page.route(/onrender\.com/, async r => { await new Promise(s => setTimeout(s, 40000)); try { await r.abort(); } catch (e) {} });
    await page.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await page.goto(`${BASE}/checkout/?plan=${plan}`, { waitUntil: 'domcontentloaded' });
    if (css) await page.addStyleTag({ content: css });
    if (mode === 'down') await page.waitForFunction(() => document.getElementById('checkout-status').classList.contains('error'), null, { timeout: 60000 });
    else if (mode === 'slow') await page.waitForFunction(() => /Waking up/.test(document.getElementById('checkout-status').textContent), null, { timeout: 20000 });
    else if (mode === 'ok') await page.waitForFunction(() => document.getElementById('checkout-status').hidden || document.getElementById('checkout-status').classList.contains('error'), null, { timeout: 90000 });
    await page.waitForTimeout(settle);
    const m = await page.evaluate(measure); m.log = log.slice(0, 6);
    res[name] = m;
    await page.screenshot({ path: `shots/fix__${name}.png`, fullPage: true });
    await ctx.close();
  }
  await run('down-nofix-after25s', { plan: 'starter-deposit', mode: 'down', settle: 25000 });
  await run('down-reviewerfix', { plan: 'starter-deposit', mode: 'down', css: FIX_REVIEWER });
  await run('down-myfix', { plan: 'starter-deposit', mode: 'down', css: FIX_MINE });
  await run('down-myfix-d1280-dark', { plan: 'starter-deposit', mode: 'down', css: FIX_MINE, w: 1280, h: 800, theme: 'dark' });
  await run('slow-nofix', { plan: 'starter-deposit', mode: 'slow' });
  await run('slow-myfix', { plan: 'starter-deposit', mode: 'slow', css: FIX_MINE });
  await run('ok-myfix', { plan: 'starter-deposit', mode: 'ok', css: FIX_MINE, settle: 6000 });
  require('fs').writeFileSync('cofix.json', JSON.stringify(res, null, 1));
  for (const [k, m] of Object.entries(res)) console.log(k, JSON.stringify({ text: m.text, hidden: m.hidden, cls: m.cls, status: m.status, form: m.form, disp: m.formDisplay, card: m.card, minH: m.cardMinH, docH: m.docH, iframe: m.iframe, n: m.nIframes }), '\n   ', m.log.join(' ; '));
  await browser.close();
})();
