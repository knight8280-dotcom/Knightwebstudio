const { chromium, open, S } = require('./lib.js');
const fs = require('fs');
const views = (process.argv[2] || 'm-light,d-light').split(',');
const only = (process.argv[3] || '').split(',').filter(Boolean);
const base = 'http://localhost:8720';
fs.mkdirSync('states', { recursive: true });
(async () => {
  const browser = await chromium.launch();
  for (const view of views) for (const [name, s] of Object.entries(S)) {
    if (only.length && !only.some(o => name === o || name.startsWith(o))) continue;
    const { ctx, page, errors, serverCalls } = await open(browser, s, view);
    await page.goto(base + s.url, { waitUntil: 'load' });
    await page.waitForTimeout(s.wait || 1300);
    const m = await page.evaluate(() => {
      const vis = el => el && !el.closest('[hidden]') && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
      const t = id => { const el = document.getElementById(id); return el ? (vis(el) ? el.textContent.trim().replace(/\s+/g, ' ') : '(hidden)') : '(none)'; };
      const o = { over: document.documentElement.scrollWidth - innerWidth, h: document.documentElement.scrollHeight, h1: document.querySelector('h1').textContent.trim() };
      for (const id of ['checkout-status', 'checkout-plan-name', 'checkout-plan-price', 'success-status', 'success-sub', 'success-plan-name', 'success-plan-price', 'success-steps-project', 'success-steps-care', 'success-book', 'success-retry'])
        if (document.getElementById(id)) o[id] = t(id).slice(0, 140);
      const retry = document.getElementById('success-retry'); if (retry) o.retryHref = retry.getAttribute('href');
      const book = document.getElementById('success-book'); if (book) { o.bookHref = book.getAttribute('href'); o.bookTarget = book.target; }
      const form = document.getElementById('checkout-form'); if (form) o.formH = Math.round(form.getBoundingClientRect().height);
      return o;
    });
    console.log('\n' + name + '__' + view, JSON.stringify(m, null, 0), errors.length ? '\n   ERR ' + errors.join(' | ') : '', serverCalls.length ? '\n   server: ' + serverCalls.join(' ; ') : '');
    await page.screenshot({ path: `states/${name}__${view}.png`, fullPage: true });
    await ctx.close();
  }
  await browser.close();
})();
