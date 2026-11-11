const { chromium } = require('playwright');
const fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function run(label, BASE, hold, moved) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0, 100)));
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (u.includes('js.stripe.com')) { await sleep(hold); return r.fulfill({ body: 'window.Stripe = function () { window.__stripeCalled = true; return { initCheckoutFormSdk: function () { return { mount: function () {}, on: function () {} }; } }; };', contentType: 'application/javascript' }); }
    if (!u.startsWith(BASE)) return r.abort();
    if (moved && u.endsWith('/checkout/?plan=business-deposit')) {
      let html = fs.readFileSync('/home/user/Knightwebstudio/checkout/index.html', 'utf8');
      const tag = '<script src="https://js.stripe.com/dahlia/stripe.js"></script>';
      if (!html.includes(tag)) throw new Error('tag not found');
      html = html.replace(tag + '\n', '').replace('<script src="/assets/js/main.js" defer></script>\n<script>', '<script src="/assets/js/main.js" defer></script>\n' + tag + '\n<script>');
      if (html.indexOf(tag) < html.indexOf('main.js" defer')) throw new Error('move failed');
      return r.fulfill({ body: html, contentType: 'text/html' });
    }
    r.continue();
  });
  const t0 = Date.now();
  page.goto(BASE + '/checkout/?plan=business-deposit').catch(() => {});
  await sleep(1200);
  await page.screenshot({ path: __dirname + '/stripe-' + label + '-at1.2s.png' }).catch(() => {});
  await sleep(hold + 800);
  const r = await page.evaluate(() => ({ fp: Math.round((performance.getEntriesByType('paint').find(e => e.name === 'first-paint') || {}).startTime), fcp: Math.round((performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint') || {}).startTime), stripeCalled: !!window.__stripeCalled, status: (document.getElementById('checkout-status') || {}).textContent, summary: (document.querySelector('h1') || {}).textContent }));
  console.log(label, 'stripe held', hold + 'ms:', JSON.stringify(r), 'errors', JSON.stringify(errs));
  await b.close();
}
(async () => {
  await run('new-fast', 'http://localhost:8720', 0, false);
  await run('new-slow', 'http://localhost:8720', 3000, false);
  await run('live-slow', 'http://localhost:8700', 3000, false);
  await run('new-slow-moved', 'http://localhost:8720', 3000, true);
})();
