// Independent re-check of the checkout error / loading states. Real network, nothing blocked
// except what a given state needs (onrender.com for "server down").
const { chromium } = require('playwright');
const PROXY = process.env.HTTPS_PROXY || process.env.https_proxy;
const BASE = process.argv[2] || 'http://localhost:8720';
const TAG = process.argv[3] || 'new';
const measure = () => {
  const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +(b.y + scrollY).toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), bottom: +(b.bottom + scrollY).toFixed(1) }; };
  const st = document.getElementById('checkout-status');
  const fm = document.getElementById('checkout-form');
  const card = fm.closest('.card') || fm.parentElement;
  const kids = [...fm.querySelectorAll('*')].slice(0, 12).map(k => ({ tag: k.tagName, cls: (k.className || '').toString().slice(0, 60), style: (k.getAttribute('style') || '').slice(0, 200), rect: r(k), title: k.getAttribute('title') }));
  const cs = getComputedStyle(fm);
  return {
    statusText: st.textContent, statusHidden: st.hidden, statusClass: st.className, status: r(st),
    statusCS: { mt: getComputedStyle(st).marginTop, mb: getComputedStyle(st).marginBottom, display: getComputedStyle(st).display },
    form: r(fm), formStyle: fm.getAttribute('style'), formCS: { display: cs.display, mt: cs.marginTop, overflow: cs.overflow, minHeight: cs.minHeight },
    card: r(card), cardMinH: getComputedStyle(card).minHeight, cardPad: getComputedStyle(card).padding,
    kids, docH: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth - innerWidth,
  };
};
(async () => {
  const browser = await chromium.launch({ proxy: PROXY ? { server: PROXY, bypass: 'localhost,127.0.0.1' } : undefined });
  const out = {};
  const runs = [
    { name: 'down', plan: 'starter-deposit', block: true, wait: 'error' },
    { name: 'unknown', plan: 'not-a-plan', block: false, wait: 'error' },
    { name: 'slow', plan: 'business-deposit', delay: true, wait: 'waking' },
    { name: 'noplan', plan: '', block: false, wait: 'error' },
  ];
  const views = [ { n: 'm390', w: 390, h: 844, mobile: true }, { n: 'd1280', w: 1280, h: 800 } ];
  for (const v of views) for (const theme of ['light', 'dark']) for (const run of runs) {
    if (theme === 'dark' && run.name !== 'down') continue;
    const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, isMobile: !!v.mobile, hasTouch: !!v.mobile, colorScheme: theme });
    const page = await ctx.newPage();
    const log = [];
    page.on('console', m => { if (m.type() === 'error') log.push('console: ' + m.text().slice(0, 200)); });
    page.on('requestfailed', r => log.push('failed: ' + r.url().slice(0, 120) + ' ' + (r.failure() || {}).errorText));
    page.on('response', async r => { if (/onrender\.com/.test(r.url())) { let b = ''; try { b = (await r.text()).slice(0, 200); } catch (e) {} log.push('onrender ' + r.request().method() + ' ' + r.status() + ' ' + b + ' acao=' + (r.headers()['access-control-allow-origin'] || '')); } });
    if (run.block) await page.route(/onrender\.com/, r => r.abort('connectionrefused'));
    if (run.delay) await page.route(/onrender\.com/, async r => { await new Promise(s => setTimeout(s, 60000)); try { await r.abort(); } catch (e) {} });
    await page.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    const key = `${TAG}__${run.name}__${v.n}-${theme}`;
    try {
      await page.goto(`${BASE}/checkout/${run.plan ? '?plan=' + run.plan : ''}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      if (run.wait === 'error') await page.waitForFunction(() => document.getElementById('checkout-status').classList.contains('error'), null, { timeout: 90000 });
      else await page.waitForFunction(() => /Waking up/.test(document.getElementById('checkout-status').textContent), null, { timeout: 20000 });
      await page.waitForTimeout(2500);
      const m = await page.evaluate(measure);
      m.themeAttr = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      m.log = log;
      out[key] = m;
      await page.screenshot({ path: `shots/${key}.png`, fullPage: true });
    } catch (e) { out[key] = { error: String(e).slice(0, 300), log }; try { await page.screenshot({ path: `shots/${key}__ERR.png`, fullPage: true }); } catch (e2) {} }
    await ctx.close();
  }
  require('fs').writeFileSync(`co-${TAG}.json`, JSON.stringify(out, null, 1));
  for (const [k, m] of Object.entries(out)) {
    if (m.error) { console.log(k, 'ERROR', m.error, m.log); continue; }
    console.log(k, '| theme', m.themeAttr, '| status', JSON.stringify(m.status), m.statusClass, '| form', JSON.stringify(m.form), '| card', JSON.stringify(m.card), '| gap(form.top - status.bottom)=', (m.form.y - m.status.bottom).toFixed(1), '| docH', m.docH, '| ovx', m.overflowX);
    console.log('   text:', m.statusText.slice(0, 110), '| log:', m.log.slice(0, 4).join(' ; '));
  }
  await browser.close();
})();
